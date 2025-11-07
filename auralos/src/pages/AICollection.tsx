import { useState } from 'react';
import { products } from '../data/products';
import { uploadImageToS3, validateImageFile, fileToBase64 } from '../services/s3Service';
import { invokeAgent, generateSessionId } from '../services/bedrockService';
import type { Product } from '../types/product';

interface AgentProductResult {
  productId: string;
  productName: string;
  reasoning: string;
  pros: string[];
  cons: string[];
}

type Stage = 'input' | 'conversation' | 'results';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface SearchResult {
  product: Product;
  matchScore: number;
  reasoning: string;
  pros: string[];
  cons: string[];
}

export default function AICollection() {
  // State management
  const [stage, setStage] = useState<Stage>('input');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageS3Key, setImageS3Key] = useState<string | null>(null);
  const [textPrompt, setTextPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => generateSessionId());
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userMessage, setUserMessage] = useState('');

  const handleImageUpload = async (files: File[]) => {
    setError(null);
    const file = files[0];

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const preview = await fileToBase64(file);
    setSelectedImage(preview);

    // Move to conversation stage immediately
    setStage('conversation');

    // Show initial loading message
    const loadingMessage: ChatMessage = {
      role: 'assistant',
      content: '✓ Image uploaded! Let me take a look at what you\'ve shared...',
      timestamp: Date.now()
    };
    setChatMessages([loadingMessage]);

    // Upload to S3 and get AI description
    setIsLoading(true);
    try {
      // Upload to S3 first
      const uploadResult = await uploadImageToS3(file);
      if (uploadResult.success) {
        setImageS3Key(uploadResult.s3Key);

        // Ask the Bedrock agent to describe the image
        const descriptionPrompt = `A user just uploaded an image to s3://${import.meta.env.VITE_S3_BUCKET}/${uploadResult.s3Key}. 
        
Please analyze this image and provide a brief, friendly description of what you see. Focus on:
- What type of product/accessory it is
- Key visual features (color, style, design elements)
- The general category (shoes, bag, jewelry, etc.)

Keep it conversational and under 2-3 sentences. Then ask what they're looking for.

Example format: "I can see you've uploaded [description of item]. [Notable feature]. Tell me more about what you're looking for! What style, price range, or specific features are you interested in?"`;

        const response = await invokeAgent(descriptionPrompt, sessionId, uploadResult.s3Key);

        // Replace loading message with AI description
        const descriptionMessage: ChatMessage = {
          role: 'assistant',
          content: response.text,
          timestamp: Date.now()
        };
        setChatMessages([descriptionMessage]);
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (err) {
      console.error('Error getting image description:', err);
      // Fallback to generic message
      const fallbackMessage: ChatMessage = {
        role: 'assistant',
        content: `✓ I can see you've uploaded an image${file.name ? ` (${file.name})` : ''}. Tell me more about what you're looking for! What style, price range, or specific features are you interested in?`,
        timestamp: Date.now()
      };
      setChatMessages([fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSearch = async () => {
    if (!selectedImage && !textPrompt.trim()) {
      setError('Please upload an image or enter a description');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Upload image to S3 if present and not already uploaded
      let s3Key: string | undefined = imageS3Key || undefined;
      if (selectedFile && !imageS3Key) {
        const uploadResult = await uploadImageToS3(selectedFile);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }
        s3Key = uploadResult.s3Key;
        setImageS3Key(s3Key);
      }

      // Create search query asking for top 3 results with pros/cons in JSON format
      const searchQuery = `Find the top 3 products that match this request: "${textPrompt.trim() || 'products similar to the uploaded image'}". 
      
Return ONLY a JSON array with exactly 3 products in this format:
[
  {
    "productId": "product-id",
    "productName": "Product Name",
    "reasoning": "Why this product matches the search",
    "pros": ["Pro 1", "Pro 2", "Pro 3"],
    "cons": ["Con 1", "Con 2"]
  }
]

Important: Return ONLY the JSON array, no other text.`;

      // Invoke Bedrock agent
      const response = await invokeAgent(searchQuery, sessionId, s3Key);

      // Parse the JSON response to get top 3 results
      const resultsData = parseAgentResponse(response.text);

      // Map results to actual products from our catalog
      const mappedResults: SearchResult[] = resultsData.map((result: AgentProductResult) => {
        // Find matching product (for now, use mock data - in production, match by ID)
        const product = products[Math.floor(Math.random() * products.length)];

        return {
          product,
          matchScore: 0.95,
          reasoning: result.reasoning || 'This product matches your search criteria',
          pros: result.pros || ['Great quality', 'Stylish design', 'Comfortable fit'],
          cons: result.cons || ['Limited color options', 'Slightly above budget']
        };
      });

      setSearchResults(mappedResults.slice(0, 3)); // Ensure only top 3
      setStage('results');

    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during search');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || isLoading) return;

    // Add user message to chat
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, newUserMessage]);
    setUserMessage('');
    setIsLoading(true);

    try {
      // Upload image to S3 if not already uploaded (for agent to reference)
      if (selectedFile && !imageS3Key) {
        try {
          const uploadResult = await uploadImageToS3(selectedFile);
          if (uploadResult.success) {
            setImageS3Key(uploadResult.s3Key);
          }
        } catch (uploadErr) {
          console.warn('S3 upload failed, continuing without S3 storage:', uploadErr);
        }
      }

      // Build conversation history for context
      const conversationHistory = chatMessages
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .filter(msg => msg); // Remove empty messages

      // Build message for agent
      const fullMessage = `
${selectedImage ? 'User uploaded an image of a fashion product/accessory.' : ''}
Previous conversation:
${conversationHistory.join('\n')}

User's new message: ${userMessage}

Please respond naturally and ask clarifying questions to help narrow down the perfect product. When you have enough information, say "I have enough information to show you the perfect matches!" and I'll show the results.`;

      // Use Bedrock agent
      const response = await invokeAgent(fullMessage, sessionId, imageS3Key || undefined);

      // Add AI response to chat
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: response.text,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, aiMessage]);

      // Check if AI is ready to show results
      if (response.text.toLowerCase().includes('perfect matches') ||
          response.text.toLowerCase().includes('show you') ||
          response.text.toLowerCase().includes('ready to search')) {
        // Trigger search with accumulated context
        setTimeout(() => {
          handleSearchFromConversation();
        }, 1000);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Re-add the message input if there was an error
      setUserMessage(newUserMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchFromConversation = async () => {
    setIsLoading(true);

    try {
      // Upload image to S3 if not already uploaded
      let s3KeyToUse = imageS3Key;
      if (selectedFile && !imageS3Key) {
        try {
          const uploadResult = await uploadImageToS3(selectedFile);
          if (uploadResult.success) {
            s3KeyToUse = uploadResult.s3Key;
            setImageS3Key(uploadResult.s3Key);
          }
        } catch (uploadErr) {
          console.warn('S3 upload failed, continuing without image context:', uploadErr);
        }
      }

      // Build search query from entire conversation
      const conversationSummary = chatMessages
        .filter(msg => msg.role === 'user')
        .map(msg => msg.content)
        .join(' ');

      const searchQuery = `Based on the uploaded image and user's requirements: "${conversationSummary}". 
      
Find the top 3 products that match. Return ONLY a JSON array:
[
  {
    "productId": "product-id",
    "productName": "Product Name",
    "reasoning": "Why this product matches the search",
    "pros": ["Pro 1", "Pro 2", "Pro 3"],
    "cons": ["Con 1", "Con 2"]
  }
]`;

      const response = await invokeAgent(searchQuery, sessionId, s3KeyToUse || undefined);
      const resultsData = parseAgentResponse(response.text);

      const mappedResults: SearchResult[] = resultsData.map((result: AgentProductResult) => {
        const product = products[Math.floor(Math.random() * products.length)];
        return {
          product,
          matchScore: 0.95,
          reasoning: result.reasoning || 'This product matches your search criteria',
          pros: result.pros || ['Great quality', 'Stylish design', 'Comfortable fit'],
          cons: result.cons || ['Limited color options', 'Slightly above budget']
        };
      });

      setSearchResults(mappedResults.slice(0, 3));
      setStage('results');

    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during search');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to parse agent JSON response
  const parseAgentResponse = (responseText: string): AgentProductResult[] => {
    try {
      // Try to extract JSON array from response
      const jsonMatch = responseText.match(/\[[^\]]*]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // If no JSON found, return mock data for top 3
      return [
        {
          productId: '1',
          productName: 'Product 1',
          reasoning: 'Matches your style preferences',
          pros: ['High quality materials', 'Versatile design', 'Comfortable'],
          cons: ['Limited availability']
        },
        {
          productId: '2',
          productName: 'Product 2',
          reasoning: 'Great alternative option',
          pros: ['Affordable price', 'Popular choice', 'Durable'],
          cons: ['May run small']
        },
        {
          productId: '3',
          productName: 'Product 3',
          reasoning: 'Similar aesthetic',
          pros: ['Trendy style', 'Multiple colors', 'Free shipping'],
          cons: ['Slightly over budget']
        }
      ];
    } catch (error) {
      console.error('Failed to parse response:', error);
      return [];
    }
  };

  return (
    <main>
      {/* Hero Section - New Layout - Only show on input stage */}
      {stage === 'input' && (
      <section style={{
        padding: '0', 
        margin: '0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff'
      }}>
        <div style={{
          maxWidth: '1400px',
          width: '100%',
          padding: '0 80px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '60px'
        }}>
          
          {/* Top: Find Your Fit Tagline */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: '72px',
              fontWeight: '500',
              fontFamily: 'Jost, sans-serif',
              letterSpacing: '0.05px',
              lineHeight: '80px',
              color: '#000',
              margin: '0'
            }}>
              Find Your <em style={{ fontStyle: 'italic' }}>Fit</em>
            </h1>
          </div>

          {/* Bottom: Image Upload (Left) and Search (Right) */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '100px',
            width: '100%',
            maxWidth: '1400px',
            justifyContent: 'space-between'
          }}>
            
            {/* Left: Image Upload Section - Larger */}
            <div style={{ flex: '2', maxWidth: '600px' }}>
            <div style={{
              border: '2px dashed #000',
              borderRadius: '16px',
              padding: '80px 60px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              textAlign: 'center',
              minHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.backgroundColor = '#f8f9fa';
              e.currentTarget.style.borderColor = '#333';
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.borderColor = '#000';
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.borderColor = '#000';
              const files = Array.from(e.dataTransfer.files);
              const imageFiles = files.filter(file => file.type.startsWith('image/'));
              if (imageFiles.length > 0) {
                handleImageUpload(imageFiles);
              }
            }}
            onClick={() => document.getElementById('imageUpload')?.click()}
            onMouseEnter={(e) => {
              if (!selectedImage) {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.borderColor = '#333';
              }
            }}
            onMouseLeave={(e) => {
              if (!selectedImage) {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.borderColor = '#000';
              }
            }}
            >
              {selectedImage ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px'
                }}>
                  <img
                    src={selectedImage}
                    alt="Uploaded preview"
                    style={{
                      width: '100%',
                      maxWidth: '350px',
                      height: 'auto',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(null);
                      setSelectedFile(null);
                      setError(null);
                    }}
                    style={{
                      padding: '10px 24px',
                      border: '1px solid #000',
                      backgroundColor: 'transparent',
                      color: '#000',
                      fontFamily: 'Jost, sans-serif',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#000';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#000';
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '20px'
                }}>
                  <svg
                    width="72"
                    height="72"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#000"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <div>
                    <p style={{
                      fontSize: '24px',
                      fontWeight: '500',
                      color: '#000',
                      marginBottom: '12px',
                      fontFamily: 'Jost, sans-serif'
                    }}>
                      Upload Image
                    </p>
                    <p style={{
                      fontSize: '16px',
                      color: '#666',
                      fontFamily: 'Jost, sans-serif',
                      margin: '0'
                    }}>
                      Drag & drop or click to browse
                    </p>
                  </div>
                </div>
              )}
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    handleImageUpload(files);
                  }
                }}
              />
            </div>
            
            {error && (
              <p style={{
                fontSize: '12px',
                color: '#ef4444',
                marginTop: '12px',
                fontFamily: 'Jost, sans-serif',
                textAlign: 'center'
              }}>
                {error}
              </p>
            )}
          </div>

            {/* Right: Search Bar and Button */}
            <div style={{ 
              flex: '1', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'stretch', 
              gap: '24px',
              maxWidth: '450px',
              marginTop: '40px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <input
                  type="text"
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                  placeholder="What are you looking for?"
                  style={{
                    flex: '1',
                    padding: '20px 24px',
                    fontSize: '16px',
                    border: '2px solid #000',
                    borderRadius: '8px',
                    outline: 'none',
                    fontFamily: 'Jost, sans-serif',
                    backgroundColor: '#fff',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#333';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.1)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#000';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleStartSearch();
                    }
                  }}
                />
                
                {/* Fancy Search Button */}
                <button
                  onClick={handleStartSearch}
                  disabled={isLoading || (!selectedImage && !textPrompt.trim())}
                  style={{
                    padding: '20px 32px',
                    backgroundColor: (isLoading || (!selectedImage && !textPrompt.trim())) ? '#ccc' : '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: (isLoading || (!selectedImage && !textPrompt.trim())) ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    fontFamily: 'Jost, sans-serif',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    minWidth: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && (selectedImage || textPrompt.trim())) {
                      e.currentTarget.style.backgroundColor = '#333';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading && (selectedImage || textPrompt.trim())) {
                      e.currentTarget.style.backgroundColor = '#000';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #fff',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                      Searching
                    </>
                  ) : (
                    <>
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                      </svg>
                      Search
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* Conversation Stage - Chatbox with Image */}
      {stage === 'conversation' && (
        <section style={{
          padding: '0',
          backgroundColor: '#fff',
          minHeight: '100vh'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '60px 40px',
            display: 'flex',
            gap: '40px',
            alignItems: 'flex-start'
          }}>
            {/* Left: Image Preview */}
            <div style={{ flex: '0 0 400px' }}>
              <div style={{
                position: 'sticky',
                top: '80px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '500',
                  fontFamily: 'Jost, sans-serif',
                  margin: '0 0 16px 0',
                  color: '#000'
                }}>
                  Your Image
                </h3>
                {selectedImage && (
                  <div style={{
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: '#f9fafb'
                  }}>
                    <img
                      src={selectedImage}
                      alt="Uploaded"
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block'
                      }}
                    />
                  </div>
                )}
                <p style={{
                  fontSize: '13px',
                  color: '#666',
                  fontFamily: 'Jost, sans-serif',
                  margin: '12px 0 0 0',
                  lineHeight: '1.5'
                }}>
                  ✓ Image uploaded successfully. The AI can see your image and will help you find similar products.
                </p>
              </div>
            </div>

            {/* Right: Chat Interface */}
            <div style={{ flex: 1 }}>
              <div style={{
                backgroundColor: '#fff',
                border: '2px solid #000',
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                height: 'calc(100vh - 160px)',
                maxHeight: '700px'
              }}>
                {/* Chat Header */}
                <div style={{
                  padding: '20px 24px',
                  borderBottom: '2px solid #000',
                  backgroundColor: '#fff'
                }}>
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: '500',
                    fontFamily: 'Jost, sans-serif',
                    margin: '0 0 8px 0',
                    color: '#000'
                  }}>
                    Tell Me More
                  </h2>
                  <p style={{
                    fontSize: '14px',
                    color: '#666',
                    fontFamily: 'Jost, sans-serif',
                    margin: 0,
                    lineHeight: '1.5'
                  }}>
                    Share details about what you're looking for to help me find the perfect match
                  </p>
                </div>

                {/* Chat Messages */}
                <div style={{
                  flex: 1,
                  padding: '24px',
                  overflowY: 'auto',
                  backgroundColor: '#fafafa'
                }}>
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      style={{
                        marginBottom: '20px',
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '75%',
                          padding: '14px 18px',
                          borderRadius: '12px',
                          backgroundColor: msg.role === 'user' ? '#000' : '#fff',
                          color: msg.role === 'user' ? '#fff' : '#000',
                          border: msg.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                          boxShadow: msg.role === 'assistant' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                      >
                        <p style={{
                          margin: 0,
                          fontSize: '15px',
                          lineHeight: '1.6',
                          fontFamily: 'Jost, sans-serif'
                        }}>
                          {msg.content}
                        </p>
                        <p style={{
                          margin: '8px 0 0 0',
                          fontSize: '11px',
                          opacity: 0.6,
                          fontFamily: 'Jost, sans-serif'
                        }}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      marginBottom: '20px'
                    }}>
                      <div style={{
                        padding: '14px 18px',
                        borderRadius: '12px',
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        color: '#666',
                        fontFamily: 'Jost, sans-serif',
                        fontSize: '15px'
                      }}>
                        AI is thinking...
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div style={{
                  padding: '20px 24px',
                  borderTop: '2px solid #000',
                  backgroundColor: '#fff'
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-end'
                  }}>
                    <textarea
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="E.g., 'I'm looking for casual shoes under $100' or 'Show me formal options'"
                      disabled={isLoading}
                      style={{
                        flex: 1,
                        minHeight: '60px',
                        maxHeight: '120px',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '15px',
                        fontFamily: 'Jost, sans-serif',
                        outline: 'none',
                        resize: 'vertical',
                        backgroundColor: isLoading ? '#f9fafb' : '#fff'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#000';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={isLoading || !userMessage.trim()}
                      style={{
                        padding: '14px 28px',
                        backgroundColor: (isLoading || !userMessage.trim()) ? '#ccc' : '#000',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '15px',
                        fontWeight: '600',
                        fontFamily: 'Jost, sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        cursor: (isLoading || !userMessage.trim()) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading && userMessage.trim()) {
                          e.currentTarget.style.backgroundColor = '#333';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoading && userMessage.trim()) {
                          e.currentTarget.style.backgroundColor = '#000';
                        }
                      }}
                    >
                      {isLoading ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                  <p style={{
                    fontSize: '12px',
                    color: '#999',
                    fontFamily: 'Jost, sans-serif',
                    margin: '12px 0 0 0'
                  }}>
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </div>

              {/* Skip to Results Button */}
              <div style={{
                marginTop: '20px',
                textAlign: 'center'
              }}>
                <button
                  onClick={handleSearchFromConversation}
                  disabled={isLoading || chatMessages.filter(m => m.role === 'user').length === 0}
                  style={{
                    padding: '12px 32px',
                    backgroundColor: '#fff',
                    color: '#000',
                    border: '2px solid #000',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: 'Jost, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    cursor: (isLoading || chatMessages.filter(m => m.role === 'user').length === 0) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: (isLoading || chatMessages.filter(m => m.role === 'user').length === 0) ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && chatMessages.filter(m => m.role === 'user').length > 0) {
                      e.currentTarget.style.backgroundColor = '#000';
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading && chatMessages.filter(m => m.role === 'user').length > 0) {
                      e.currentTarget.style.backgroundColor = '#fff';
                      e.currentTarget.style.color = '#000';
                    }
                  }}
                >
                  Show Me Results →
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Add CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      {/* Results Stage - Full Page */}
      {stage === 'results' && (
        <section style={{
          padding: '0',
          backgroundColor: '#fff',
          minHeight: '100vh'
        }}>
          {/* Search Bar at Top - ALDO Style */}
          <div style={{
            backgroundColor: '#fff',
            borderBottom: '1px solid #e5e7eb',
            padding: '20px 60px',
            position: 'sticky',
            top: 0,
            zIndex: 100
          }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '12px'
              }}>
                <button
                  onClick={() => setStage('input')}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#fff',
                    color: '#000',
                    border: '1px solid #000',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: 'Jost, sans-serif',
                    letterSpacing: '0.5px',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#000';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.color = '#000';
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                  New Search
                </button>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  border: '1px solid #000',
                  backgroundColor: '#fff'
                }}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#000"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    placeholder="Search by keyword, style, etc."
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      fontSize: '14px',
                      fontFamily: 'Jost, sans-serif',
                      backgroundColor: 'transparent'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleStartSearch();
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleStartSearch}
                  disabled={isLoading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: isLoading ? '#ccc' : '#000',
                    color: '#fff',
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: 'Jost, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) e.currentTarget.style.backgroundColor = '#333';
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) e.currentTarget.style.backgroundColor = '#000';
                  }}
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
              <p style={{
                fontSize: '14px',
                color: '#666',
                margin: '12px 0 0 0',
                fontFamily: 'Jost, sans-serif'
              }}>
                {searchResults.length} Results {textPrompt && `for "${textPrompt}"`}
              </p>
            </div>
          </div>

          {/* Main Content Area */}
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 60px' }}>
            {/* Filters and Sort Bar - ALDO Style */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px',
              paddingBottom: '20px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <button
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #000',
                    backgroundColor: '#fff',
                    color: '#000',
                    fontSize: '14px',
                    fontFamily: 'Jost, sans-serif',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="4" y1="12" x2="20" y2="12" />
                    <line x1="4" y1="18" x2="20" y2="18" />
                  </svg>
                  Filters
                </button>
                <span style={{
                  fontSize: '14px',
                  color: '#666',
                  fontFamily: 'Jost, sans-serif'
                }}>
                  {searchResults.length} Results
                </span>
              </div>

              <button
                style={{
                  padding: '8px 16px',
                  border: '1px solid #000',
                  backgroundColor: '#fff',
                  color: '#000',
                  fontSize: '14px',
                  fontFamily: 'Jost, sans-serif',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                Sort by
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            {/* 3-Column Grid of Products - ALDO Style */}
            {searchResults.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '20px',
                marginBottom: '40px'
              }}>
                {searchResults.map((result, index) => (
                  <div
                    key={result.product.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      backgroundColor: '#fff',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {/* Product Image */}
                    <div style={{
                      position: 'relative',
                      backgroundColor: '#f3f4f6',
                      overflow: 'hidden',
                      marginBottom: '16px'
                    }}>
                      {/* Rank Badge */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        backgroundColor: '#000',
                        color: '#fff',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: '700',
                        fontFamily: 'Jost, sans-serif',
                        zIndex: 10
                      }}>
                        {index + 1}
                      </div>
                      <img
                        src={result.product.image}
                        alt={result.product.name}
                        style={{
                          width: '100%',
                          height: 'auto',
                          display: 'block'
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div style={{ padding: '0 8px' }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '400',
                        fontFamily: 'Jost, sans-serif',
                        margin: '0 0 8px 0',
                        color: '#000',
                        lineHeight: '1.4'
                      }}>
                        {result.product.name}
                      </h3>
                      <p style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        fontFamily: 'Jost, sans-serif',
                        margin: '0 0 16px 0',
                        color: '#000'
                      }}>
                        ${result.product.price}
                      </p>

                      {/* Reasoning */}
                      <p style={{
                        fontSize: '13px',
                        color: '#666',
                        fontFamily: 'Jost, sans-serif',
                        lineHeight: '1.5',
                        margin: '0 0 16px 0',
                        fontStyle: 'italic'
                      }}>
                        {result.reasoning}
                      </p>

                      {/* Pros Section */}
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #86efac',
                        borderRadius: '4px',
                        marginBottom: '12px'
                      }}>
                        <h4 style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          fontFamily: 'Jost, sans-serif',
                          margin: '0 0 8px 0',
                          color: '#166534',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          ✓ Pros
                        </h4>
                        <ul style={{
                          margin: 0,
                          paddingLeft: '16px',
                          listStyleType: 'disc'
                        }}>
                          {result.pros.map((pro, i) => (
                            <li
                              key={i}
                              style={{
                                fontSize: '12px',
                                color: '#15803d',
                                fontFamily: 'Jost, sans-serif',
                                lineHeight: '1.5',
                                marginBottom: '4px'
                              }}
                            >
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Cons Section */}
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fca5a5',
                        borderRadius: '4px',
                        marginBottom: '16px'
                      }}>
                        <h4 style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          fontFamily: 'Jost, sans-serif',
                          margin: '0 0 8px 0',
                          color: '#991b1b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          ⚠ Cons
                        </h4>
                        <ul style={{
                          margin: 0,
                          paddingLeft: '16px',
                          listStyleType: 'disc'
                        }}>
                          {result.cons.map((con, i) => (
                            <li
                              key={i}
                              style={{
                                fontSize: '12px',
                                color: '#dc2626',
                                fontFamily: 'Jost, sans-serif',
                                lineHeight: '1.5',
                                marginBottom: '4px'
                              }}
                            >
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* View Button */}
                      <button
                        onClick={() => {
                          window.open(`https://www.aldoshoes.com/us/en_US/search?q=${encodeURIComponent(result.product.name)}`, '_blank');
                        }}
                        style={{
                          width: '100%',
                          padding: '12px',
                          backgroundColor: '#000',
                          color: '#fff',
                          border: 'none',
                          fontSize: '13px',
                          fontWeight: '500',
                          fontFamily: 'Jost, sans-serif',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#333';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#000';
                        }}
                      >
                        View Product
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: '#666',
                fontFamily: 'Jost, sans-serif'
              }}>
                <p style={{ fontSize: '18px' }}>No results found. Please try a different search.</p>
              </div>
            )}

            {/* Refine Search Section with Chatbox */}
            <div style={{
              marginTop: '40px',
              padding: '30px',
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '500',
                fontFamily: 'Jost, sans-serif',
                margin: '0 0 16px 0',
                color: '#000'
              }}>
                Refine Your Search
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#666',
                fontFamily: 'Jost, sans-serif',
                margin: '0 0 20px 0',
                lineHeight: '1.6'
              }}>
                Not quite what you're looking for? Tell our AI assistant more about what you want, and we'll find better matches.
              </p>

              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <textarea
                  placeholder="E.g., 'I need something more formal' or 'Show me options under $50'"
                  style={{
                    flex: 1,
                    minHeight: '80px',
                    padding: '12px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontFamily: 'Jost, sans-serif',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#000';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#d1d5db';
                  }}
                />
                <button
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#000',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    fontFamily: 'Jost, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#333';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#000';
                  }}
                >
                  Refine →
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
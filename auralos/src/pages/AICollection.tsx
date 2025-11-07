import { useState, useEffect, useRef } from 'react';
import { products } from '../data/products';
import ProductCard from '../components/ProductCard';
import { uploadImageToS3, validateImageFile, fileToBase64 } from '../services/s3Service';
import { invokeAgent, generateSessionId } from '../services/bedrockService';
import type { AgentMessage } from '../services/bedrockService';
import type { Product } from '../types/product';

type Stage = 'input' | 'conversation' | 'results';

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
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
  };

  const handleStartSearch = async () => {
    if (!selectedImage && !textPrompt.trim()) {
      setError('Please upload an image or enter a description');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStage('conversation');

    try {
      // Upload image to S3 if present
      let s3Key: string | undefined;
      if (selectedFile) {
        const uploadResult = await uploadImageToS3(selectedFile);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }
        s3Key = uploadResult.s3Key;
        setImageS3Key(s3Key);
      }

      // Create initial message
      const initialMessage = textPrompt.trim() || 'I uploaded an image. Can you help me find similar products?';

      // Add user message to chat
      const userMessage: AgentMessage = {
        role: 'user',
        content: initialMessage,
        timestamp: Date.now()
      };
      setMessages([userMessage]);

      // Invoke Bedrock agent - it will handle out-of-scope queries naturally
      const response = await invokeAgent(initialMessage, sessionId, s3Key);

      // Add agent response to chat
      const agentMessage: AgentMessage = {
        role: 'agent',
        content: response.text,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, agentMessage]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStage('input');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage: AgentMessage = {
      role: 'user',
      content: userInput,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await invokeAgent(userInput, sessionId, imageS3Key || undefined);

      const agentMessage: AgentMessage = {
        role: 'agent',
        content: response.text,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, agentMessage]);

      // Check if agent provided results (simple heuristic - check for product recommendations)
      if (response.text.toLowerCase().includes('recommend') || response.text.toLowerCase().includes('product')) {
        // For now, show sample results. In production, parse agent response
        setSearchResults([]);
        setStage('results');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStage('input');
    setSelectedImage(null);
    setSelectedFile(null);
    setImageS3Key(null);
    setTextPrompt('');
    setMessages([]);
    setUserInput('');
    setSearchResults([]);
    setError(null);
  };

  return (
    <main>
      {/* Hero Section - New Layout */}
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

      {/* Add CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>



      {/* Conversation Stage */}
      {stage === 'conversation' && (
        <section style={{
          padding: '40px 20px',
          backgroundColor: '#f8fafc',
          minHeight: '70vh'
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Header with Reset Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px'
            }}>
              <h2 style={{ fontSize: '28px', margin: 0 }}>AI Conversation</h2>
              <button
                onClick={handleReset}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  color: '#6366F1',
                  background: '#fff',
                  border: '2px solid #6366F1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                New Search
              </button>
            </div>

            {/* Image Preview (if uploaded) */}
            {selectedImage && (
              <div style={{
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#fff',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <img
                  src={selectedImage}
                  alt="Your upload"
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
                <div>
                  <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Your Image</p>
                  <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
                    AI is analyzing this image
                  </p>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              minHeight: '400px',
              maxHeight: '500px',
              overflowY: 'auto',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              {messages.map((msg, idx) => (
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
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: msg.role === 'user' ? '#6366F1' : '#F3F4F6',
                      color: msg.role === 'user' ? '#fff' : '#1F2937'
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.5' }}>
                      {msg.content}
                    </p>
                    <p style={{
                      margin: '8px 0 0 0',
                      fontSize: '11px',
                      opacity: 0.7
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
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: '#F3F4F6',
                    color: '#6B7280'
                  }}>
                    <span>AI is thinking</span>
                    <span className="typing-dots">...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div style={{
              display: 'flex',
              gap: '10px'
            }}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your message..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  fontSize: '16px',
                  borderRadius: '12px',
                  border: '2px solid #D1D5DB',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !userInput.trim()}
                style={{
                  padding: '14px 30px',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#fff',
                  background: (isLoading || !userInput.trim())
                    ? '#9CA3AF'
                    : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: (isLoading || !userInput.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                Send
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Results Stage */}
      {stage === 'results' && (
        <section style={{
          padding: '60px 20px',
          backgroundColor: '#fff'
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '40px'
            }}>
              <h2 style={{ fontSize: '32px', margin: 0 }}>Recommended Products</h2>
              <button
                onClick={handleReset}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  color: '#6366F1',
                  background: '#fff',
                  border: '2px solid #6366F1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                New Search
              </button>
            </div>

            {/* Show search results if any, otherwise show default products */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '30px'
            }}>
              {(searchResults.length > 0 ? searchResults.map(r => r.product) : products.slice(0, 12)).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
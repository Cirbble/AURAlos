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
  const [isFocused, setIsFocused] = useState(false);

  const placeholders = [
    "black leather boots",
    "white sneakers",
    "heeled sandals",
    "crossbody bags",
    "ankle boots",
    "loafers",
    "platform heels",
    "tote bags",
    "mules",
    "oxfords"
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Carousel animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [placeholders.length]);

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
      {/* Hero Section */}
      <section style={{ padding: '0', margin: '0' }}>
        <div style={{
          maxWidth: '100%',
          margin: '0 auto',
          padding: '80px 80px 60px 80px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '60px',
            fontWeight: '500',
            fontFamily: 'Jost, sans-serif',
            letterSpacing: '0.05px',
            lineHeight: '64px',
            color: '#000',
            marginBottom: '20px'
          }}>
            Find Your <em style={{ fontStyle: 'italic' }}>Fit</em>
          </h1>

          {/* Interactive Search Bar with Carousel */}
          <div style={{
            maxWidth: '600px',
            margin: '0 auto 30px auto',
            padding: '18px 24px',
            border: `1px solid ${isFocused ? '#000' : '#ddd'}`,
            backgroundColor: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'border-color 0.2s ease'
          }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#999"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: '16px',
              color: '#999',
              whiteSpace: 'nowrap'
            }}>
              Searching for
            </span>
            <div style={{
              position: 'relative',
              flex: 1,
              minWidth: 0,
              height: '24px',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%'
              }}>
                {placeholders.map((placeholder, idx) => {
                  // Calculate position for continuous upward rotation
                  let position = idx - placeholderIndex;

                  // Wrap around: if item is "behind", show it below waiting
                  if (position < 0) {
                    position += placeholders.length;
                  }

                  // Determine opacity for smooth transitions
                  let opacity = 0;
                  if (position === 0) opacity = 1; // Current item
                  if (position === placeholders.length - 1) opacity = 0.3; // Item coming from below

                  return (
                    <input
                      key={idx}
                      type="text"
                      value={textPrompt}
                      onChange={(e) => setTextPrompt(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder={placeholder}
                      disabled={idx !== placeholderIndex}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        fontFamily: 'Jost, sans-serif',
                        fontSize: '16px',
                        color: '#000',
                        fontWeight: '500',
                        backgroundColor: 'transparent',
                        pointerEvents: idx === placeholderIndex ? 'auto' : 'none',
                        transform: `translateY(${position * 100}%)`,
                        transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease',
                        opacity: opacity
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <style>{`
            input::placeholder {
              color: #000;
              opacity: 1;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
          `}</style>

          <p style={{
            fontSize: '18px',
            color: '#000',
            lineHeight: '26px',
            maxWidth: '700px',
            margin: '0 auto 30px',
            fontWeight: '400',
            fontFamily: 'Jost, sans-serif'
          }}>
            Upload an image and discover products that match your style. Our AI helps you find exactly what you're looking for.
          </p>

          {/* Search Button for Text-Only Search */}
          {textPrompt.trim() && !selectedImage && (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleStartSearch}
                disabled={isLoading}
                style={{
                  padding: '16px 60px',
                  backgroundColor: isLoading ? '#999' : '#000',
                  color: '#fff',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily: 'Jost, sans-serif',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
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
          )}
        </div>
      </section>

      {/* Main Content */}
      {stage === 'input' && (
        <section style={{
          padding: '0',
          margin: '0',
          backgroundColor: '#fff'
        }}>
          <div style={{
            width: '100%',
            padding: '0 80px 80px 80px',
            margin: '0'
          }}>
            <div style={{
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              {/* Image Upload Section */}
              <div style={{
                border: '1px solid #000',
                padding: '80px 60px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.style.backgroundColor = '#fafafa';
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.currentTarget.style.backgroundColor = '#fff';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.backgroundColor = '#fff';
                const files = Array.from(e.dataTransfer.files);
                const imageFiles = files.filter(file => file.type.startsWith('image/'));
                if (imageFiles.length > 0) {
                  handleImageUpload(imageFiles);
                }
              }}
              onClick={() => document.getElementById('imageUpload')?.click()}
              >
                {selectedImage ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px'
                  }}>
                    <img
                      src={selectedImage}
                      alt="Uploaded preview"
                      style={{
                        width: '100%',
                        maxWidth: '400px',
                        height: 'auto'
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
                        padding: '14px 48px',
                        border: '1px solid #000',
                        backgroundColor: '#000',
                        color: '#fff',
                        fontFamily: 'Jost, sans-serif',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.color = '#000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#000';
                        e.currentTarget.style.color = '#fff';
                      }}
                    >
                      Remove Image
                    </button>
                    {isLoading && (
                      <div style={{
                        fontFamily: 'Jost, sans-serif',
                        fontSize: '15px',
                        color: '#666'
                      }}>
                        Processing...
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '24px'
                  }}>
                    <svg
                      width="72"
                      height="72"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#000"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{
                        fontSize: '20px',
                        fontWeight: '500',
                        color: '#000',
                        marginBottom: '10px',
                        fontFamily: 'Jost, sans-serif',
                        letterSpacing: '0.5px'
                      }}>
                        Drag and drop your image here
                      </p>
                      <p style={{
                        fontSize: '15px',
                        color: '#999',
                        fontFamily: 'Jost, sans-serif'
                      }}>
                        or click to browse files
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
                  fontSize: '13px',
                  color: '#ef4444',
                  marginTop: '16px',
                  fontFamily: 'Jost, sans-serif',
                  textAlign: 'left'
                }}>
                  {error}
                </p>
              )}

              <p style={{
                fontSize: '13px',
                color: '#999',
                marginTop: '16px',
                fontFamily: 'Jost, sans-serif',
                textAlign: 'left',
                letterSpacing: '0.3px'
              }}>
                Supported formats: JPG, PNG, GIF (max 5MB)
              </p>
            </div>

            {/* OR Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              maxWidth: '800px',
              margin: '40px auto'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#000' }} />
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#000',
                fontFamily: 'Jost, sans-serif',
                letterSpacing: '0.5px'
              }}>
                OR
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#000' }} />
            </div>

            {/* Text Prompt Area */}
            <div style={{
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              <h3 style={{
                fontSize: '18px',
                marginBottom: '15px',
                color: '#000',
                fontFamily: 'Jost, sans-serif',
                fontWeight: '500'
              }}>
                Describe What You're Looking For
              </h3>
              <textarea
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="E.g., 'Black leather ankle boots with a block heel, suitable for office wear, under $150'"
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '15px',
                  fontSize: '16px',
                  border: '1px solid #000',
                  resize: 'vertical',
                  fontFamily: 'Jost, sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#000'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#000'}
              />
            </div>

            {/* Start Search Button */}
            <div style={{
              maxWidth: '800px',
              margin: '30px auto 0'
            }}>
              <button
                onClick={handleStartSearch}
                disabled={isLoading || (!selectedImage && !textPrompt.trim())}
                style={{
                  width: '100%',
                  padding: '18px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#fff',
                  backgroundColor: (isLoading || (!selectedImage && !textPrompt.trim())) ? '#999' : '#000',
                  border: 'none',
                  cursor: (isLoading || (!selectedImage && !textPrompt.trim())) ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  fontFamily: 'Jost, sans-serif',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && (selectedImage || textPrompt.trim())) {
                    e.currentTarget.style.backgroundColor = '#333';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading && (selectedImage || textPrompt.trim())) {
                    e.currentTarget.style.backgroundColor = '#000';
                  }
                }}
              >
                {isLoading ? 'Starting AI Search...' : 'Start AI Search'}
              </button>
            </div>
          </div>
        </section>
      )}

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
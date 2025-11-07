import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { invokeAgent, generateSessionId } from '../services/bedrockService';
import { products } from '../data/products';
import type { Product } from '../types/product';

interface SearchResult {
  product: Product;
  matchScore: number;
  reasoning: string;
  pros: string[];
  cons: string[];
}

interface RefinementQuestion {
  metric: string;
  question: string;
  type: 'likert' | 'open';
}

interface LikertResponse {
  question: string;
  metric: string;
  value: number;
  label: string;
}

// Predetermined bank of Likert questions
const LIKERT_QUESTION_BANK: RefinementQuestion[] = [
  {
    metric: 'overall_satisfaction',
    question: 'How satisfied are you with these recommendations overall?',
    type: 'likert'
  },
  {
    metric: 'style_match',
    question: 'How well do these products match your style preferences?',
    type: 'likert'
  },
  {
    metric: 'price_satisfaction',
    question: 'Are you satisfied with the price range shown?',
    type: 'likert'
  }
];

export default function AISearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchResults, query } = location.state || {};

  // Refinement state
  const [isRefining, setIsRefining] = useState(false);
  const [refinementMode, setRefinementMode] = useState<'guided' | 'direct' | null>(null);
  const [likertResponses, setLikertResponses] = useState<LikertResponse[]>([]);
  const [userFeedback, setUserFeedback] = useState('');
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [sessionId] = useState(() => generateSessionId());
  const [refinedResults, setRefinedResults] = useState<SearchResult[] | null>(null);
  const [refinementRound, setRefinementRound] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(0);
  const [refinementHistory, setRefinementHistory] = useState<Array<{
    round: number;
    likertResponses: LikertResponse[];
    userFeedback: string;
    results: SearchResult[];
  }>>([]);

  const loadingMessages = [
    "🔍 Analyzing your preferences...",
    "✨ Matching with our catalog...",
    "🎨 Finding perfect styles...",
    "💡 Calculating best matches...",
    "🎯 Almost there..."
  ];

  // Loading message rotation
  useEffect(() => {
    if (!isLoadingQuestion) {
      setLoadingMessage(0);
      return;
    }

    const interval = setInterval(() => {
      setLoadingMessage(prev => (prev + 1) % loadingMessages.length);
    }, 2000); // Rotate every 2 seconds

    return () => clearInterval(interval);
  }, [isLoadingQuestion, loadingMessages.length]);

  useEffect(() => {
    // Redirect to find-your-fit if no results
    if (!searchResults || searchResults.length === 0) {
      navigate('/find-your-fit');
    }
  }, [searchResults, navigate]);

  if (!searchResults) return null;

  const displayResults = refinedResults || searchResults;

  // Helper function for product matching (same as AICollection)
  const findBestProductMatch = (productName: string): Product | undefined => {
    console.log(`🔍 STRICT MATCHING for: "${productName}"`);
    const productNameLower = productName.toLowerCase();
    
    // Try exact match first
    let product = products.find(p => 
      p.name.toLowerCase() === productNameLower
    );
    
    if (product) {
      console.log(`✅ EXACT MATCH: "${product.name}"`);
      return product;
    }
    
    // Color-aware matching ONLY
    const colorWords = ['black', 'white', 'brown', 'green', 'blue', 'red', 'pink', 'grey', 'gray', 'beige', 'burgundy', 'navy', 'tan', 'cognac', 'emerald', 'dark', 'light', 'other', 'cognac', 'bordo', 'ice', 'gold'];
    const hasColorInSearch = colorWords.some(color => productNameLower.includes(color));
    
    if (hasColorInSearch) {
      const baseNameMatch = productNameLower.split(/[\s(]/)[0];
      const matchingBaseProducts = products.filter(p =>
        p.name.toLowerCase().includes(baseNameMatch)
      );
      
      product = matchingBaseProducts.find(p => {
        const pNameLower = p.name.toLowerCase();
        const matchingColor = colorWords.find(color => 
          productNameLower.includes(color) && pNameLower.includes(color)
        );
        
        if (matchingColor) {
          console.log(`✅ COLOR MATCH: "${p.name}" (matched on color: ${matchingColor})`);
          return true;
        }
        return false;
      });
      
      if (product) return product;
    }
    
    console.error(`❌ NO MATCH FOUND for "${productName}"`);
    return undefined;
  };

  const handleRefineSearch = () => {
    setIsRefining(true);
    setRefinementMode('guided'); // Go directly to guided mode
    setLikertResponses([]); // Reset for new session
    setUserFeedback('');
    setRefinementRound(refinedResults ? refinementRound + 1 : 1);
  };

  const handleLikertResponse = (questionIndex: number, value: number, label: string) => {
    const question = LIKERT_QUESTION_BANK[questionIndex];
    const response: LikertResponse = {
      question: question.question,
      metric: question.metric,
      value,
      label
    };

    setLikertResponses(prev => {
      const updated = [...prev];
      updated[questionIndex] = response;
      return updated;
    });
  };

  const handleSubmitRefinement = async () => {
    // Check if all Likert questions are answered
    const allAnswered = likertResponses.length === LIKERT_QUESTION_BANK.length;

    if (!allAnswered) {
      alert('Please answer all questions before submitting.');
      return;
    }

    setIsLoadingQuestion(true);

    try {
      // Build comprehensive prompt with all context
      const previousResultsSummary = displayResults.map((r: SearchResult, i: number) =>
        `${i + 1}. ${r.product.name} (${r.matchScore}% match) - ${r.reasoning}`
      ).join('\n');

      const likertSummary = likertResponses.map(r =>
        `${r.question}: ${r.label} (${r.value}/7)`
      ).join('\n');

      const historyContext = refinementHistory.length > 0
        ? `\n\nPrevious Refinement Rounds:\n${refinementHistory.map(h => 
            `Round ${h.round}:\nUser feedback: ${h.userFeedback || 'None'}\nResults: ${h.results.map(r => r.product.name).join(', ')}`
          ).join('\n\n')}`
        : '';

      const prompt = `User's original search query: "${query}"

CURRENT TOP 3 RESULTS:
${previousResultsSummary}

USER'S LIKERT SCALE RESPONSES:
${likertSummary}

USER'S ADDITIONAL FEEDBACK:
${userFeedback || 'None provided'}
${historyContext}

Based on the user's Likert responses and feedback, find 3 NEW products that better match their preferences.

CRITICAL INSTRUCTIONS:
1. Consider the Likert scores - low scores (1-3) mean dissatisfaction, high scores (5-7) mean satisfaction
2. If they're unsatisfied with style, find different styles
3. If they're unsatisfied with price, adjust the price range
4. If they're unsatisfied with color, find different colors
5. If they provided specific feedback, prioritize that over Likert scores
6. The user feedback is the MOST IMPORTANT - follow it exactly
7. Return products that exist in the ALDO catalog

Return EXACTLY 3 products in this JSON format:
{
  "results": [
    {
      "productName": "Product Name (Color Variant)",
      "score": 85,
      "reasoning": "This addresses your concerns because...",
      "pros": ["Benefit 1", "Benefit 2", "Benefit 3"],
      "cons": ["Consideration 1", "Consideration 2"]
    }
  ]
}

CRITICAL: productName MUST include the color variant in parentheses exactly as it appears in the knowledge base.`;

      const response = await invokeAgent(prompt, sessionId);
      console.log('🤖 Refinement response:', response.text);

      const trimmed = response.text.trim();
      let parsed;

      if (trimmed.startsWith('{')) {
        parsed = JSON.parse(trimmed);
      } else {
        const firstBrace = trimmed.indexOf('{');
        const lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          const jsonStr = trimmed.substring(firstBrace, lastBrace + 1);
          parsed = JSON.parse(jsonStr);
        }
      }

      if (parsed && parsed.results && Array.isArray(parsed.results)) {
        const results: SearchResult[] = parsed.results.map((result: { productName?: string; name?: string; product_name?: string; score?: number; reasoning?: string; pros?: string[]; cons?: string[] }) => {
          const productName = result.productName || result.name || result.product_name;

          if (!productName) {
            throw new Error('Result has no product name');
          }

          const product = findBestProductMatch(productName);

          if (!product) {
            console.error(`❌ NO MATCH FOUND - Agent returned: "${productName}"`);
            throw new Error(`Product "${productName}" not found in catalog.`);
          }

          return {
            product,
            matchScore: result.score || 0,
            reasoning: result.reasoning || '',
            pros: result.pros || [],
            cons: result.cons || []
          };
        });

        // Save to history
        setRefinementHistory(prev => [...prev, {
          round: refinementRound,
          likertResponses: [...likertResponses],
          userFeedback,
          results: displayResults
        }]);

        setRefinedResults(results);
        setIsRefining(false);
        setRefinementMode(null);
        setLikertResponses([]);
        setUserFeedback('');
      }
    } catch (error) {
      console.error('Error getting refined results:', error);
      alert('Failed to get refined results. Please try again.');
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // Old refinement functions removed - now using predetermined Likert question bank

  return (
    <main style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <section style={{
        padding: '40px 80px 80px 80px',
        backgroundColor: '#fff',
        minHeight: '100vh'
      }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
          {/* Search Query Display */}
          <div style={{
            marginBottom: '30px'
          }}>
            <div style={{
              fontSize: '28px',
              fontWeight: '500',
              marginBottom: '8px',
              fontFamily: 'Jost, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {query || 'AI Visual Search Results'}
              {refinedResults && (
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6366F1',
                  background: '#EEF2FF',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  ✨ Refined
                </span>
              )}
            </div>
            <p style={{
              fontSize: '15px',
              color: '#666',
              margin: 0,
              fontFamily: 'Jost, sans-serif'
            }}>
              AI-matched products based on your preferences
            </p>
          </div>

          {/* Products Count Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 0',
            borderBottom: '1px solid #E5E5E5',
            marginBottom: '30px'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#666',
              fontFamily: 'Jost, sans-serif'
            }}>
              {displayResults.length} {displayResults.length === 1 ? 'Product' : 'Products'}
            </div>
            <div style={{
              fontSize: '13px',
              color: '#999',
              fontFamily: 'Jost, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Sorted by Match Score
            </div>
          </div>

          {/* Results Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '40px 30px',
            marginBottom: '60px'
          }}>
            {displayResults.map((result: SearchResult, index: number) => (
              <div key={index} style={{ position: 'relative' }}>
                {/* Product Card */}
                <ProductCard product={result.product} />

                {/* AI Match Badge */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  background: '#000',
                  color: '#fff',
                  padding: '5px 10px',
                  fontSize: '10px',
                  fontWeight: '500',
                  fontFamily: 'Jost, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  zIndex: 10
                }}>
                  {result.matchScore}% MATCH
                </div>

                {/* AI Analysis Section */}
                <div style={{
                  marginTop: '20px',
                  padding: '20px',
                  border: '1px solid #E5E5E5',
                  background: '#fff',
                  fontFamily: 'Jost, sans-serif'
                }}>
                  {/* Why This Matches */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#000',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '12px'
                    }}>
                      Why This Matches
                    </div>
                    <div style={{
                      fontSize: '17px',
                      color: '#666',
                      lineHeight: '1.8'
                    }}>
                      {result.reasoning}
                    </div>
                  </div>

                  {/* Highlights (Pros) */}
                  {result.pros && result.pros.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#000',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '12px'
                      }}>
                        Highlights
                      </div>
                      <ul style={{
                        margin: 0,
                        paddingLeft: '18px',
                        fontSize: '17px',
                        color: '#666',
                        lineHeight: '1.8'
                      }}>
                        {result.pros.map((pro, i) => (
                          <li key={i} style={{ marginBottom: '8px' }}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Considerations (Cons) */}
                  {result.cons && result.cons.length > 0 && (
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#000',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '12px'
                      }}>
                        Considerations
                      </div>
                      <ul style={{
                        margin: 0,
                        paddingLeft: '18px',
                        fontSize: '17px',
                        color: '#666',
                        lineHeight: '1.8'
                      }}>
                        {result.cons.map((con, i) => (
                          <li key={i} style={{ marginBottom: '8px' }}>{con}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Refine Search Section */}
          {!isRefining && !refinedResults && (
            <div style={{
              textAlign: 'center',
              marginBottom: '60px',
              padding: '40px',
              background: '#F9FAFB',
              borderRadius: '8px'
            }}>
              <h3 style={{
                fontSize: '20px',
                fontWeight: '500',
                marginBottom: '16px',
                fontFamily: 'Jost, sans-serif',
                color: '#000'
              }}>
                Want more specific results?
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '24px',
                fontFamily: 'Jost, sans-serif'
              }}>
                Let our AI help you refine your search with a few quick questions
              </p>
              <button
                onClick={handleRefineSearch}
                style={{
                  padding: '14px 32px',
                  fontSize: '14px',
                  color: '#fff',
                  background: '#6366F1',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontFamily: 'Jost, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#4F46E5'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#6366F1'}
              >
                Refine Search
              </button>
            </div>
          )}

          {/* Refined Results Actions */}
          {refinedResults && !isRefining && (
            <div style={{
              textAlign: 'center',
              marginBottom: '60px',
              padding: '30px',
              background: '#EEF2FF',
              borderRadius: '8px',
              border: '1px solid #C7D2FE'
            }}>
              <p style={{
                fontSize: '14px',
                color: '#4338CA',
                marginBottom: '20px',
                fontFamily: 'Jost, sans-serif'
              }}>
                Showing refined results based on your preferences
              </p>
              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <button
                  onClick={handleRefineSearch}
                  style={{
                    padding: '12px 28px',
                    fontSize: '14px',
                    color: '#fff',
                    background: '#6366F1',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'Jost, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#4F46E5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#6366F1';
                  }}
                >
                  Refine Again
                </button>
                <button
                  onClick={() => {
                    setRefinedResults(null);
                    setRefinementRound(0);
                  }}
                  style={{
                    padding: '12px 28px',
                    fontSize: '13px',
                    color: '#4338CA',
                    background: '#fff',
                    border: '1px solid #C7D2FE',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'Jost, sans-serif',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#4338CA';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.color = '#4338CA';
                  }}
                >
                  View Original Results
                </button>
              </div>
            </div>
          )}

          {/* Refinement Interface */}
          {isRefining && (
            <div style={{
              marginBottom: '60px',
              padding: '40px',
              background: '#fff',
              border: '2px solid #6366F1',
              borderRadius: '8px'
            }}>
              <h3 style={{
                fontSize: '22px',
                fontWeight: '500',
                marginBottom: '12px',
                fontFamily: 'Jost, sans-serif',
                color: '#000',
                textAlign: 'center'
              }}>
                Refining Your Search
              </h3>
              <p style={{
                fontSize: '14px',
                color: '#666',
                marginBottom: '30px',
                fontFamily: 'Jost, sans-serif',
                textAlign: 'center'
              }}>
                Choose how you'd like to refine your results
              </p>

              {/* Section 1: Predetermined Likert Questions */}
              {refinementMode === 'guided' && !isLoadingQuestion && (
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#000',
                    marginBottom: '24px',
                    fontFamily: 'Jost, sans-serif',
                    textAlign: 'center'
                  }}>
                    📊 Rate Your Satisfaction
                  </div>

                  {LIKERT_QUESTION_BANK.map((q, index) => (
                    <div key={index} style={{
                      marginBottom: '32px',
                      padding: '24px',
                      background: '#F9FAFB',
                      borderRadius: '8px',
                      border: likertResponses[index] ? '2px solid #6366F1' : '2px solid #E5E7EB'
                    }}>
                      <div style={{
                        fontSize: '15px',
                        fontWeight: '500',
                        marginBottom: '16px',
                        fontFamily: 'Jost, sans-serif',
                        color: '#374151'
                      }}>
                        {index + 1}. {q.question}
                      </div>

                      {/* Likert Scale Labels */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '8px',
                        marginBottom: '12px'
                      }}>
                        {[
                          'Not Satisfied At All',
                          'Not Satisfied',
                          'Mildly Unsatisfied',
                          'Neutral',
                          'Mildly Satisfied',
                          'Satisfied',
                          'Very Satisfied'
                        ].map((label, idx) => (
                          <div key={idx} style={{
                            fontSize: '11px',
                            color: '#6B7280',
                            textAlign: 'center',
                            fontFamily: 'Jost, sans-serif',
                            fontWeight: '500',
                            lineHeight: '1.3'
                          }}>
                            {label}
                          </div>
                        ))}
                      </div>

                      {/* Likert Scale Buttons */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        gap: '8px'
                      }}>
                        {[1, 2, 3, 4, 5, 6, 7].map((value) => {
                          const labels = [
                            'Not Satisfied At All',
                            'Not Satisfied',
                            'Mildly Unsatisfied',
                            'Neutral',
                            'Mildly Satisfied',
                            'Satisfied',
                            'Very Satisfied'
                          ];
                          const isSelected = likertResponses[index]?.value === value;

                          return (
                            <div key={value} style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
                              <button
                                type="button"
                                onClick={() => handleLikertResponse(index, value, labels[value - 1])}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  border: isSelected ? '3px solid #6366F1' : '2px solid #D1D5DB',
                                  background: isSelected ? '#6366F1' : '#fff',
                                  color: isSelected ? '#fff' : '#374151',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: 0,
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  fontFamily: 'Jost, sans-serif'
                                }}
                                onMouseEnter={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = '#6366F1';
                                    e.currentTarget.style.background = '#EEF2FF';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = '#D1D5DB';
                                    e.currentTarget.style.background = '#fff';
                                  }
                                }}
                              >
                                {isSelected ? '✓' : value}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Show selected value */}
                      {likertResponses[index] && (
                        <div style={{
                          marginTop: '12px',
                          fontSize: '13px',
                          color: '#6366F1',
                          textAlign: 'center',
                          fontFamily: 'Jost, sans-serif',
                          fontWeight: '500'
                        }}>
                          Selected: {likertResponses[index].label}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Section 2: User Feedback */}
                  <div style={{
                    marginTop: '40px',
                    marginBottom: '32px',
                    padding: '24px',
                    background: '#FFF7ED',
                    borderRadius: '8px',
                    border: '2px solid #FED7AA'
                  }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#000',
                      marginBottom: '12px',
                      fontFamily: 'Jost, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      💬 Additional Feedback
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: '#92400E',
                      marginBottom: '16px',
                      fontFamily: 'Jost, sans-serif'
                    }}>
                      Tell us more about what you're looking for (color, style, occasion, etc.)
                    </div>
                    <textarea
                      value={userFeedback}
                      onChange={(e) => setUserFeedback(e.target.value)}
                      placeholder="Example: I prefer darker colors, need something for work, or want a more casual style..."
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '12px',
                        fontSize: '14px',
                        fontFamily: 'Jost, sans-serif',
                        border: '2px solid #FED7AA',
                        borderRadius: '4px',
                        resize: 'vertical',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#FB923C'}
                      onBlur={(e) => e.target.style.borderColor = '#FED7AA'}
                    />
                  </div>

                  {/* Submit Button */}
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={handleSubmitRefinement}
                      disabled={likertResponses.length !== LIKERT_QUESTION_BANK.length}
                      style={{
                        padding: '16px 48px',
                        fontSize: '16px',
                        color: '#fff',
                        background: likertResponses.length === LIKERT_QUESTION_BANK.length ? '#6366F1' : '#9CA3AF',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: likertResponses.length === LIKERT_QUESTION_BANK.length ? 'pointer' : 'not-allowed',
                        fontWeight: '600',
                        fontFamily: 'Jost, sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (likertResponses.length === LIKERT_QUESTION_BANK.length) {
                          e.currentTarget.style.background = '#4F46E5';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (likertResponses.length === LIKERT_QUESTION_BANK.length) {
                          e.currentTarget.style.background = '#6366F1';
                        }
                      }}
                    >
                      Get Refined Results
                    </button>
                    <div style={{
                      marginTop: '12px',
                      fontSize: '13px',
                      color: '#666',
                      fontFamily: 'Jost, sans-serif'
                    }}>
                      {likertResponses.length}/{LIKERT_QUESTION_BANK.length} questions answered
                    </div>
                  </div>
                </div>
              )}

              {/* Guided Mode - Loading */}
              {refinementMode === 'guided' && isLoadingQuestion ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#666',
                  fontFamily: 'Jost, sans-serif'
                }}>
                  <div style={{ 
                    fontSize: '16px', 
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                  }}>
                    <span style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #E5E5E5',
                      borderTop: '2px solid #6366F1',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    {loadingMessages[loadingMessage]}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#999',
                    marginTop: '8px'
                  }}>
                    Processing your preferences and chat history...
                  </div>
                </div>
              ) : null}


              {/* Cancel Refinement Button */}
              {refinementMode === 'guided' && !isLoadingQuestion && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <button
                    onClick={() => {
                      setIsRefining(false);
                      setRefinementMode(null);
                      setLikertResponses([]);
                      setUserFeedback('');
                    }}
                    style={{
                      padding: '10px 24px',
                      fontSize: '13px',
                      color: '#666',
                      background: 'transparent',
                      border: '1px solid #E5E7EB',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontFamily: 'Jost, sans-serif',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Back Button - Floating */}
          <div style={{
            position: 'fixed',
            bottom: '30px',
            right: '30px',
            zIndex: 1000
          }}>
            <button
              onClick={() => navigate('/find-your-fit')}
              style={{
                padding: '14px 28px',
                fontSize: '12px',
                color: '#fff',
                background: '#000',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                fontFamily: 'Jost, sans-serif',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                transition: 'background 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#000'}
            >
              <span style={{ fontSize: '16px' }}>←</span> Back to Find My Fit
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}


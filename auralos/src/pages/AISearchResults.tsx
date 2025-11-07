import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { invokeAgent, generateSessionId } from '../services/bedrockService';
import { products } from '../data/products';
import type { Product } from '../types/product';

interface SearchResult {
  product: any;
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

interface RefinementAnswer {
  metric: string;
  value: number | string;
  label: string;
}

export default function AISearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchResults, query } = location.state || {};

  // Refinement state
  const [isRefining, setIsRefining] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<RefinementQuestion | null>(null);
  const [refinementAnswers, setRefinementAnswers] = useState<RefinementAnswer[]>([]);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [sessionId] = useState(() => generateSessionId());
  const [refinedResults, setRefinedResults] = useState<SearchResult[] | null>(null);
  const [openEndedAnswer, setOpenEndedAnswer] = useState('');

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
      const baseNameMatch = productNameLower.split(/[\s\(]/)[0];
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

  const handleRefineSearch = async () => {
    setIsRefining(true);
    setIsLoadingQuestion(true);

    try {
      // Ask AI for the first refinement question
      const prompt = `The user is looking for products based on this query: "${query}". 
They want to refine their search to get more specific results.

Ask them about ONE specific metric/preference that would help narrow down the search. 
Determine if this should be a Likert scale question (for rating importance/preference) or an open-ended question (for specific details like color, style, occasion).

Examples of Likert questions: "How important is comfort?", "How formal should the style be?"
Examples of open-ended questions: "What color are you looking for?", "What occasion will you wear this for?"

Respond ONLY with a JSON object in this format:
{
  "metric": "short_metric_name",
  "question": "Your question here",
  "type": "likert" or "open"
}

Example Likert:
{
  "metric": "comfort_level",
  "question": "How important is comfort to you?",
  "type": "likert"
}

Example Open:
{
  "metric": "color_preference",
  "question": "What color are you looking for?",
  "type": "open"
}`;

      const response = await invokeAgent(prompt, sessionId);
      const parsed = JSON.parse(response.text.trim());
      setCurrentQuestion(parsed);
      setOpenEndedAnswer('');
    } catch (error) {
      console.error('Error getting refinement question:', error);
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const handleLikertResponse = async (value: number, label: string) => {
    await handleAnswer(value, label);
  };

  const handleOpenEndedSubmit = async () => {
    if (!openEndedAnswer.trim()) return;
    await handleAnswer(openEndedAnswer, openEndedAnswer);
  };

  const handleAnswer = async (value: number | string, label: string) => {
    if (!currentQuestion) return;

    const newAnswer: RefinementAnswer = {
      metric: currentQuestion.metric,
      value,
      label
    };

    const updatedAnswers = [...refinementAnswers, newAnswer];
    setRefinementAnswers(updatedAnswers);
    setIsLoadingQuestion(true);
    setOpenEndedAnswer('');

    try {
      // Ask AI if it needs more information or can provide results
      const prompt = `The user is refining their search for: "${query}"

Current refinement preferences:
${updatedAnswers.map(a => `- ${a.metric}: ${a.label}`).join('\n')}

Do you have enough information to provide 3 refined product recommendations, or do you need to ask about one more preference?

Respond with JSON in ONE of these formats:

If you need more info:
{
  "needsMore": true,
  "metric": "metric_name",
  "question": "Your question here",
  "type": "likert" or "open"
}

If you have enough info:
{
  "needsMore": false,
  "ready": true
}`;

      const response = await invokeAgent(prompt, sessionId);
      const parsed = JSON.parse(response.text.trim());

      if (parsed.needsMore) {
        setCurrentQuestion({ 
          metric: parsed.metric, 
          question: parsed.question,
          type: parsed.type || 'likert'
        });
      } else {
        // Get refined results
        await getRefinedResults(updatedAnswers);
      }
    } catch (error) {
      console.error('Error processing refinement:', error);
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const getRefinedResults = async (answers: RefinementAnswer[]) => {
    setIsLoadingQuestion(true);

    try {
      const prompt = `Search for products matching this query: "${query}"

User refinement preferences:
${answers.map(a => `- ${a.metric}: ${a.label} (${a.value}/5)`).join('\n')}

Return EXACTLY 3 products that best match these refined preferences in this JSON format:

{
  "results": [
    {
      "productName": "Product Name (Color Variant)",
      "score": 85,
      "reasoning": "This matches your refined preferences because...",
      "pros": ["Benefit 1", "Benefit 2", "Benefit 3"],
      "cons": ["Consideration 1", "Consideration 2"]
    }
  ]
}

CRITICAL: productName MUST include the color variant in parentheses exactly as it appears in the knowledge base.`;

      const response = await invokeAgent(prompt, sessionId);
      console.log('🤖 Refined results response:', response.text);
      
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
        const results: SearchResult[] = parsed.results.map((result: any) => {
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

        setRefinedResults(results);
        setIsRefining(false);
        setCurrentQuestion(null);
        setRefinementAnswers([]);
      }
    } catch (error) {
      console.error('Error getting refined results:', error);
      alert('Failed to get refined results. Please try again.');
    } finally {
      setIsLoadingQuestion(false);
    }
  };

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
            fontSize: '16px',
            color: '#666',
            marginBottom: '20px',
            fontFamily: 'Jost, sans-serif'
          }}>
            Search by keyword, style, etc.
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: '500',
            marginBottom: '30px',
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

          {/* Filters and Sort Bar */}
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
              {searchResults.length} {searchResults.length === 1 ? 'Product' : 'Products'}
            </div>
            <div style={{
              fontSize: '14px',
              color: '#000',
              fontFamily: 'Jost, sans-serif',
              display: 'flex',
              gap: '20px'
            }}>
              <span>SORT BY: RELEVANCE</span>
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
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#000',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '10px'
                    }}>
                      Why This Matches
                    </div>
                    <div style={{
                      fontSize: '15px',
                      color: '#666',
                      lineHeight: '1.7'
                    }}>
                      {result.reasoning}
                    </div>
                  </div>

                  {/* Highlights (Pros) */}
                  {result.pros && result.pros.length > 0 && (
                    <div style={{ marginBottom: '18px' }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#000',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '10px'
                      }}>
                        Highlights
                      </div>
                      <ul style={{
                        margin: 0,
                        paddingLeft: '18px',
                        fontSize: '15px',
                        color: '#666',
                        lineHeight: '1.7'
                      }}>
                        {result.pros.map((pro, i) => (
                          <li key={i} style={{ marginBottom: '6px' }}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Considerations (Cons) */}
                  {result.cons && result.cons.length > 0 && (
                    <div>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#000',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '10px'
                      }}>
                        Considerations
                      </div>
                      <ul style={{
                        margin: 0,
                        paddingLeft: '18px',
                        fontSize: '15px',
                        color: '#666',
                        lineHeight: '1.7'
                      }}>
                        {result.cons.map((con, i) => (
                          <li key={i} style={{ marginBottom: '6px' }}>{con}</li>
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

          {/* Reset to Original Results */}
          {refinedResults && (
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
                marginBottom: '16px',
                fontFamily: 'Jost, sans-serif'
              }}>
                Showing refined results based on your preferences
              </p>
              <button
                onClick={() => setRefinedResults(null)}
                style={{
                  padding: '10px 24px',
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
                marginBottom: '30px',
                fontFamily: 'Jost, sans-serif',
                color: '#000',
                textAlign: 'center'
              }}>
                Refining Your Search
              </h3>

              {/* Show previous answers */}
              {refinementAnswers.length > 0 && (
                <div style={{
                  marginBottom: '30px',
                  padding: '20px',
                  background: '#F9FAFB',
                  borderRadius: '4px'
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6366F1',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    marginBottom: '12px',
                    fontFamily: 'Jost, sans-serif'
                  }}>
                    Your Preferences
                  </div>
                  {refinementAnswers.map((answer, idx) => (
                    <div key={idx} style={{
                      fontSize: '14px',
                      color: '#374151',
                      marginBottom: '8px',
                      fontFamily: 'Jost, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span style={{ color: '#6366F1' }}>✓</span>
                      <span style={{ fontWeight: '500' }}>{answer.metric.replace(/_/g, ' ')}:</span>
                      <span>{answer.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Current Question */}
              {isLoadingQuestion ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#666',
                  fontFamily: 'Jost, sans-serif'
                }}>
                  <div style={{ fontSize: '16px', marginBottom: '12px' }}>
                    Analyzing your preferences...
                  </div>
                  <div style={{ fontSize: '24px' }}>🤔</div>
                </div>
              ) : currentQuestion ? (
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '400',
                    marginBottom: '24px',
                    fontFamily: 'Jost, sans-serif',
                    color: '#374151',
                    textAlign: 'left',
                    maxWidth: '800px',
                    margin: '0 auto 24px'
                  }}>
                    {currentQuestion.question}
                  </div>

                  {/* Likert Scale - Horizontal */}
                  {currentQuestion.type === 'likert' ? (
                    <div style={{
                      maxWidth: '800px',
                      margin: '0 auto'
                    }}>
                      {/* Labels Row */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '12px',
                        marginBottom: '12px'
                      }}>
                        {[
                          'Strongly Disagree',
                          'Disagree',
                          'Neutral',
                          'Agree',
                          'Strongly Agree'
                        ].map((label, idx) => (
                          <div key={idx} style={{
                            fontSize: '12px',
                            color: '#6B7280',
                            textAlign: 'center',
                            fontFamily: 'Jost, sans-serif',
                            fontWeight: '500'
                          }}>
                            {label}
                          </div>
                        ))}
                      </div>

                      {/* Radio Buttons Row */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '12px',
                        marginBottom: '8px'
                      }}>
                        {[1, 2, 3, 4, 5].map((value) => (
                          <div key={value} style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}>
                            <button
                              onClick={() => handleLikertResponse(
                                value,
                                ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'][value - 1]
                              )}
                              style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                border: '2px solid #D1D5DB',
                                background: '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#6366F1';
                                e.currentTarget.style.background = '#EEF2FF';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#D1D5DB';
                                e.currentTarget.style.background = '#fff';
                              }}
                            >
                              <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                background: '#D1D5DB'
                              }} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Open-Ended Input */
                    <div style={{
                      maxWidth: '600px',
                      margin: '0 auto'
                    }}>
                      <input
                        type="text"
                        value={openEndedAnswer}
                        onChange={(e) => setOpenEndedAnswer(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleOpenEndedSubmit();
                          }
                        }}
                        placeholder="Type your answer..."
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          fontSize: '15px',
                          border: '2px solid #D1D5DB',
                          borderRadius: '4px',
                          fontFamily: 'Jost, sans-serif',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#6366F1'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
                      />
                      <button
                        onClick={handleOpenEndedSubmit}
                        disabled={!openEndedAnswer.trim()}
                        style={{
                          marginTop: '16px',
                          padding: '12px 32px',
                          fontSize: '14px',
                          color: '#fff',
                          background: openEndedAnswer.trim() ? '#6366F1' : '#D1D5DB',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: openEndedAnswer.trim() ? 'pointer' : 'not-allowed',
                          fontWeight: '500',
                          fontFamily: 'Jost, sans-serif',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (openEndedAnswer.trim()) {
                            e.currentTarget.style.background = '#4F46E5';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (openEndedAnswer.trim()) {
                            e.currentTarget.style.background = '#6366F1';
                          }
                        }}
                      >
                        Submit
                      </button>
                    </div>
                  )}

                  {/* Cancel Button */}
                  <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <button
                      onClick={() => {
                        setIsRefining(false);
                        setCurrentQuestion(null);
                        setRefinementAnswers([]);
                        setOpenEndedAnswer('');
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
                      Cancel Refinement
                    </button>
                  </div>
                </div>
              ) : null}
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


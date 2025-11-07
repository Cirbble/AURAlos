import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import ProductCard from '../components/ProductCard';

interface SearchResult {
  product: any;
  matchScore: number;
  reasoning: string;
  pros: string[];
  cons: string[];
}

export default function AISearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchResults, query } = location.state || {};

  useEffect(() => {
    // Redirect to find-your-fit if no results
    if (!searchResults || searchResults.length === 0) {
      navigate('/find-your-fit');
    }
  }, [searchResults, navigate]);

  if (!searchResults) return null;

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
            fontFamily: 'Jost, sans-serif'
          }}>
            {query || 'AI Visual Search Results'}
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
            {searchResults.map((result: SearchResult, index: number) => (
              <div key={index} style={{ position: 'relative' }}>
                {/* Product Card */}
                <ProductCard product={result.product} />

                {/* AI Match Badge */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  background: 'rgba(99, 102, 241, 0.95)',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  fontFamily: 'Jost, sans-serif',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  zIndex: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span>✨</span> AI MATCH {result.matchScore}%
                </div>

                {/* AI Analysis Section */}
                <div style={{
                  marginTop: '20px',
                  padding: '20px',
                  background: '#F9FAFB',
                  borderRadius: '4px',
                  fontFamily: 'Jost, sans-serif'
                }}>
                  {/* Why This Matches */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: '#6366F1',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      marginBottom: '8px'
                    }}>
                      Why This Matches
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: '#374151',
                      lineHeight: '1.6'
                    }}>
                      {result.reasoning}
                    </div>
                  </div>

                  {/* Highlights (Pros) */}
                  {result.pros && result.pros.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#059669',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '8px'
                      }}>
                        Highlights
                      </div>
                      <ul style={{
                        margin: 0,
                        paddingLeft: '18px',
                        fontSize: '13px',
                        color: '#374151',
                        lineHeight: '1.6'
                      }}>
                        {result.pros.map((pro, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{pro}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Considerations (Cons) */}
                  {result.cons && result.cons.length > 0 && (
                    <div>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#DC2626',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '8px'
                      }}>
                        Considerations
                      </div>
                      <ul style={{
                        margin: 0,
                        paddingLeft: '18px',
                        fontSize: '13px',
                        color: '#374151',
                        lineHeight: '1.6'
                      }}>
                        {result.cons.map((con, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{con}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

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
                padding: '16px 32px',
                fontSize: '14px',
                color: '#fff',
                background: '#000',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                fontWeight: '500',
                fontFamily: 'Jost, sans-serif',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transition: 'transform 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontSize: '18px' }}>←</span> Back to Find My Fit
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}


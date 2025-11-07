import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { products } from '../data/products';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(products.slice(0, 0));

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.type.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);

    setResults(filtered);
  }, [query]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
            setQuery('');
          }
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 2000
        }}
      />

      {/* Side Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '450px',
        maxWidth: '90%',
        backgroundColor: '#fff',
        zIndex: 2001,
        overflowY: 'auto',
        boxShadow: '-4px 0 6px -1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '30px',
          borderBottom: '1px solid #e5e5e5',
          position: 'sticky',
          top: 0,
          backgroundColor: '#fff',
          zIndex: 10
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '500',
              fontFamily: 'Jost, sans-serif',
              margin: 0,
              color: '#000',
              letterSpacing: '0.3px'
            }}>
              Search
            </h2>
            <button
              onClick={() => {
                onClose();
                setQuery('');
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: '#000',
                lineHeight: 1,
                padding: 0,
                fontWeight: '300'
              }}
            >
              ×
            </button>
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            autoFocus
            style={{
              width: '100%',
              padding: '14px 16px',
              fontSize: '15px',
              border: '1px solid #000',
              outline: 'none',
              fontFamily: 'Jost, sans-serif',
              backgroundColor: '#fff'
            }}
          />

          {query.length > 0 && (
            <div style={{
              marginTop: '20px'
            }}>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'Jost, sans-serif',
                color: '#000',
                marginBottom: '12px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                Popular Searches
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {['Stranger Things', 'White Heels', 'Black Heels', "Men's Loafers"].map(term => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    style={{
                      textAlign: 'left',
                      padding: '8px 0',
                      background: 'none',
                      border: 'none',
                      fontSize: '14px',
                      fontFamily: 'Jost, sans-serif',
                      color: '#666',
                      cursor: 'pointer',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#000'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div style={{
          flex: 1,
          padding: '30px',
          overflowY: 'auto'
        }}>
          {results.length > 0 && (
            <div>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'Jost, sans-serif',
                color: '#000',
                marginBottom: '20px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase'
              }}>
                Products
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {results.map(product => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    onClick={() => {
                      onClose();
                      setQuery('');
                    }}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      textDecoration: 'none',
                      color: '#000',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: '100px',
                        height: '100px',
                        objectFit: 'cover'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '400',
                        fontFamily: 'Jost, sans-serif',
                        marginBottom: '6px',
                        color: '#000'
                      }}>
                        {product.name}
                      </h4>
                      <p style={{
                        fontSize: '13px',
                        color: '#666',
                        marginBottom: '8px',
                        fontFamily: 'Jost, sans-serif'
                      }}>
                        {product.type}
                      </p>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        fontFamily: 'Jost, sans-serif',
                        color: '#000'
                      }}>
                        ${product.price}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {query.length >= 2 && results.length === 0 && (
            <p style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#666',
              fontFamily: 'Jost, sans-serif',
              fontSize: '14px'
            }}>
              No products found
            </p>
          )}
        </div>
      </div>
    </>
  );
}


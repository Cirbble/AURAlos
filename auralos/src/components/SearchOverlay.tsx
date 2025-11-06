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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '100px'
      }}
    >
      <div style={{
        backgroundColor: '#fff',
        padding: '40px',
        width: '90%',
        maxWidth: '800px',
        borderRadius: '4px',
        position: 'relative'
      }}>
        <button
          onClick={() => {
            onClose();
            setQuery('');
          }}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#333'
          }}
        >
          <i className="fas fa-times"></i>
        </button>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for products..."
          autoFocus
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '18px',
            border: '2px solid #e0e0e0',
            borderRadius: '4px',
            outline: 'none'
          }}
        />

        {results.length > 0 && (
          <div style={{ marginTop: '20px', maxHeight: '400px', overflowY: 'auto' }}>
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
                  gap: '15px',
                  padding: '10px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                  marginBottom: '10px',
                  textDecoration: 'none',
                  color: '#333',
                  transition: 'background-color 0.3s ease'
                }}
              >
                <img
                  src={product.image}
                  alt={product.name}
                  style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '4px'
                  }}
                />
                <div>
                  <h4 style={{ fontSize: '16px', marginBottom: '5px' }}>{product.name}</h4>
                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>{product.type}</p>
                  <span style={{ fontWeight: 'bold' }}>${product.price}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            No products found
          </p>
        )}
      </div>
    </div>
  );
}


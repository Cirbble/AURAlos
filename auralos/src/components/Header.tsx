import { useState } from 'react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import SearchOverlay from './SearchOverlay';

export default function Header() {
  const { getCount } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const cartCount = getCount();

  return (
    <>
      {/* Announcement Bar */}
      <div style={{ backgroundColor: '#000', color: '#fff', textAlign: 'center', padding: '10px', fontSize: '13px' }}>
        FREE Shipping on Orders $99+
      </div>

      {/* Header */}
      <header style={{ 
        backgroundColor: '#fff', 
        borderBottom: '1px solid #e0e0e0', 
        position: 'sticky', 
        top: 0, 
        zIndex: 1000 
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
          {/* Top Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '15px 0' 
          }}>
            {/* Logo */}
            <Link to="/" style={{ 
              fontSize: '32px', 
              fontWeight: 'bold', 
              letterSpacing: '2px', 
              color: '#000', 
              textDecoration: 'none' 
            }}>
              ALDO
            </Link>

            {/* Navigation Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button 
                onClick={() => setIsSearchOpen(true)}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px' 
                }}
              >
                <i className="fas fa-search" style={{ fontSize: '20px' }}></i>
              </button>

              <Link to="/account" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px', 
                color: '#000', 
                textDecoration: 'none' 
              }}>
                <i className="fas fa-user" style={{ fontSize: '20px' }}></i>
                <span style={{ fontSize: '14px' }}>Log in</span>
              </Link>

              <Link to="/cart" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px', 
                color: '#000', 
                textDecoration: 'none', 
                position: 'relative' 
              }}>
                <i className="fas fa-shopping-bag" style={{ fontSize: '20px' }}></i>
                <span style={{ fontSize: '14px' }}>Cart</span>
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: '#8B0000',
                    color: '#fff',
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    minWidth: '18px',
                    textAlign: 'center'
                  }}>
                    {cartCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{ 
                  display: 'none', 
                  background: 'none', 
                  border: 'none', 
                  fontSize: '24px', 
                  cursor: 'pointer' 
                }}
                className="mobile-menu-toggle"
              >
                <i className={`fas fa-${isMobileMenuOpen ? 'times' : 'bars'}`}></i>
              </button>
            </div>
          </div>

          {/* Quick Links Navigation */}
          <nav style={{ 
            padding: '15px 0', 
            borderTop: '1px solid #e0e0e0' 
          }}>
            <ul style={{ 
              listStyle: 'none', 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '30px', 
              flexWrap: 'wrap', 
              margin: 0, 
              padding: 0 
            }}>
              <li><Link to="/collection/stranger-things" style={linkStyle}>Stranger Things</Link></li>
              <li><Link to="/collection/boots" style={linkStyle}>Boot Shop</Link></li>
              <li><Link to="/collection/new-arrivals" style={linkStyle}>New In</Link></li>
              <li><Link to="/collection/heels" style={linkStyle}>Heels</Link></li>
              <li><Link to="/collection/brown" style={linkStyle}>Brown</Link></li>
              <li><Link to="/collection/animal-print" style={linkStyle}>Animal Print</Link></li>
              <li><Link to="/collection/bordeaux" style={linkStyle}>Bordeaux</Link></li>
              <li><Link to="/collection/suede" style={linkStyle}>Suede</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

const linkStyle: CSSProperties = {
  fontSize: '14px',
  color: '#333',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  textDecoration: 'none',
  transition: 'all 0.3s ease',
};


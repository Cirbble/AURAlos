import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#000', color: '#fff', padding: '60px 0 30px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 20px' }}>
        {/* Footer Top */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '40px', 
          marginBottom: '40px' 
        }}>
          {/* Customer Service */}
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Customer Service</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '12px' }}><Link to="/orders" style={footerLinkStyle}>Orders & Shipping</Link></li>
              <li style={{ marginBottom: '12px' }}><Link to="/returns" style={footerLinkStyle}>Returns & Exchanges</Link></li>
              <li style={{ marginBottom: '12px' }}><Link to="/contact" style={footerLinkStyle}>Contact Us</Link></li>
              <li style={{ marginBottom: '12px' }}><Link to="/faq" style={footerLinkStyle}>FAQ</Link></li>
              <li style={{ marginBottom: '12px' }}><Link to="/size-guide" style={footerLinkStyle}>Size Guide</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Company</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '12px' }}><Link to="/about" style={footerLinkStyle}>About Us</Link></li>
              <li style={{ marginBottom: '12px' }}><Link to="/careers" style={footerLinkStyle}>Careers</Link></li>
              <li style={{ marginBottom: '12px' }}><Link to="/stores" style={footerLinkStyle}>Stores</Link></li>
              <li style={{ marginBottom: '12px' }}><Link to="/blog" style={footerLinkStyle}>Blog</Link></li>
              <li style={{ marginBottom: '12px' }}><Link to="/accessibility" style={footerLinkStyle}>Accessibility</Link></li>
              <li style={{ marginBottom: '12px' }}><Link to="/student-discount" style={footerLinkStyle}>Student Discount</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Legal</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li style={{ marginBottom: '12px' }}><Link to="/legal" style={footerLinkStyle}>Legal Notice</Link></li>
              <li style={{ marginBottom: '12px' }}><Link to="/privacy" style={footerLinkStyle}>Privacy Policy</Link></li>
              <li style={{ marginBottom: '12px' }}><Link to="/cookies" style={footerLinkStyle}>Cookie Preferences</Link></li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>Follow Us</h3>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={socialLinkStyle}>
                <i className="fab fa-instagram" style={{ fontSize: '20px' }}></i>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" style={socialLinkStyle}>
                <i className="fab fa-tiktok" style={{ fontSize: '20px' }}></i>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={socialLinkStyle}>
                <i className="fab fa-facebook" style={{ fontSize: '20px' }}></i>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style={socialLinkStyle}>
                <i className="fab fa-youtube" style={{ fontSize: '20px' }}></i>
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" style={socialLinkStyle}>
                <i className="fab fa-pinterest" style={{ fontSize: '20px' }}></i>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={socialLinkStyle}>
                <i className="fab fa-twitter" style={{ fontSize: '20px' }}></i>
              </a>
            </div>
            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '13px', marginBottom: '10px' }}>
                Join our loyalty program and unlock 15% off your next purchase!
              </p>
              <button style={{
                backgroundColor: '#000',
                color: '#fff',
                border: '2px solid #fff',
                padding: '12px 30px',
                fontSize: '14px',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}>
                Sign up now
              </button>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          paddingTop: '30px', 
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <Link to="/" style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              letterSpacing: '2px', 
              color: '#fff', 
              textDecoration: 'none' 
            }}>
              ALDO
            </Link>
            <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '10px' }}>
              ©2005-2025 The Aldo Group Inc. All rights reserved
            </p>
          </div>

          <div>
            <p style={{ fontSize: '12px', marginBottom: '10px' }}>Payment methods</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <i className="fab fa-cc-visa" style={{ fontSize: '24px' }}></i>
              <i className="fab fa-cc-mastercard" style={{ fontSize: '24px' }}></i>
              <i className="fab fa-cc-amex" style={{ fontSize: '24px' }}></i>
              <i className="fab fa-cc-discover" style={{ fontSize: '24px' }}></i>
              <i className="fab fa-cc-paypal" style={{ fontSize: '24px' }}></i>
              <i className="fab fa-cc-apple-pay" style={{ fontSize: '24px' }}></i>
              <i className="fab fa-google-pay" style={{ fontSize: '24px' }}></i>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

const footerLinkStyle: CSSProperties = {
  fontSize: '14px',
  color: '#fff',
  opacity: 0.8,
  textDecoration: 'none',
  transition: 'opacity 0.3s ease',
};

const socialLinkStyle: CSSProperties = {
  color: '#fff',
  textDecoration: 'none',
  transition: 'transform 0.3s ease',
};


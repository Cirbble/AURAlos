import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import SearchOverlay from './SearchOverlay';

export default function Header() {
  const { getCount } = useCart();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const cartCount = getCount();

  return (
    <>
      {/* Announcement Bar */}
      <div style={{
        backgroundColor: '#000',
        color: '#fff',
        padding: '13px 0',
        fontSize: '12px',
        height: '42px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '0 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            justifyContent: 'flex-start'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '400' }}>FREE Shipping on Orders $99+</span>
            <a href="/pages/customer-service" style={{ 
              color: '#fff', 
              textDecoration: 'underline',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              Learn more
            </a>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '18px', 
            fontSize: '12px' 
          }}>
            <a href="/account/orders" style={{ color: '#fff', textDecoration: 'none', fontSize: '12px' }}>Track Order</a>
            <span style={{ color: '#fff', opacity: 1, fontSize: '16px' }}>|</span>
            <a href="/pages/stores" style={{ color: '#fff', textDecoration: 'none', fontSize: '12px' }}>Store Locator</a>
            <span style={{ color: '#fff', opacity: 1, fontSize: '16px' }}>|</span>
            <a href="/pages/help" style={{ color: '#fff', textDecoration: 'none', fontSize: '12px' }}>Help</a>
            <span style={{ color: '#fff', opacity: 1, fontSize: '16px' }}>|</span>
            <button style={{ 
              background: 'none', 
              border: 'none', 
              color: '#fff', 
              cursor: 'pointer',
              fontSize: '12px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              CAD (EN)
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="white" strokeWidth="1" fill="none"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header style={{
        backgroundColor: '#fff',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '0 20px'
        }}>
          {/* Top Row: Logo + Icons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '65px',
            paddingLeft: '0px'
          }}>
            {/* Logo - Left */}
            <Link to="/" style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none'
            }}>
              <svg width="230" height="44" viewBox="0 0 759.28 137.25" xmlns="http://www.w3.org/2000/svg">
                <polygon points="254.14 2.95 221.77 2.95 221.76 134.94 365.2 134.94 365.2 105.8 254.14 105.8 254.14 2.95"></polygon>
                <path d="M530,20.24C514,8.32,491.8,3.62,469.66,3.58H388.11V135.79l81.35,0c22.23,0,44.58-4.71,60.59-16.68,17.27-12.91,27-30.47,27-49.45S547.26,33.15,530,20.24Zm-58.76,86.81H421.28V32.31h49.9c31,0,52.82,16.19,52.83,37.37S502.21,107.05,471.22,107.05Z" transform="translate(0.05 -0.87)"></path>
                <path d="M0,135.81H37.27l15.16-20.09h98.29l15,20.09h39.07L102.28.89Zm131.57-47H71.63l30-40.39Z" transform="translate(0.05 -0.87)"></path>
                <path d="M731.22,19.6C715.07,7.52,692.52.87,670.08.87h-6.17c-22.44,0-45,6.65-61.14,18.73-17.43,13-28,30.75-28,49.9s10.63,36.86,28.07,49.89C619,131.47,641.55,138.12,664,138.12h6c22.44,0,45-6.65,61.16-18.73,17.44-13,28.06-30.75,28.07-49.89S748.65,32.63,731.22,19.6ZM670,109.78h-6c-31.27,0-55.72-18.91-55.73-40.29s24.41-40.28,55.68-40.28h6.13c31.27,0,55.7,18.91,55.68,40.28S701.28,109.78,670,109.78Z" transform="translate(0.05 -0.87)"></path>
              </svg>
            </Link>

            {/* Icons - Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', paddingRight: '0px' }}>
              <button
                onClick={() => setIsSearchOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label="Search"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.20703,21.5l-5.35999-5.35999c1.33514-1.50134,2.15295-3.47284,2.15295-5.64001,0-4.69446-3.80554-8.5-8.5-8.5S2,5.80554,2,10.5s3.8056,8.5,8.5,8.5c2.16718,0,4.13867-.81781,5.64001-2.15295l5.35999,5.35999.70703-.70703ZM3,10.5c0-4.1355,3.3645-7.5,7.5-7.5s7.5,3.3645,7.5,7.5-3.3645,7.5-7.5,7.5-7.5-3.3645-7.5-7.5Z"/>
                </svg>
              </button>

              <Link to="/account" style={{
                display: 'flex',
                alignItems: 'center',
                color: '#000',
                textDecoration: 'none',
                padding: '8px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15.5,9.5c0-1.93298-1.56696-3.5-3.5-3.5s-3.5,1.56702-3.5,3.5,1.56702,3.5,3.5,3.5,3.5-1.56702,3.5-3.5ZM9.5,9.5c0-1.37848,1.12152-2.5,2.5-2.5s2.5,1.12152,2.5,2.5-1.12146,2.5-2.5,2.5-2.5-1.12152-2.5-2.5Z"/>
                  <path d="M12,14c-3.26843,0-6.16162,1.5752-7.98639,4,1.82477,2.4248,4.71796,4,7.98639,4s6.16162-1.5752,7.98639-4c-1.82477-2.4248-4.71796-4-7.98639-4ZM12,21c-2.58588,0-4.98553-1.08435-6.69446-3,1.70892-1.91565,4.10858-3,6.69446-3s4.9856,1.08435,6.69452,3c-1.70892,1.91565-4.10864,3-6.69452,3Z"/>
                  <path d="M12,2C6.47717,2,2,6.47717,2,12c0,1.88208.52954,3.63629,1.43365,5.13971.22089-.276.44623-.54639.68835-.79706-.71326-1.2887-1.12201-2.76831-1.12201-4.34265C3,7.03735,7.03741,3,12,3s9,4.03735,9,9c0,1.57434-.40875,3.05396-1.12201,4.34265.24207.25067.46759.52112.68842.79712.90411-1.50342,1.43359-3.25769,1.43359-5.13977,0-5.52283-4.47711-10-10-10Z"/>
                </svg>
              </Link>

              <Link to="/cart" style={{
                display: 'flex',
                alignItems: 'center',
                color: '#000',
                textDecoration: 'none',
                position: 'relative',
                padding: '8px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19.83868,7h-4.45648c-.18561-1.54071-.59784-3.20813-1.49548-4.16357-1.04297-1.11035-2.73047-1.11035-3.77344,0-.89764.95544-1.30988,2.62286-1.49548,4.16357h-4.45642c-.61145,0-1.07977.54382-.98907,1.1485l1.56671,10.44482c.2937,1.95813,1.97577,3.40668,3.95575,3.40668h6.61047c1.98004,0,3.66205-1.44855,3.95575-3.40668l1.56677-10.44482c.0907-.60468-.37762-1.1485-.98907-1.1485ZM10.84229,3.521c.6582-.70117,1.65674-.70068,2.31494-.00049.68292.72662,1.0412,2.10394,1.21759,3.47949h-4.75043c.17615-1.37488.53442-2.75165,1.2179-3.479ZM18.27209,18.44501c-.22211,1.48047-1.46979,2.55499-2.96686,2.55499h-6.61047c-1.49701,0-2.74475-1.07452-2.9668-2.55499l-1.56659-10.44501h4.36127c-.09021,1.35468-.02783,2.4317-.02167,2.53125.0166.26514.23682.46875.49854.46875.01025,0,.021-.00049.03174-.00098.27539-.01709.48486-.25439.46777-.53027-.03394-.54346-.04535-1.46021.02686-2.46875h4.94757c.07239,1.00842.06128,1.92511.02753,2.46875-.01709.27588.19238.51318.46777.53027.28516.00293.5127-.19238.53027-.46777.00616-.09955.06854-1.17657-.02167-2.53125h4.36133l.00012.00012-1.56671,10.44489Z"/>
                </svg>
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    backgroundColor: '#000',
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '2px 5px',
                    borderRadius: '10px',
                    minWidth: '16px',
                    textAlign: 'center',
                    lineHeight: '1.2'
                  }}>
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Bottom Row: Main Navigation */}
          <nav style={{ 
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            height: '44px',
            borderBottom: '2px solid #fff',
            boxShadow: '0 2px 0 0 #fff',
            paddingLeft: '0px',
            marginTop: '-8px'
          }}>
            <ul style={{
              listStyle: 'none',
              display: 'flex',
              gap: '32px',
              margin: 0,
              padding: 0,
              alignItems: 'center'
            }}>
              <li><Link to="/collection/women" style={mainNavStyle}>Women</Link></li>
              <li><Link to="/collection/men" style={mainNavStyle}>Men</Link></li>
              <li><Link to="/collection/bags" style={mainNavStyle}>Bags</Link></li>
              <li><Link to="/collection/accessories" style={mainNavStyle}>Accessories</Link></li>
              <li><Link to="/collection/trends" style={mainNavStyle}>Trends</Link></li>
              <li><Link to="/collection/sale" style={mainNavStyle}>Sale</Link></li>
              <li><Link to="/collection/stranger-things" style={secondaryNavStyle}>Stranger Things</Link></li>
              <li><Link to="/collection/boots" style={secondaryNavStyle}>Boot Shop</Link></li>
              <li><Link to="/collection/new-arrivals" style={secondaryNavStyle}>New In</Link></li>
              <li><Link to="/find-your-fit" style={secondaryNavStyle}>Find Your <em style={{ fontStyle: 'italic' }}>Fit</em></Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

const mainNavStyle = {
  fontSize: '14px',
  fontWeight: '500',
  fontFamily: 'Jost, sans-serif',
  color: '#000',
  textDecoration: 'none',
  letterSpacing: '0.3px',
  transition: 'opacity 0.2s',
  whiteSpace: 'nowrap' as const
};

const secondaryNavStyle = {
  fontSize: '14px',
  fontWeight: '400',
  fontFamily: 'Jost, sans-serif',
  color: '#666',
  textDecoration: 'none',
  letterSpacing: '0.3px',
  transition: 'color 0.2s',
  whiteSpace: 'nowrap' as const
};


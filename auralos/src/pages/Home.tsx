import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { products } from '../data/products';

export default function Home() {
  const womensProducts = products.filter(p => p.category === 'womens').slice(0, 7);
  const mensProducts = products.filter(p => p.category === 'mens').slice(0, 7);

  return (
    <main>
      {/* Stranger Things Collection */}
      <section style={{ padding: '0', margin: '0' }}>
        {/* Header Section - Title Left, Buttons Right */}
        <div style={{ 
          maxWidth: '100%', 
          margin: '0 auto',
          padding: '80px 80px 40px 80px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '60px'
        }}>
          <div style={{ flex: 1, maxWidth: '700px' }}>
            <h2 style={{ 
              fontSize: '60px', 
              marginBottom: '20px',
              fontWeight: '500',
              fontFamily: 'Jost, sans-serif',
              letterSpacing: '0.05px',
              lineHeight: '64px',
              whiteSpace: 'nowrap',
              color: '#000'
            }}>
              Stranger Things x ALDO
            </h2>
            <p style={{ 
              fontSize: '18px', 
              color: '#000', 
              lineHeight: '26px',
              maxWidth: '700px',
              fontWeight: '400',
              letterSpacing: '0.1px',
              margin: '0',
              whiteSpace: 'nowrap',
              fontFamily: 'Jost, sans-serif'
            }}>
              Step into a new dimension of style with our out of this world limited-edition collection.
            </p>
          </div>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px',
            minWidth: '480px',
            alignSelf: 'flex-start'
          }}>
            <Link 
              to="/collection/womens-stranger-things" 
              style={{
                padding: '16px 80px',
                border: '1px solid #000',
                backgroundColor: '#fff',
                color: '#000',
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'Jost, sans-serif',
                transition: 'all 0.3s ease',
                letterSpacing: '0.5px'
              }}
            >
              Shop Women
            </Link>
            <Link 
              to="/collection/mens-stranger-things" 
              style={{
                padding: '16px 80px',
                border: '1px solid #000',
                backgroundColor: '#fff',
                color: '#000',
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'Jost, sans-serif',
                transition: 'all 0.3s ease',
                letterSpacing: '0.5px'
              }}
            >
              Shop Men
            </Link>
          </div>
        </div>

        {/* Video Section - FULL WIDTH */}
        <div style={{ 
          width: '100%',
          padding: '0 80px',
          margin: '0'
        }}>
          <video 
            playsInline
            autoPlay 
            loop 
            muted 
            preload="metadata"
            poster="https://www.aldoshoes.com/cdn/shop/files/preview_images/bfe8a34c4df34682b2bd71f6ed429f55.thumbnail.0000000000.jpg?v=1761331014&width=3840"
            style={{ 
              width: '100%', 
              height: 'auto',
              display: 'block'
            }}
            aria-label="Video of Stranger Things x ALDO collection"
          >
            <source src="https://www.aldoshoes.com/cdn/shop/videos/c/vp/bfe8a34c4df34682b2bd71f6ed429f55/bfe8a34c4df34682b2bd71f6ed429f55.HD-1080p-4.8Mbps-60831789.mp4?v=0" type="video/mp4" />
            <img 
              alt="Video of Stranger Things x ALDO collection" 
              src="https://www.aldoshoes.com/cdn/shop/files/preview_images/bfe8a34c4df34682b2bd71f6ed429f55.thumbnail.0000000000_small.jpg?v=1761331014"
            />
          </video>
        </div>
      </section>

      {/* AI Discover Section */}
      <section style={{ padding: '0', margin: '0' }}>
        <div style={{
          width: '100%',
          padding: '70px 80px 80px 80px',
          margin: '0',
          backgroundColor: '#fafafa',
          borderTop: '1px solid #e8e8e8',
          borderBottom: '1px solid #e8e8e8'
        }}>
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '28px',
              color: '#000',
              marginBottom: '12px',
              fontFamily: 'Jost, sans-serif',
              fontWeight: '500',
              letterSpacing: '0.3px'
            }}>
              Not sure what you're looking for?
            </h3>
            <p style={{
              fontSize: '15px',
              color: '#666',
              marginBottom: '28px',
              fontFamily: 'Jost, sans-serif',
              fontWeight: '400',
              lineHeight: '22px'
            }}>
              Let our AI assistant guide you to your perfect product
            </p>
            <Link
              to="/find-your-fit"
              style={{
                display: 'inline-block',
                padding: '18px 60px',
                textAlign: 'center',
                backgroundColor: '#000',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'Jost, sans-serif',
                letterSpacing: '0.5px',
                transition: 'all 0.3s ease',
                border: 'none'
              }}
            >
              Find Your <em style={{ fontStyle: 'italic' }}>Fit</em>
            </Link>
          </div>
        </div>
      </section>

      {/* Boot Edit */}
      <section style={{ padding: '0', margin: '0' }}>
        {/* Header Section - Title Left, Buttons Right */}
        <div style={{
          maxWidth: '100%',
          margin: '0 auto',
          padding: '80px 80px 40px 80px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '60px'
        }}>
          <div style={{ flex: 1, maxWidth: '700px' }}>
            <h2 style={{
              fontSize: '60px',
              marginBottom: '20px',
              fontWeight: '500',
              fontFamily: 'Jost, sans-serif',
              letterSpacing: '0.05px',
              lineHeight: '64px',
              whiteSpace: 'nowrap',
              color: '#000'
            }}>
              The Boot Edit
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#000',
              lineHeight: '26px',
              maxWidth: '700px',
              fontWeight: '400',
              letterSpacing: '0.1px',
              margin: '0',
              whiteSpace: 'nowrap',
              fontFamily: 'Jost, sans-serif'
            }}>
              Versatile boots built for shifting temps, layered looks, and every step ahead. To take you from now into what's next.
            </p>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            minWidth: '480px',
            alignSelf: 'flex-start'
          }}>
            <Link
              to="/collection/womens-boots"
              style={{
                padding: '16px 80px',
                border: '1px solid #000',
                backgroundColor: '#fff',
                color: '#000',
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'Jost, sans-serif',
                transition: 'all 0.3s ease',
                letterSpacing: '0.5px'
              }}
            >
              Shop Women
            </Link>
            <Link
              to="/collection/mens-boots"
              style={{
                padding: '16px 80px',
                border: '1px solid #000',
                backgroundColor: '#fff',
                color: '#000',
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                fontFamily: 'Jost, sans-serif',
                transition: 'all 0.3s ease',
                letterSpacing: '0.5px'
              }}
            >
              Shop Men
            </Link>
          </div>
        </div>

        {/* Image Section - FULL WIDTH */}
        <div style={{
          width: '100%',
          padding: '0 80px',
          margin: '0'
        }}>
          <img
            src="https://www.aldoshoes.com/cdn/shop/files/oct25-s18-hp-inhead-boots-desktop.jpg?v=1761330882"
            alt="The Boot Edit"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block'
            }}
          />
        </div>
      </section>

      {/* Women's Best Sellers */}
      <section style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <h2 style={{ fontSize: '32px' }}>Women's Best Sellers</h2>
            <Link to="/collection/womens" style={{ textDecoration: 'underline', color: '#000' }}>
              Shop Women
            </Link>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '30px'
          }}>
            {womensProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Men's Best Sellers */}
      <section style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <h2 style={{ fontSize: '32px' }}>Men's Best Sellers</h2>
            <Link to="/collection/mens" style={{ textDecoration: 'underline', color: '#000' }}>
              Shop Men
            </Link>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '30px'
          }}>
            {mensProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Trending Categories */}
      <section style={{ padding: '60px 20px', backgroundColor: '#f5f5f5' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '32px', marginBottom: '40px' }}>Now Trending</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px'
          }}>
            {[
              { name: 'Suede', link: '/collection/suede', color: 'D2B48C' },
              { name: 'Animal Prints', link: '/collection/animal-print', color: 'F4A460' },
              { name: 'Brown', link: '/collection/brown', color: '8B4513' },
              { name: 'Cozy', link: '/collection/cozy', color: 'DEB887' }
            ].map(cat => (
              <Link
                key={cat.name}
                to={cat.link}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  transition: 'transform 0.3s ease'
                }}
                className="trending-card"
              >
                <img
                  src={`https://via.placeholder.com/300x300/${cat.color}/FFFFFF?text=${cat.name.replace(' ', '+')}`}
                  alt={cat.name}
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
                />
                <p style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: '#fff',
                  padding: '15px',
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: 500,
                  textTransform: 'uppercase'
                }}>
                  {cat.name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* New Bags Banner */}
      <section style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
            alignItems: 'center'
          }} className="collection-content">
            <div>
              <img
                src="https://via.placeholder.com/800x500/000000/FFFFFF?text=New+Bags"
                alt="New Bags"
                style={{ width: '100%', borderRadius: '4px' }}
              />
            </div>
            <div>
              <h2 style={{ fontSize: '36px', marginBottom: '15px' }}>New Bags, Just In</h2>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '25px' }}>
                New season, new silhouettes, new textures. Discover must-have bags to unlock your fall closet's potential.
              </p>
              <Link to="/collection/bags" className="btn-primary">Shop Bags</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}


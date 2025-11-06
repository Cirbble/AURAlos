import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { products } from '../data/products';

export default function Home() {
  const womensProducts = products.filter(p => p.category === 'womens').slice(0, 7);
  const mensProducts = products.filter(p => p.category === 'mens').slice(0, 7);

  return (
    <main>
      {/* Hero Banner */}
      <section style={{
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
        backgroundImage: 'url(https://via.placeholder.com/1600x600/8B4513/FFFFFF?text=BOGO+40%25+OFF)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: '#fff',
        position: 'relative',
        padding: '80px 20px',
        textAlign: 'center'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)'
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '10px'
          }}>
            Limited Time Only
          </p>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '15px',
            textTransform: 'uppercase'
          }}>
            BOGO 40% off select styles
          </h1>
          <p style={{ fontSize: '16px', marginBottom: '30px' }}>
            Discount applied at cart
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/collection/womens" className="btn-primary">Shop Women</Link>
            <Link to="/collection/mens" className="btn-primary">Shop Men</Link>
            <Link to="/collection/bags" className="btn-primary">Shop Bags</Link>
          </div>
        </div>
      </section>

      {/* Stranger Things Collection */}
      <section style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
            alignItems: 'center'
          }} className="collection-content">
            <div>
              <h2 style={{ fontSize: '36px', marginBottom: '15px' }}>Stranger Things x ALDO</h2>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '25px' }}>
                Step into a new dimension of style with our out of this world limited-edition collection.
              </p>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <Link to="/collection/womens-stranger-things" className="btn-secondary">Shop Women</Link>
                <Link to="/collection/mens-stranger-things" className="btn-secondary">Shop Men</Link>
                <Link to="/collection/mens-stranger-things" className="btn-secondary">Shop Men</Link>
              </div>
              
            </div>
            <div>
              <img
                src="https://via.placeholder.com/600x400/8B0000/FFFFFF?text=Stranger+Things+x+ALDO"
                alt="Stranger Things Collection"
                style={{ width: '100%', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>
      </section>
      {/* AI banner section - full width clickable banner */}
      <section style={{ width: '100%', backgroundColor: '#f5f5f5' }}>
        <Link
          to="/ai-collection"
          className="btn-secondary"
          style={{
            display: 'block',
            width: '100%',
            padding: '80px 20px',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}
        >
          AI Discover!
        </Link>
      </section>
      {/* Boot Edit */}
      <section style={{ padding: '60px 20px', backgroundColor: '#f5f5f5' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '40px',
            alignItems: 'center'
          }} className="collection-content">
            <div>
              <img
                src="https://via.placeholder.com/600x400/8B4513/FFFFFF?text=Boot+Collection"
                alt="Boot Edit"
                style={{ width: '100%', borderRadius: '4px' }}
              />
            </div>
            <div>
              <h2 style={{ fontSize: '36px', marginBottom: '15px' }}>The Boot Edit</h2>
              <p style={{ fontSize: '16px', color: '#666', marginBottom: '25px' }}>
                Versatile boots built for shifting temps, layered looks, and every step ahead. To take you from now into what's next.
              </p>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                <Link to="/collection/womens-boots" className="btn-secondary">Shop Women</Link>
                <Link to="/collection/mens-boots" className="btn-secondary">Shop Men</Link>
              </div>
            </div>
          </div>
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


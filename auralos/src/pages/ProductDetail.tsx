import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  const product = products.find(p => p.id === parseInt(id || '0'));

  useEffect(() => {
    if (!product) {
      navigate('/');
    } else {
      // Save to recently viewed
      const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      const updated = [product.id, ...recentlyViewed.filter((pid: number) => pid !== product.id)].slice(0, 10);
      localStorage.setItem('recentlyViewed', JSON.stringify(updated));
    }
  }, [product, navigate]);

  if (!product) return null;

  const similarProducts = products
    .filter(p => p.id !== product.id && p.subcategory === product.subcategory)
    .slice(0, 4);

  const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]')
    .filter((pid: number) => pid !== product.id)
    .slice(0, 4)
    .map((pid: number) => products.find(p => p.id === pid))
    .filter(Boolean);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert('Please select a size');
      return;
    }

    if (addItem(product.id, selectedSize, 1)) {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  return (
    <main style={{ padding: '40px 20px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{
          display: 'flex',
          gap: '10px',
          fontSize: '13px',
          marginBottom: '30px',
          color: '#666'
        }}>
          <Link to="/" style={{ color: '#666' }}>Home</Link>
          <span>/</span>
          <Link to={`/collection/${product.category}`} style={{ color: '#666' }}>
            {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
          </Link>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
          marginBottom: '60px'
        }} className="product-container">
          {/* Product Images */}
          <div>
            <div style={{ marginBottom: '20px', borderRadius: '4px', overflow: 'hidden' }}>
              <img
                src={product.image}
                alt={product.name}
                style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
              {Array(4).fill(0).map((_, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  style={{
                    flexShrink: 0,
                    width: '80px',
                    height: '80px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: selectedImage === i ? '2px solid #000' : '2px solid transparent',
                    transition: 'border 0.3s ease'
                  }}
                >
                  <img
                    src={product.image}
                    alt={`${product.name} view ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div>
            {product.badge && (
              <div style={{
                backgroundColor: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '11px',
                marginBottom: '15px'
              }}>
                <i className="fas fa-check-circle"></i>
                {product.badge}
              </div>
            )}

            <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>{product.name}</h1>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>{product.type}</p>
            <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '15px' }}>
              ${product.price}
            </div>

            {product.promo && (
              <div style={{
                backgroundColor: '#fef3f3',
                color: '#8B0000',
                padding: '10px 15px',
                borderRadius: '4px',
                fontSize: '13px',
                marginBottom: '30px'
              }}>
                {product.promo}
              </div>
            )}

            {/* Color Selection */}
            {product.colors.length > 1 && (
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '10px', fontSize: '14px' }}>
                  Color
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {product.colors.map((color, i) => (
                    <button
                      key={color}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: i === 0 ? '2px solid #000' : '2px solid #e0e0e0',
                        backgroundColor: getColorHex(color),
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', fontWeight: 500, marginBottom: '10px', fontSize: '14px' }}>
                Size
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {product.sizes.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{
                      padding: '10px 20px',
                      border: selectedSize === size ? '2px solid #000' : '2px solid #e0e0e0',
                      backgroundColor: selectedSize === size ? '#000' : '#fff',
                      color: selectedSize === size ? '#fff' : '#000',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <a href="#" style={{ fontSize: '13px', textDecoration: 'underline', color: '#666' }}>
                Size Guide
              </a>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '15px',
                fontSize: '16px',
                marginBottom: '30px',
                backgroundColor: addedToCart ? '#2ecc71' : '#000'
              }}
            >
              {addedToCart ? 'Added to Cart!' : 'Add to Cart'}
            </button>

            {/* Product Description */}
            <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '30px' }}>
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Details</h3>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.8 }}>
                  {product.description}
                </p>
              </div>
              <div style={{ marginBottom: '25px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Features</h3>
                <ul style={{ fontSize: '14px', color: '#666', lineHeight: 1.8, paddingLeft: '20px' }}>
                  {product.features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>Shipping & Returns</h3>
                <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.8 }}>
                  Free shipping on orders over $99. Free returns within 60 days.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <section style={{ marginBottom: '60px' }}>
            <h2 style={{ fontSize: '28px', marginBottom: '30px' }}>Similar Styles</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '30px'
            }}>
              {similarProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <section>
            <h2 style={{ fontSize: '28px', marginBottom: '30px' }}>Recently Viewed</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '30px'
            }}>
              {recentlyViewed.map((p: any) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    'black': '#000000',
    'dark brown': '#3D2817',
    'brown': '#8B4513',
    'medium brown': '#6B4423',
    'open brown': '#8B6914',
    'cognac': '#A0522D',
    'tan': '#D2B48C',
    'wheat': '#F5DEB3',
    'burgundy': '#800020',
    'bordeaux': '#6D071A',
    'navy': '#000080',
    'white': '#FFFFFF',
    'red': '#DC143C',
    'blue': '#4169E1',
    'nude': '#F5E6D3'
  };

  return colorMap[colorName.toLowerCase()] || '#CCCCCC';
}


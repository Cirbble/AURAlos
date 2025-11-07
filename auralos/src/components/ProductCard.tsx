import { Link } from 'react-router-dom';
import type { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Link to ALDO product page if URL exists, otherwise internal page
  const cardContent = (
    <>
      <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '3/4' }}>
        {product.badge && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: '#fff',
            padding: '5px 10px',
            fontSize: '11px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            zIndex: 1
          }}>
            <i className="fas fa-check-circle"></i>
            {product.badge}
          </div>
        )}
        <img
          src={product.image}
          alt={product.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.3s ease'
          }}
          className="product-image"
        />
      </div>
      <div style={{ padding: '15px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '5px', color: '#000' }}>
          {product.name}
        </h3>
        <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          {product.type}
        </p>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#000', marginBottom: '10px' }}>
          ${product.price}
        </div>
        {product.promo && (
          <p style={{ fontSize: '11px', color: '#8B0000', fontWeight: 500 }}>
            {product.promo}
          </p>
        )}
      </div>
    </>
  );

  const cardStyle = {
    backgroundColor: '#fff',
    borderRadius: '4px',
    overflow: 'hidden',
    textDecoration: 'none',
    color: '#333',
    transition: 'box-shadow 0.3s ease',
    display: 'block'
  };

  // If product has ALDO URL, link externally, otherwise link internally
  if (product.url) {
    return (
      <a
        href={product.url}
        target="_blank"
        rel="noopener noreferrer"
        style={cardStyle}
        className="product-card"
      >
        {cardContent}
      </a>
    );
  }

  return (
    <Link
      to={`/product/${product.id}`}
      style={cardStyle}
      className="product-card"
    >
      {cardContent}
    </Link>
  );
}


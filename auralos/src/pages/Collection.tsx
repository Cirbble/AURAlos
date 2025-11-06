import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { products } from '../data/products';
import type { Product } from '../types/product';
import ProductCard from '../components/ProductCard';

export default function Collection() {
  const { collection } = useParams<{ collection: string }>();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let filtered = [...products];

    // Filter by collection
    if (collection) {
      switch (collection) {
        case 'womens':
          filtered = filtered.filter(p => p.category === 'womens');
          break;
        case 'mens':
          filtered = filtered.filter(p => p.category === 'mens');
          break;
        case 'boots':
          filtered = filtered.filter(p => p.subcategory === 'boots');
          break;
        case 'heels':
          filtered = filtered.filter(p => p.subcategory === 'heels');
          break;
        case 'bags':
          filtered = filtered.filter(p => p.subcategory === 'bags');
          break;
        case 'new-arrivals':
          filtered = filtered.slice(0, 8);
          break;
        case 'womens-boots':
          filtered = filtered.filter(p => p.category === 'womens' && p.subcategory === 'boots');
          break;
        case 'mens-boots':
          filtered = filtered.filter(p => p.category === 'mens' && p.subcategory === 'boots');
          break;
      }
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.reverse();
        break;
    }

    setFilteredProducts(filtered);
  }, [collection, sortBy]);

  const getCollectionTitle = () => {
    if (!collection) return 'All Products';
    
    const titles: Record<string, string> = {
      'womens': "Women's Collection",
      'mens': "Men's Collection",
      'boots': 'Boot Shop',
      'heels': 'Heels Collection',
      'bags': 'Bags & Accessories',
      'new-arrivals': 'New Arrivals',
      'womens-boots': "Women's Boots",
      'mens-boots': "Men's Boots",
    };

    return titles[collection] || collection.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getCollectionDescription = () => {
    const descriptions: Record<string, string> = {
      'womens': "Discover our latest women's shoes and accessories",
      'mens': "Explore our men's footwear collection",
      'boots': 'Find the perfect boots for any season',
      'heels': 'Elevate your style with our elegant heels',
      'bags': 'Complete your look with our stylish bags',
      'new-arrivals': 'Check out our latest products',
    };

    return descriptions[collection || ''] || '';
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
          <span>{getCollectionTitle()}</span>
        </div>

        {/* Collection Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '40px', marginBottom: '15px' }}>{getCollectionTitle()}</h1>
          <p style={{ fontSize: '16px', color: '#666' }}>{getCollectionDescription()}</p>
        </div>

                {/* Filter and Sort Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '30px',
                  padding: '20px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px'
                }} className="filter-sort-bar">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 20px',
                      backgroundColor: '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <i className="fas fa-filter"></i>
                    Filter
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '14px' }}>Sort by:</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        fontSize: '14px',
                        backgroundColor: '#fff'
                      }}
                    >
                      <option value="featured">Featured</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="newest">Newest</option>
                    </select>
                  </div>
                </div>

                {/* Filter Sidebar */}
                {showFilters && (
                  <div style={{
                    backgroundColor: '#f5f5f5',
                    padding: '20px',
                    borderRadius: '4px',
                    marginBottom: '30px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <h3>Filters</h3>
                      <button
                        onClick={() => setShowFilters(false)}
                        style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <p style={{ fontSize: '14px', color: '#666' }}>
                      Filter options would appear here in a production application.
                    </p>
                  </div>
                )}

                {/* Products Grid */}
                {filteredProducts.length > 0 ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '30px'
                  }}>
                    {filteredProducts.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <h2 style={{ fontSize: '28px', marginBottom: '15px' }}>No products found</h2>
                    <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
                      Try adjusting your filters or browse other collections.
                    </p>
                    <Link to="/" className="btn-primary">View All Products</Link>
                  </div>
                )}

                {/* Load More Button */}
                {filteredProducts.length > 12 && (
                  <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <button className="btn-secondary">Load More</button>
                  </div>
                )}
      </div>
    </main>
  );
}


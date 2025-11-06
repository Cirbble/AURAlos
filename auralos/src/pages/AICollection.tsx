import { products } from '../data/products';
import ProductCard from '../components/ProductCard';

export default function AICollection() {
  // Filter products or use AI-specific products later
  const aiRecommendedProducts = products.slice(0, 12); // For now, showing first 12 products

  return (
    <main>
      {/* Hero Banner */}
      <section style={{
        background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
        padding: '60px 20px',
        color: '#fff',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}>
            AI-Curated Collection
          </h1>
          <p style={{
            fontSize: '18px',
            maxWidth: '800px',
            margin: '0 auto 30px',
            lineHeight: '1.6'
          }}>
            Discover personalized recommendations powered by AI. Our smart algorithm curates pieces that match your style preferences and current trends.
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '30px'
          }}>
            {aiRecommendedProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section style={{ 
        padding: '60px 20px',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '32px',
            textAlign: 'center',
            marginBottom: '40px'
          }}>
            Smart Shopping Features
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px',
            textAlign: 'center'
          }}>
            {[
              {
                title: 'Style Analysis',
                description: 'Our AI analyzes your preferences to suggest items that match your unique style.'
              },
              {
                title: 'Trend Prediction',
                description: 'Stay ahead with AI-powered trend forecasting and recommendations.'
              },
              {
                title: 'Smart Sizing',
                description: 'Get accurate size recommendations based on your fit preferences.'
              }
            ].map(feature => (
              <div key={feature.title} style={{ padding: '20px' }}>
                <h3 style={{ 
                  fontSize: '24px',
                  marginBottom: '15px'
                }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  color: '#666',
                  lineHeight: '1.6'
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
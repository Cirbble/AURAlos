import { useState } from 'react';
import { products } from '../data/products';
import ProductCard from '../components/ProductCard';

export default function AICollection() {
  // Filter products or use AI-specific products later
  const aiRecommendedProducts = products.slice(0, 12); // For now, showing first 12 products
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (files: File[]) => {
    setError(null);
    const file = files[0]; // Handle first file only

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setIsLoading(true);

    // Create a preview URL for the image
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setError('Error reading file');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

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

      {/* Image Upload Section */}
      <section style={{ 
        padding: '60px 20px',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '32px',
            marginBottom: '20px'
          }}>
            Find Similar Styles
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '30px'
          }}>
            Upload an image or drag and drop to find similar products in our collection
          </p>
          
          <div
            style={{
              border: '2px dashed #6366F1',
              borderRadius: '12px',
              padding: '40px 20px',
              backgroundColor: '#EEF2FF',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.backgroundColor = '#E0E7FF';
              e.currentTarget.style.borderColor = '#4F46E5';
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.style.backgroundColor = '#EEF2FF';
              e.currentTarget.style.borderColor = '#6366F1';
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.backgroundColor = '#EEF2FF';
              e.currentTarget.style.borderColor = '#6366F1';
              const files = Array.from(e.dataTransfer.files);
              const imageFiles = files.filter(file => file.type.startsWith('image/'));
              if (imageFiles.length > 0) {
                handleImageUpload(imageFiles);
              }
            }}
            onClick={() => document.getElementById('imageUpload')?.click()}
          >
            {selectedImage ? (
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '300px',
                margin: '0 auto'
              }}>
                <img
                  src={selectedImage}
                  alt="Uploaded preview"
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(null);
                      setError(null);
                    }}
                    style={{
                      background: '#EF4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px'
                    }}
                    title="Remove image"
                  >
                    ×
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(null);
                      setError('Upload declined');
                      // Optional: Add any decline-specific logic here
                      setTimeout(() => setError(null), 3000); // Clear message after 3 seconds
                    }}
                    style={{
                      background: '#4B5563',
                      color: 'white',
                      border: 'none',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Decline upload"
                  >
                    Decline
                  </button>
                </div>
                {isLoading && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '4px'
                  }}>
                    Processing...
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '15px'
              }}>
                <svg 
                  width="48" 
                  height="48" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="#6366F1" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div>
                  <p style={{ 
                    fontSize: '16px', 
                    fontWeight: 500,
                    color: '#4F46E5',
                    marginBottom: '8px'
                  }}>
                    Drag and drop your image here
                  </p>
                  <p style={{ 
                    fontSize: '14px',
                    color: '#6B7280'
                  }}>
                    or click to browse files
                  </p>
                </div>
              </div>
            )}
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) {
                  handleImageUpload(files);
                }
              }}
            />
          </div>
          
          {error && (
            <p style={{
              fontSize: '14px',
              color: '#EF4444',
              marginTop: '15px',
              padding: '8px 12px',
              backgroundColor: '#FEF2F2',
              borderRadius: '4px',
              display: 'inline-block'
            }}>
              {error}
            </p>
          )}
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            marginTop: '15px'
          }}>
            Supported formats: JPG, PNG, GIF (max 5MB)
          </p>
        </div>
      </section>
    </main>
  );
}
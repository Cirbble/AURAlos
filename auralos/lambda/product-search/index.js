// Lambda Function: Product Search with Vector Similarity
// File: product-search-lambda/index.js

const { OpenSearchClient, SearchCommand } = require('@aws-sdk/client-opensearch');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const opensearchClient = new OpenSearchClient({ region: process.env.AWS_REGION });
const s3Client = new S3Client({ region: process.env.AWS_REGION });

/**
 * Action: searchProducts
 * Search for products based on visual similarity and filters
 */
async function searchProducts(parameters) {
  const { imageEmbedding, filters = {}, limit = 10 } = parameters;

  try {
    // Build OpenSearch query
    const query = {
      size: limit,
      query: {
        bool: {
          must: [
            {
              knn: {
                embedding: {
                  vector: imageEmbedding,
                  k: limit
                }
              }
            }
          ],
          filter: []
        }
      }
    };

    // Add filters if provided
    if (filters.priceMin || filters.priceMax) {
      query.query.bool.filter.push({
        range: {
          price: {
            gte: filters.priceMin || 0,
            lte: filters.priceMax || 999999
          }
        }
      });
    }

    if (filters.color) {
      query.query.bool.filter.push({
        match: { color: filters.color }
      });
    }

    if (filters.material) {
      query.query.bool.filter.push({
        match: { material: filters.material }
      });
    }

    if (filters.category) {
      query.query.bool.filter.push({
        match: { category: filters.category }
      });
    }

    // Execute search
    const searchResponse = await opensearchClient.send(new SearchCommand({
      index: 'auralos-products',
      body: query
    }));

    // Format results
    const products = searchResponse.hits.hits.map(hit => ({
      productId: hit._id,
      score: hit._score,
      ...hit._source
    }));

    return {
      success: true,
      products: products,
      totalFound: searchResponse.hits.total.value
    };

  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
}

/**
 * Action: getProductDetails
 * Get detailed information about a specific product
 */
async function getProductDetails(parameters) {
  const { productId } = parameters;

  try {
    // Fetch product from S3 catalog
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `products/${productId}.json`
    }));

    const productData = await streamToString(response.Body);
    const product = JSON.parse(productData);

    return {
      success: true,
      product: product
    };

  } catch (error) {
    console.error('Error fetching product details:', error);
    throw error;
  }
}

/**
 * Action: rankProducts
 * Rank products and generate pros/cons based on user preferences
 */
async function rankProducts(parameters) {
  const { products, userPreferences } = parameters;

  try {
    // Fetch full product details
    const productDetails = await Promise.all(
      products.map(id => getProductDetails({ productId: id }))
    );

    // Score and rank products
    const rankedProducts = productDetails
      .map(result => result.product)
      .map(product => {
        let score = 0;
        const pros = [];
        const cons = [];

        // Price alignment
        if (userPreferences.budget) {
          const [minBudget, maxBudget] = userPreferences.budget;
          if (product.price >= minBudget && product.price <= maxBudget) {
            score += 30;
            pros.push(`Within your budget range ($${minBudget}-$${maxBudget})`);
          } else if (product.price > maxBudget) {
            cons.push(`Slightly over budget by $${product.price - maxBudget}`);
          } else {
            pros.push(`Great value at $${product.price}`);
          }
        }

        // Color match
        if (userPreferences.color && product.color.toLowerCase().includes(userPreferences.color.toLowerCase())) {
          score += 20;
          pros.push(`Matches your preferred ${userPreferences.color} color`);
        } else if (userPreferences.color) {
          cons.push(`Available in ${product.color} instead of ${userPreferences.color}`);
        }

        // Material match
        if (userPreferences.material && product.material.toLowerCase().includes(userPreferences.material.toLowerCase())) {
          score += 20;
          pros.push(`Made with your preferred ${userPreferences.material} material`);
        }

        // Style match (from visual similarity - already in product.visualSimilarity)
        if (product.visualSimilarity) {
          score += product.visualSimilarity * 30;
          if (product.visualSimilarity > 0.8) {
            pros.push('Closely matches your uploaded image style');
          } else if (product.visualSimilarity > 0.6) {
            pros.push('Similar style to your inspiration');
          }
        }

        // Features
        if (product.features && product.features.includes('Pillow Walk')) {
          pros.push('Features Pillow Walk comfort technology');
        }

        if (product.promo) {
          pros.push(product.promo);
        }

        return {
          ...product,
          matchScore: score,
          pros: pros,
          cons: cons.length > 0 ? cons : ['None significant']
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    return {
      success: true,
      rankedProducts: rankedProducts,
      topThree: rankedProducts.slice(0, 3)
    };

  } catch (error) {
    console.error('Error ranking products:', error);
    throw error;
  }
}

// Main Lambda handler
exports.handler = async (event) => {
  try {
    // Parse the action group request
    const { apiPath, parameters, httpMethod } = event;

    let result;

    // Route to appropriate function based on action
    switch (apiPath) {
      case '/searchProducts':
        result = await searchProducts(parameters);
        break;
      case '/getProductDetails':
        result = await getProductDetails(parameters);
        break;
      case '/rankProducts':
        result = await rankProducts(parameters);
        break;
      default:
        throw new Error(`Unknown action: ${apiPath}`);
    }

    return {
      statusCode: 200,
      body: result
    };

  } catch (error) {
    console.error('Error in action group:', error);
    return {
      statusCode: 500,
      body: {
        success: false,
        error: error.message
      }
    };
  }
};

// Helper function
async function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}
// Lambda Function: Image Upload to S3
// File: image-upload-lambda/index.js

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { image, fileName, contentType } = body;

    // Decode base64 image
    const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    // Generate unique filename
    const timestamp = Date.now();
    const s3Key = `user-uploads/${timestamp}-${fileName}`;

    // Upload to S3
    const uploadParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: s3Key,
      Body: imageBuffer,
      ContentType: contentType || 'image/jpeg',
      Metadata: {
        uploadedAt: new Date().toISOString()
      }
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Generate image embedding using Bedrock Titan
    const embeddingParams = {
      modelId: 'amazon.titan-embed-image-v1',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputImage: image,
        embeddingConfig: {
          outputEmbeddingLength: 1024
        }
      })
    };

    const embeddingResponse = await bedrockClient.send(new InvokeModelCommand(embeddingParams));
    const embeddingData = JSON.parse(new TextDecoder().decode(embeddingResponse.body));

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        s3Url: `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`,
        s3Key: s3Key,
        embedding: embeddingData.embedding,
        message: 'Image uploaded and processed successfully'
      })
    };

  } catch (error) {
    console.error('Error processing image:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};


# Hardcoded AI Search Implementation

This implementation replaces the AI agent-based search with a hardcoded system that uses local ALDO product data and images.

## Changes Made

### 1. Product Data Loading (`src/utils/productLoader.ts`)
- Loads product data from `src/assets/aldo_products_bedrock.jsonl`
- Parses JSONL format (each line is a separate JSON object)
- Maps downloaded images to local paths in `public/images/`
- Provides search functionality based on product names, descriptions, and categories

### 2. Hardcoded Search Service (`src/services/hardcodedSearchService.ts`)
- Replaces Bedrock AI agent calls with local search logic
- Generates realistic product recommendations with pros/cons
- Simulates conversation flow with predefined responses
- Analyzes uploaded images based on filename patterns

### 3. Updated AI Collection Page (`src/pages/AICollection.tsx`)
- Removed all AWS Bedrock and S3 dependencies
- Uses hardcoded search service instead of AI agent
- Maintains the same UI/UX flow (input → conversation → results)
- Uses local images from `public/images/` folder

### 4. Image Handling
- Moved all product images from `src/assets/images/` to `public/images/`
- Images are now served statically and accessible via `/images/filename.jpg`
- Fallback to original ALDO URLs if local images fail to load

## How It Works

### Search Process
1. **Text Search**: Uses keyword matching against product names, descriptions, and categories
2. **Image Upload**: Analyzes filename to suggest relevant search terms
3. **Conversation**: Provides predefined responses to guide users
4. **Results**: Returns top 3 matching products with generated pros/cons

### Search Algorithm
- **Hardcoded Results**: Always returns the same 3 products:
  1. **Aston** - Mock product with real images (since not in JSONL data)
  2. **Brando** - From JSONL data (men's ankle boot)
  3. **Roll4yourlife** - From JSONL data (men's loafer)
- All searches return these products regardless of search terms

### Product Data Structure
Each product from the JSONL file contains:
- `name`: Product name
- `price`: Price string (e.g., "Unit price $28")
- `description`: Detailed product description
- `category`: Product category (shoe, accessory, etc.)
- `url`: Original ALDO product URL
- `images`: Array of original image URLs
- `downloadedImages`: Array of local image filenames

## Testing

Run the test file to verify functionality:
```bash
# In browser console or Node.js environment
import './src/test-search.ts'
```

## Benefits

1. **No External Dependencies**: No need for AWS credentials or internet connection
2. **Faster Response**: Instant search results without API calls
3. **Predictable Results**: Consistent search behavior
4. **Local Images**: All product images served locally
5. **Realistic Experience**: Maintains the AI-like conversation flow

## Future Enhancements

1. **Better Search Algorithm**: Implement fuzzy matching, synonyms, filters
2. **More Conversation Logic**: Add more sophisticated response generation
3. **Image Analysis**: Use actual computer vision for uploaded images
4. **Product Matching**: Better mapping between search terms and products
5. **Personalization**: Remember user preferences and search history
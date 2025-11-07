import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { products } from '../data/products';
import { uploadImageToS3, validateImageFile, fileToBase64 } from '../services/s3Service';
import { invokeAgent, generateSessionId } from '../services/bedrockService';
import { analyzeImageWithBDA, formatBDAMetadataForAgent } from '../services/bdaService';
import type { AgentMessage } from '../services/bedrockService';
import type { Product } from '../types/product';
import type { BDAImageMetadata } from '../services/bdaService';

// Extend Window interface to include BDA metadata
declare global {
  interface Window {
    __bdaMetadata?: BDAImageMetadata;
    __bdaOutputS3Uri?: string;
  }
}

interface AgentProductResult {
  productId?: string;
  productName?: string;
  name?: string;
  product_name?: string;
  score?: number;
  reasoning?: string;
  pros?: string[];
  cons?: string[];
  // Additional fields that might come from Knowledge Base
  type?: string;
  price?: number;
  category?: string;
  subcategory?: string;
  color?: string;
  colors?: string[];
  sizes?: string[];
  image?: string;
  description?: string;
  features?: string[];
  [key: string]: any; // Allow any other fields
}

type Stage = 'input' | 'image_review' | 'conversation';

interface SearchResult {
  product: Product;
  matchScore: number;
  reasoning: string;
  pros: string[];
  cons: string[];
}

export default function AICollection() {
  const navigate = useNavigate();
  
  // State management
  const [stage, setStage] = useState<Stage>('input');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageS3Key, setImageS3Key] = useState<string | null>(null);
  const [textPrompt, setTextPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState(() => generateSessionId());
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [imageSpecifications, setImageSpecifications] = useState('');
  const [bdaMetadata, setBdaMetadata] = useState<BDAImageMetadata | null>(null);

  const placeholders = [
    "black leather combat boots with lug soles for winter",
    "white minimalist sneakers with platform soles",
    "strappy heeled sandals in metallic gold for events",
    "cognac brown crossbody bags with chain straps",
    "burgundy suede ankle boots with block heels",
    "classic penny loafers in dark brown leather",
    "chunky platform heels in patent leather",
    "oversized tote bags with structured silhouette",
    "pointed-toe mules with kitten heels in beige",
    "oxford dress shoes in polished black leather"
  ];

  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Carousel animation - only when user is NOT typing
  useEffect(() => {
    // Don't animate if user is typing
    if (textPrompt.length > 0) {
      return;
    }

    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % placeholders.length);
    }, 3000); // Slightly slower for longer text

    return () => clearInterval(interval);
  }, [placeholders.length, textPrompt]);

  // Helper function for STRICT product matching - NO FALLBACKS
  const findBestProductMatch = (productName: string): Product | undefined => {
    console.log(`🔍 STRICT MATCHING for: "${productName}"`);
    const productNameLower = productName.toLowerCase();
    
    // Try exact match first
    let product = products.find(p => 
      p.name.toLowerCase() === productNameLower
    );
    
    if (product) {
      console.log(`✅ EXACT MATCH: "${product.name}"`);
      return product;
    }
    
    // Color-aware matching ONLY - no vague matches
    const colorWords = ['black', 'white', 'brown', 'green', 'blue', 'red', 'pink', 'grey', 'gray', 'beige', 'burgundy', 'navy', 'tan', 'cognac', 'emerald', 'dark', 'light', 'other', 'cognac', 'bordo', 'ice'];
    const hasColorInSearch = colorWords.some(color => productNameLower.includes(color));
    
    if (hasColorInSearch) {
      // Extract base product name (first word)
      const baseNameMatch = productNameLower.split(/[\s\(]/)[0];
      
      // Find ALL products with matching base name
      const matchingBaseProducts = products.filter(p => 
        p.name.toLowerCase().includes(baseNameMatch)
      );
      
      console.log(`📋 Found ${matchingBaseProducts.length} products with base name "${baseNameMatch}":`, 
        matchingBaseProducts.map(p => p.name));
      
      // Find product with BOTH base name AND color match
      product = matchingBaseProducts.find(p => {
        const pNameLower = p.name.toLowerCase();
        
        // Check if any color from search appears in product name
        const matchingColor = colorWords.find(color => 
          productNameLower.includes(color) && pNameLower.includes(color)
        );
        
        if (matchingColor) {
          console.log(`✅ COLOR MATCH: "${p.name}" (matched on color: ${matchingColor})`);
          return true;
        }
        return false;
      });
      
      if (product) return product;
    }
    
    // NO FALLBACK - return undefined if no good match
    console.error(`❌ NO MATCH FOUND for "${productName}" - refusing to show wrong product`);
    return undefined;
  };

  const handleImageUpload = async (files: File[]) => {
    setError(null);
    const file = files[0];

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);

    // Create preview and IMMEDIATELY transition to review page
    const preview = await fileToBase64(file);
    setSelectedImage(preview);
    setStage('image_review'); // Instant transition!

    // Background processing - upload and analyze
    (async () => {
      try {
        console.log('🚀 Starting background image upload and analysis...');

        // Step 1: Upload to S3
        console.log('📤 Uploading image to S3...');
        const uploadResult = await uploadImageToS3(file);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }

        const s3Key = uploadResult.s3Key;
        setImageS3Key(s3Key);
        console.log('✅ Image uploaded to S3:', s3Key);

        // Step 2: Analyze with BDA/Claude Vision
        console.log('🔍 Starting image analysis with Claude Vision...');
        console.log('⏱️  This may take 20-40 seconds...');
        const startTime = Date.now();

        const bdaResult = await analyzeImageWithBDA(s3Key);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`⏱️  Analysis took ${elapsed}s`);

        if (!bdaResult.success || !bdaResult.metadata) {
          const errorMsg = bdaResult.error || 'Failed to analyze image';
          console.error('❌ BDA analysis failed:', errorMsg);
          throw new Error(errorMsg);
        }

        const metadata = bdaResult.metadata;
        console.log('✅ Image analysis successful:', metadata);

        // Store metadata
        window.__bdaMetadata = metadata;
        setBdaMetadata(metadata);
        console.log('✅ Metadata stored and ready for search');

      } catch (err) {
        console.error('❌ Error in background image analysis:', err);
        const errorMsg = err instanceof Error ? err.message : 'Background analysis failed';
        setError(`${errorMsg} You can still try text search.`);
        // Don't set bdaMetadata, which will cause handleImageSearch to timeout with helpful message
      }
    })();
  };

  const handleImageSearch = async () => {
    console.log('🔍 handleImageSearch called');
    setIsLoading(true);

    try {
      // Wait for BDA metadata if not ready yet
      let metadata = bdaMetadata;
      console.log('📊 Current bdaMetadata state:', metadata);

      if (!metadata) {
        console.log('⏳ Waiting for image analysis to complete...');
        // Wait up to 60 seconds for metadata (increased from 30)
        // Claude Vision can take 20-40 seconds for analysis
        for (let i = 0; i < 120; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          if (bdaMetadata) {
            metadata = bdaMetadata;
            console.log('✅ Image analysis completed after', (i * 0.5).toFixed(1), 'seconds');
            console.log('📊 Metadata received:', metadata);
            break;
          }

          // Log progress every 5 seconds
          if (i > 0 && i % 10 === 0) {
            console.log(`⏳ Still analyzing... ${i * 0.5}s elapsed`);
          }
        }
        
        if (!metadata) {
          console.error('❌ Image analysis timed out after 60 seconds');
          throw new Error('Image analysis is taking longer than expected. Please try with a different image or use text search instead.');
        }
      }

      console.log('🚀 Starting agent invocation with metadata:', metadata);

      // Step 3: AUTONOMOUS MODE - Invoke agent with userIntent: "auto_match"
      // Format request for autonomous product matching
      const autonomousRequest = {
        userIntent: "auto_match",
        bdaMetadata: metadata,
        formattedMetadata: formatBDAMetadataForAgent(metadata)
      };

      const descriptionForPrompt = metadata.product_type ? 
        `${metadata.primary_color || ''} ${metadata.material || ''} ${metadata.product_type}`.trim() : 
        'the uploaded image';

      const agentPrompt = `${JSON.stringify(autonomousRequest, null, 2)}

CRITICAL INSTRUCTIONS - YOU MUST ALWAYS RETURN 3 PRODUCTS IN VALID JSON:

1. The user uploaded an image showing: ${descriptionForPrompt}
   - Product category from image: ${metadata.product_category || 'unknown'}
   - Product type from image: ${metadata.product_type || 'unknown'}${imageSpecifications ? `\n   - **USER'S ADDITIONAL SPECIFICATIONS**: "${imageSpecifications}"\n   - PRIORITIZE the user's specifications (e.g., if they say "but in black", find black versions)` : ''}
   - **ONLY return products that EXIST in the knowledge base**
   - DO NOT make up product names, DO NOT hallucinate products
   - VERIFY each product name exists before including it in results
   - **IMPORTANT**: Consider if the uploaded item is even related to fashion/shoes/bags/accessories
     * If user uploads food, animals, abstract objects → score should be 5-15% (completely unrelated)

2. Search the knowledge base (ALDO shoes, bags, accessories only)

3. **PRIORITY MATCHING RULES (CRITICAL)**:
   - IF user uploaded SHOES/BOOTS → Find ONLY shoes/boots (same category)
   - IF user uploaded BAGS → Find ONLY bags (same category)
   - IF user uploaded ACCESSORIES → Find ONLY accessories (same category)
   - IF user uploaded CLOTHING/DRESS → Find complementary shoes, bags, OR accessories

4. **SAME CATEGORY FIRST**: If the uploaded item is a shoe/bag/accessory from ALDO, prioritize finding the EXACT or SIMILAR items in that category
   - Example: Boots uploaded → Return boots/shoes ONLY
   - Example: Bag uploaded → Return bags ONLY
   - Example: Dress uploaded → Return complementary shoes, bags, or accessories

5. Match criteria:
   - Match by COLOR (e.g., brown boots → brown boots)
   - Match by STYLE (e.g., combat boots → similar combat boots)
   - Match by MATERIAL (e.g., leather → leather products)

6. **ALWAYS RETURN RESULTS**: Even if no perfect matches exist, return the 3 CLOSEST products:
   - If perfect match (meets ALL criteria) → high score (80-100)
   - If close match (meets MOST criteria, minor differences) → medium score (50-79)
   - If partial match (meets SOME criteria, e.g., right type but wrong color) → low score (25-49)
   - If poor match (barely relevant, e.g., completely wrong color/style) → very low score (10-24)
   - If completely unrelated (uploaded item has NO connection to catalog) → extremely low score (5-15)
   - NEVER return empty results array - always find the closest 3 products
   - Example: Upload green shoe but only brown shoes exist → brown shoes get 10-20% (wrong color)
   - Example: Upload food/random object but catalog only has shoes/bags → products get 5-10% (completely unrelated)
   - BE BRUTALLY HONEST with scores - if uploaded item has NO relation to product category, score should be 5-15%

7. Return EXACTLY in this JSON format (NO text before or after):

{
  "results": [
    {
      "productName": "Miyabell (Other Brown)",
      "score": 85,
      "reasoning": "This [bag/shoe/accessory] matches your uploaded ${metadata.product_type || 'item'} because [explain how it's similar or complementary]",
      "pros": ["Matches the color palette", "Same product category", "Similar style"],
      "cons": ["Slightly different shade", "Different specific style"]
    },
    {
      "productName": "Samuel (Dark Green)",
      "score": 75,
      "reasoning": "...",
      "pros": ["..."],
      "cons": ["..."]
    },
    {
      "productName": "Snakesa (Black Gold Multi)",
      "score": 65,
      "reasoning": "...",
      "pros": ["..."],
      "cons": ["..."]
    }
  ]
}

NOTICE: All productName values include (Color) - this is MANDATORY!

8. In the "reasoning" field:
   - ALWAYS reference what the user uploaded
   - If the match is poor/unrelated, be HONEST: "While the uploaded item is not related to our catalog, this is the closest available product..."
   - If the match is good, explain why this product matches the uploaded image

9. **CRITICAL - EXACT PRODUCT NAMES REQUIRED (MOST IMPORTANT RULE)**:
   - **EVERY productName MUST include (Color) in parentheses** - NO EXCEPTIONS
   - productName MUST be EXACTLY as it appears in the knowledge base - DO NOT shorten or modify
   - Example: "Samuel (Dark Green)" NOT "Samuel" or "Samuel Green" or "Samuel (Green)"
   - Example: "Blyth (Brown)" NOT "Blyth" or "Brown Blyth"
   - Example: "Snakesa (Black Gold Multi)" NOT "Snakesa (Multi)" or "Snakesa"
   - Example: "Miyabell (Other Brown)" NOT "Miyabell" or "Miyabell Brown"
   - Example: "Miyabell (Print)" NOT "Miyabell" or "Miyabell Print"
   - Use the COMPLETE color name in parentheses - if KB says "(Black Gold Multi)", use that EXACTLY
   - **IF YOU CANNOT FIND THE EXACT COLOR VARIANT, SEARCH THE KNOWLEDGE BASE AGAIN**
   - VERIFY the product WITH COLOR exists in the knowledge base before returning it
   - NEVER return product names without (Color) in parentheses
   - NEVER make up product names or abbreviate color variants

10. **YOU MUST return 3 products** - never return empty results array, never return invalid JSON
11. **RESPECT CATEGORY PRIORITY** - If they uploaded shoes, return ONLY shoes (not bags or accessories)`;

      const agentResponse = await invokeAgent(agentPrompt, sessionId);

      console.log('✅ Agent invoked successfully');
      console.log('📨 Agent Response (Image):', agentResponse.text);
      console.log('🔍 Response length:', agentResponse.text.length);
      console.log('📋 Response isComplete:', agentResponse.isComplete);

      // Step 4: Parse agent response as JSON - agent returns clean JSON
      let agentResults: AgentProductResult[] = [];
      try {
        console.log('🔄 Starting to parse agent response...');
        console.log('📋 Full image agent response:', agentResponse.text);
        
        // Try parsing directly - agent returns clean JSON
        const trimmed = agentResponse.text.trim();
        
        if (trimmed.startsWith('{')) {
          console.log('✅ Response starts with {, parsing as JSON');
          const parsed = JSON.parse(trimmed);
          console.log('📦 Parsed object:', parsed);
          
          if (parsed.results && Array.isArray(parsed.results)) {
            agentResults = parsed.results;
            console.log('✅ Image agent results array:', agentResults);
            console.log('🔍 First result structure:', agentResults[0]);
          } else {
            console.warn('⚠️ Parsed JSON but no results array found. Keys:', Object.keys(parsed));
          }
      } else {
          // Fallback: extract JSON between first { and last }
          const firstBrace = trimmed.indexOf('{');
          const lastBrace = trimmed.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            const jsonStr = trimmed.substring(firstBrace, lastBrace + 1);
            console.log('📄 Extracted JSON string');
            const parsed = JSON.parse(jsonStr);
            
            if (parsed.results && Array.isArray(parsed.results)) {
              agentResults = parsed.results;
              console.log('✅ Image agent results array:', agentResults);
            }
      } else {
            console.warn('⚠️ No JSON found in image agent response');
            console.log('📄 Full raw response:', agentResponse.text);
          }
        }
      } catch (parseError) {
        console.warn('❌ Could not parse image agent response as JSON:', parseError);
        console.log('📄 Raw response text:', agentResponse.text);
      }

      // Step 5: Map to SearchResult format and display
      let results: SearchResult[] = [];
      
      if (agentResults.length > 0) {
        // Try to map agent results
        results = agentResults
          .map((result, index) => {
            console.log(`Processing image result ${index}:`, result);
            
            const productName = result.productName || result.name || result.product_name || result.productId;
            
            if (!productName) {
              console.error(`Result ${index} has no product name`);
              return null;
            }

            const product = findBestProductMatch(productName);

            if (!product) {
              console.error(`❌ NO MATCH FOUND - Agent returned: "${productName}"`);
              return null;
            }

        return {
          product,
              matchScore: result.score || 0,
              reasoning: result.reasoning || '',
              pros: result.pros || [],
              cons: result.cons || []
            };
          })
          .filter((r): r is SearchResult => r !== null);
      }
      
      // FALLBACK: If agent returned no results or invalid products, show any 3 products with low scores
      if (results.length === 0) {
        console.warn('⚠️ No valid results from agent - using fallback products');
        const fallbackProducts = products.slice(0, 3);
        results = fallbackProducts.map(product => ({
          product,
          matchScore: 10,
          reasoning: `This is a fallback result. ${imageSpecifications ? `Your specifications: "${imageSpecifications}".` : ''} Please try refining your search or uploading a different image.`,
          pros: ['Available in our catalog'],
          cons: ['May not match your search criteria']
        }));
      }

      console.log('✅ Final results ready for navigation:', results.length, 'products');
      console.log('📦 Results:', results.map(r => r.product.name));

      // Navigate to results page with data
      console.log('🚀 Navigating to /ai-search-results...');
      navigate('/ai-search-results', {
        state: { 
          searchResults: results,
          query: 'Visual Search Results'
        } 
      });

      console.log('🎯 Navigation complete - results page should now display');
      setIsLoading(false);

    } catch (err) {
      console.error('❌ Error in autonomous image search:', err);
      console.error('Error type:', err instanceof Error ? err.constructor.name : typeof err);
      console.error('Error message:', err instanceof Error ? err.message : String(err));

      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Search failed: ${errorMsg}. Please try uploading a different image or use text search.`);
      setIsLoading(false);
      setStage('input'); // Go back to input page, not conversation
    }
  };

  const handleStartSearch = async () => {
    console.log('🔍 handleStartSearch called', { 
      hasImage: !!selectedImage, 
      textPrompt: textPrompt.trim(),
      sessionId 
    });

    if (!selectedImage && !textPrompt.trim()) {
      setError('Please upload an image or enter a description');
        return;
      }

    setIsLoading(true);
    setError(null);

    try {
      // Upload image to S3 if present and not already uploaded
      let s3Key: string | undefined = imageS3Key || undefined;
      if (selectedFile && !imageS3Key) {
        const uploadResult = await uploadImageToS3(selectedFile);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload image');
        }
        s3Key = uploadResult.s3Key;
        setImageS3Key(s3Key);
      }

      // AUTONOMOUS MODE: Request top 3 products directly
      const searchRequest = {
        userIntent: "auto_match",
        textQuery: textPrompt.trim(),
        ...(window.__bdaMetadata && { bdaMetadata: window.__bdaMetadata })
      };

      const agentPrompt = `${JSON.stringify(searchRequest, null, 2)}

CRITICAL INSTRUCTIONS - YOU MUST ALWAYS RETURN 3 PRODUCTS IN VALID JSON:

1. Search the knowledge base for products matching the user's query: "${textPrompt.trim()}"
   - **ONLY return products that EXIST in the knowledge base**
   - DO NOT make up product names, DO NOT hallucinate products
   - VERIFY each product name exists before including it in results
   - **IMPORTANT**: Consider if the search query is even related to fashion/shoes/bags/accessories
     * If user searches for food, animals, abstract concepts → score should be 5-15% (completely unrelated)

2. **ALWAYS RETURN RESULTS**: Even if no perfect matches exist, return the 3 CLOSEST products:
   - If perfect match (meets ALL criteria) → high score (80-100)
   - If close match (meets MOST criteria, minor differences) → medium score (50-79)
   - If partial match (meets SOME criteria, e.g., right type but wrong color) → low score (25-49)
   - If poor match (barely relevant, e.g., completely wrong color) → very low score (10-24)
   - If completely unrelated (search has NO connection to products) → extremely low score (5-15)
   - NEVER return empty results array - always find the closest 3 products
   - Example: Search "green shoe" but only brown shoes exist → brown shoes get 10-20% (wrong color)
   - Example: Search "shoes under $20" but cheapest is $50 → those shoes get 15-25% (wrong price range)
   - Example: Search "pancake" (food) when catalog only has shoes/bags → products get 5-10% (completely unrelated)
   - BE BRUTALLY HONEST with scores - if search has NO relation to product type, score should be 5-15%

3. Return EXACTLY top 3 products in this JSON format (NO text before or after):

{
  "results": [
    {
      "productName": "Miyabell (Other Brown)",
      "score": 85,
      "reasoning": "This matches your search for '${textPrompt.trim()}' because [explain specific connections - mention the product type, how it relates to their query]",
      "pros": ["Specific benefit 1", "Specific benefit 2", "Specific benefit 3"],
      "cons": ["Honest difference 1", "Honest difference 2"]
    },
    {
      "productName": "Samuel (Dark Green)",
      "score": 75,
      "reasoning": "...",
      "pros": ["..."],
      "cons": ["..."]
    },
    {
      "productName": "Snakesa (Black Gold Multi)",
      "score": 65,
      "reasoning": "...",
      "pros": ["..."],
      "cons": ["..."]
    }
  ]
}

NOTICE: All productName values include (Color) - this is MANDATORY!

4. **CRITICAL - EXACT PRODUCT NAMES REQUIRED (MOST IMPORTANT RULE)**:
   - **EVERY productName MUST include (Color) in parentheses** - NO EXCEPTIONS
   - productName MUST be EXACTLY as it appears in the knowledge base - DO NOT shorten or modify
   - Example: "Samuel (Dark Green)" NOT "Samuel" or "Samuel Green" or "Samuel (Green)"
   - Example: "Blyth (Brown)" NOT "Blyth" or "Brown Blyth"
   - Example: "Snakesa (Black Gold Multi)" NOT "Snakesa (Multi)" or "Snakesa"
   - Example: "Miyabell (Other Brown)" NOT "Miyabell" or "Miyabell Brown"
   - Example: "Miyabell (Print)" NOT "Miyabell" or "Miyabell Print"
   - Use the COMPLETE color name in parentheses - if KB says "(Black Gold Multi)", use that EXACTLY
   - **IF YOU CANNOT FIND THE EXACT COLOR VARIANT, SEARCH THE KNOWLEDGE BASE AGAIN**
   - VERIFY the product WITH COLOR exists in the knowledge base before returning it
   - NEVER return product names without (Color) in parentheses
   - NEVER make up product names or abbreviate color variants

5. In the "reasoning" field:
   - ALWAYS start by referencing what they searched for
   - If the match is poor/unrelated, be HONEST: "While '${textPrompt.trim()}' is not related to our catalog, this is the closest available product..."
   - If the match is good, explain why this product matches their search

6. Be specific about product attributes (color, material, style, type).
7. **YOU MUST return 3 products** - never return empty results array, never return invalid JSON`;

      // Invoke Bedrock agent
      const response = await invokeAgent(agentPrompt, sessionId);

      console.log('🤖 Agent Response:', response.text);

      // Parse JSON results - agent returns clean JSON
      let agentResults: AgentProductResult[] = [];
      try {
        console.log('📋 Full agent response text:', response.text);
        
        // Try parsing directly - agent returns clean JSON
        const trimmed = response.text.trim();
        
        if (trimmed.startsWith('{')) {
          console.log('✅ Response starts with {, parsing as JSON');
          const parsed = JSON.parse(trimmed);
          console.log('📦 Parsed object:', parsed);
          
          if (parsed.results && Array.isArray(parsed.results)) {
            agentResults = parsed.results;
            console.log('✅ Agent results array:', agentResults);
            console.log('🔍 First result structure:', agentResults[0]);
          } else {
            console.warn('⚠️ Parsed JSON but no results array found. Keys:', Object.keys(parsed));
          }
        } else {
          // Fallback: extract JSON between first { and last }
          const firstBrace = trimmed.indexOf('{');
          const lastBrace = trimmed.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            const jsonStr = trimmed.substring(firstBrace, lastBrace + 1);
            console.log('📄 Extracted JSON string');
            const parsed = JSON.parse(jsonStr);
            
            if (parsed.results && Array.isArray(parsed.results)) {
              agentResults = parsed.results;
              console.log('✅ Agent results array:', agentResults);
            }
      } else {
            console.warn('⚠️ No JSON found in agent response');
            console.log('📄 Full raw response:', response.text);
          }
        }
      } catch (parseError) {
        console.warn('❌ Could not parse agent response as JSON:', parseError);
        console.log('📄 Raw response text:', response.text);
      }

      // Map to SearchResult format
      if (agentResults.length > 0) {
        console.log('🔨 Mapping agent results to products...');
        const results: SearchResult[] = agentResults.map((result, index) => {
          console.log(`Processing result ${index}:`, result);
          console.log(`Available fields:`, Object.keys(result));
          
          // Handle different possible field names the agent might use
          const productName = result.productName || result.name || result.product_name || result.productId;
          
          if (!productName) {
            console.error('❌ No product name field found in result:', result);
            throw new Error(`Result ${index} has no product name. Available fields: ${Object.keys(result).join(', ')}`);
          }

          console.log(`🔍 Looking for product with name: "${productName}"`);
          
          const product = findBestProductMatch(productName);

          if (!product) {
            console.error(`❌ NO MATCH FOUND - Agent returned: "${productName}"`);
            throw new Error(`Product "${productName}" not found in catalog. Agent must return products with exact color variants like "Product (Color)".`);
          }

          console.log(`✅ MATCHED product:`, product.name);

        return {
          product,
            matchScore: result.score || 0,
            reasoning: result.reasoning || '',
            pros: result.pros || [],
            cons: result.cons || []
        };
      });

        console.log('✅ Successfully mapped all results');
        // Navigate to results page with data
        navigate('/ai-search-results', { 
          state: { 
            searchResults: results,
            query: textPrompt
          } 
        });
      } else {
        console.error('❌ NO RESULTS PARSED. Raw agent response was:', response.text);
        throw new Error(`Agent did not return valid JSON results. Agent said: "${response.text.substring(0, 200)}..."`);
      }

    } catch (err) {
      console.error('❌ Search error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStage('input');
    } finally {
      setIsLoading(false);
      console.log('✅ Search complete, isLoading set to false');
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return;

    const userMessage: AgentMessage = {
      role: 'user',
      content: userInput,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const response = await invokeAgent(userInput, sessionId);

      const agentMessage: AgentMessage = {
        role: 'agent',
        content: response.text,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, agentMessage]);

      // Note: Conversational flow not fully implemented - autonomous mode navigates directly
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    console.log('🔄 handleReset called');
    setStage('input');
    setSelectedImage(null);
    setSelectedFile(null);
    setImageS3Key(null);
    setTextPrompt('');
    setMessages([]);
    setUserInput('');
    setError(null);
    setIsLoading(false);
    setImageSpecifications('');
    setBdaMetadata(null);
    const newSessionId = generateSessionId();
    console.log('🆕 New session ID:', newSessionId);
    setSessionId(newSessionId);
    window.__bdaMetadata = undefined;
  };


  return (
    <main>
      {/* Hero Section with Beautiful Carousel */}
      {stage === 'input' && (
      <section style={{ padding: '0', margin: '0' }}>
        <div style={{
          maxWidth: '100%',
          margin: '0 auto',
          padding: '80px 80px 60px 80px',
          textAlign: 'center'
        }}>
            <h1 style={{
            fontSize: '60px',
              fontWeight: '500',
              fontFamily: 'Jost, sans-serif',
              letterSpacing: '0.05px',
            lineHeight: '64px',
              color: '#000',
            marginBottom: '20px'
            }}>
              Find Your <em style={{ fontStyle: 'italic' }}>Fit</em>
            </h1>

          {/* Interactive Search Bar with Carousel */}
          <div style={{
            maxWidth: '600px',
            margin: '0 auto 30px auto',
            padding: '18px 24px',
            border: `1px solid ${isFocused ? '#000' : '#ddd'}`,
            backgroundColor: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'border-color 0.2s ease'
          }}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#999"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span style={{
              fontFamily: 'Jost, sans-serif',
              fontSize: '16px',
              color: '#999',
              whiteSpace: 'nowrap'
            }}>
              Search for
            </span>
            <div style={{
              position: 'relative',
              flex: 1,
              minWidth: 0,
              height: '24px',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'relative',
            width: '100%',
                height: '100%'
              }}>
                {placeholders.map((placeholder, idx) => {
                  let position = idx - placeholderIndex;
                  if (position < 0) {
                    position += placeholders.length;
                  }

                  let opacity = 0;
                  if (position === 0) opacity = 1;
                  if (position === placeholders.length - 1) opacity = 0.3;

                  return (
                    <input
                      key={idx}
                      type="text"
                      value={textPrompt}
                      onChange={(e) => setTextPrompt(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder={placeholder}
                      disabled={idx !== placeholderIndex}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        fontFamily: 'Jost, sans-serif',
                        fontSize: '16px',
                        color: '#000',
                        fontWeight: '500',
                        backgroundColor: 'transparent',
                        pointerEvents: idx === placeholderIndex ? 'auto' : 'none',
                        transform: `translateY(${position * 100}%)`,
                        transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease',
                        opacity: opacity
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <style>{`
            input::placeholder {
              color: #000;
              opacity: 1;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
          `}</style>

          <p style={{
            fontSize: '18px',
            color: '#000',
            lineHeight: '26px',
            maxWidth: '700px',
            margin: '0 auto 30px',
            fontWeight: '400',
            fontFamily: 'Jost, sans-serif'
          }}>
            Upload an image and discover products that match your style. Our AI helps you find exactly what you're looking for.
          </p>

          {/* Search Button for Text-Only Search */}
          {textPrompt.trim() && !selectedImage && (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleStartSearch}
                disabled={isLoading}
                style={{
                  padding: '16px 60px',
                  backgroundColor: isLoading ? '#000' : '#000',
                  color: '#fff',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  fontFamily: 'Jost, sans-serif',
                  letterSpacing: '0.5px',
                  textTransform: 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  opacity: isLoading ? 0.8 : 1,
                  margin: '0 auto'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) e.currentTarget.style.backgroundColor = '#333';
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) e.currentTarget.style.backgroundColor = '#000';
                }}
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
          )}
        </div>
      </section>
      )}

      {/* Main Content */}
      {stage === 'input' && (
        <section style={{
          padding: '0',
          margin: '0',
          backgroundColor: '#fff'
        }}>
            <div style={{
            width: '100%',
            padding: '0 80px 80px 80px',
            margin: '0'
          }}>
            <div style={{
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              {/* Image Upload Section */}
              <div style={{
                border: '1px solid #000',
              padding: '80px 60px',
              backgroundColor: '#fff',
              cursor: 'pointer',
                transition: 'background-color 0.2s ease'
            }}
            onDragOver={(e) => {
              e.preventDefault();
                e.currentTarget.style.backgroundColor = '#fafafa';
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.style.backgroundColor = '#fff';
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.backgroundColor = '#fff';
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
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                    gap: '24px'
                }}>
                  <img
                    src={selectedImage}
                    alt="Uploaded preview"
                    style={{
                      width: '100%',
                        maxWidth: '400px',
                        height: 'auto'
                    }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(null);
                        setSelectedFile(null);
                      setError(null);
                    }}
                    style={{
                        padding: '14px 48px',
                      border: '1px solid #000',
                        backgroundColor: '#000',
                        color: '#fff',
                      fontFamily: 'Jost, sans-serif',
                        fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                        letterSpacing: '1px',
                      textTransform: 'uppercase',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.color = '#000';
                      }}
                      onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#000';
                      e.currentTarget.style.color = '#fff';
                    }}
                  >
                      Remove Image
                  </button>
                    {isLoading && (
                      <div style={{
                        fontFamily: 'Jost, sans-serif',
                        fontSize: '15px',
                        color: '#666'
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
                    gap: '24px'
                }}>
                  <svg
                    width="72"
                    height="72"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#000"
                      strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                    <div style={{ textAlign: 'center' }}>
                    <p style={{
                        fontSize: '20px',
                      fontWeight: '500',
                      color: '#000',
                        marginBottom: '10px',
                        fontFamily: 'Jost, sans-serif',
                        letterSpacing: '0.5px'
                    }}>
                        Drag and drop your image here
                    </p>
                    <p style={{
                        fontSize: '15px',
                        color: '#999',
                        fontFamily: 'Jost, sans-serif'
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
                  fontSize: '13px',
                color: '#ef4444',
                  marginTop: '16px',
                fontFamily: 'Jost, sans-serif',
                  textAlign: 'left'
              }}>
                {error}
              </p>
            )}

              <p style={{
                fontSize: '13px',
                color: '#999',
                marginTop: '16px',
                fontFamily: 'Jost, sans-serif',
                textAlign: 'left',
                letterSpacing: '0.3px'
              }}>
                Supported formats: JPG, PNG, GIF (max 5MB)
              </p>
          </div>

            {/* OR Divider */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '20px',
              maxWidth: '800px',
              margin: '40px auto'
            }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#000' }} />
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#000',
                fontFamily: 'Jost, sans-serif',
                letterSpacing: '0.5px'
              }}>
                OR
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#000' }} />
            </div>

            {/* Text Prompt Area */}
              <div style={{
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              <h3 style={{
                fontSize: '18px',
                marginBottom: '15px',
                color: '#000',
                fontFamily: 'Jost, sans-serif',
                fontWeight: '500',
                letterSpacing: '0.5px'
              }}>
                Describe What You're Looking For
              </h3>
              <textarea
                  value={textPrompt}
                  onChange={(e) => setTextPrompt(e.target.value)}
                placeholder="E.g., 'Black leather ankle boots with a block heel, suitable for office wear, under $150'"
                  style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '15px',
                    fontSize: '16px',
                  border: '1px solid #000',
                  resize: 'vertical',
                    fontFamily: 'Jost, sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#000'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#000'}
              />
            </div>

            {/* Start Search Button */}
            <div style={{
              maxWidth: '800px',
              margin: '30px auto 0'
            }}>
                <button
                  onClick={handleStartSearch}
                  disabled={isLoading || (!selectedImage && !textPrompt.trim())}
                  style={{
                  width: '100%',
                  padding: '18px',
                  fontSize: '14px',
                  fontWeight: '500',
                    color: '#fff',
                  backgroundColor: (isLoading || (!selectedImage && !textPrompt.trim())) ? '#999' : '#000',
                    border: 'none',
                    cursor: (isLoading || (!selectedImage && !textPrompt.trim())) ? 'not-allowed' : 'pointer',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  fontFamily: 'Jost, sans-serif',
                  transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && (selectedImage || textPrompt.trim())) {
                      e.currentTarget.style.backgroundColor = '#333';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading && (selectedImage || textPrompt.trim())) {
                      e.currentTarget.style.backgroundColor = '#000';
                    }
                  }}
              >
                {isLoading ? 'Searching...' : 'Start AI Search'}
                </button>
          </div>
        </div>
      </section>
      )}

      {/* Image Review Stage - Seamless page after upload */}
      {stage === 'image_review' && (
        <section style={{
          padding: '60px 80px',
          backgroundColor: '#fff',
          minHeight: '70vh'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <h2 style={{
              fontSize: '32px',
                  fontWeight: '500',
              marginBottom: '10px',
                  fontFamily: 'Jost, sans-serif',
                  color: '#000'
                }}>
              Review Your Image
            </h2>
                <p style={{
              fontSize: '16px',
                  color: '#666',
              marginBottom: '50px',
              fontFamily: 'Jost, sans-serif'
            }}>
              {!bdaMetadata ? 'Analyzing image...' : 'Add any specifications or details to refine your search'}
            </p>

            {/* Main Layout: Image + Input */}
                <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '60px',
              alignItems: 'start'
            }}>
              {/* Left: Image Preview */}
                  <div style={{
                border: '1px solid #E5E5E5',
                padding: '30px',
                backgroundColor: '#fafafa',
                    display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '400px'
              }}>
                {selectedImage && (
                    <img
                      src={selectedImage}
                    alt="Your uploaded image"
                      style={{
                      maxWidth: '100%',
                      maxHeight: '500px',
                        height: 'auto',
                      objectFit: 'contain'
                    }}
                  />
                )}
                  </div>

              {/* Right: Specifications Input */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '500',
                    marginBottom: '12px',
                    fontFamily: 'Jost, sans-serif',
                    color: '#000',
                    letterSpacing: '0.5px'
                  }}>
                    Add Specifications (Optional)
                  </h3>
                  <p style={{
                    fontSize: '15px',
                    color: '#666',
                    marginBottom: '20px',
                    fontFamily: 'Jost, sans-serif',
                    lineHeight: '1.6'
                  }}>
                    Describe any specific details, color preferences, or style modifications you'd like to see
                  </p>
              </div>

                    <textarea
                  value={imageSpecifications}
                  onChange={(e) => setImageSpecifications(e.target.value)}
                  placeholder='Examples:&#10;• "these, but in black"&#10;• "similar style with a higher heel"&#10;• "same look but more casual"&#10;• "without any embellishments"'
                      disabled={isLoading}
                  style={{
                    width: '100%',
                    minHeight: '180px',
                    padding: '18px',
                        fontSize: '15px',
                    border: '1px solid #D1D5DB',
                    fontFamily: 'Jost, sans-serif',
                        outline: 'none',
                        resize: 'vertical',
                    lineHeight: '1.6',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#000'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
                />

              <div style={{
                display: 'flex',
                  gap: '15px',
                  marginTop: '20px'
              }}>
                <button
                    onClick={() => {
                      setStage('input');
                      setSelectedImage(null);
                      setSelectedFile(null);
                      setImageSpecifications('');
                      setBdaMetadata(null);
                    }}
                    disabled={isLoading}
                  style={{
                      flex: '0 0 auto',
                      padding: '16px 32px',
                    fontSize: '14px',
                    fontWeight: '500',
                      color: '#000',
                      backgroundColor: '#fff',
                      border: '1px solid #000',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      letterSpacing: '1px',
                    textTransform: 'uppercase',
                    fontFamily: 'Jost, sans-serif',
                      transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                      if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#000';
                    e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={(e) => {
                      if (!isLoading) {
                    e.currentTarget.style.backgroundColor = '#fff';
                    e.currentTarget.style.color = '#000';
                    }
                  }}
                >
                    Back
                </button>

                <button
                    onClick={handleImageSearch}
                  disabled={isLoading}
                  style={{
                  flex: 1,
                      padding: '16px',
                      fontSize: '14px',
                      fontWeight: '500',
                    color: '#fff',
                      backgroundColor: isLoading ? '#000' : '#000',
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                      letterSpacing: '1px',
                      textTransform: 'none',
                    fontFamily: 'Jost, sans-serif',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      opacity: isLoading ? 0.8 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) e.currentTarget.style.backgroundColor = '#333';
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) e.currentTarget.style.backgroundColor = '#000';
                  }}
                >
                    {isLoading ? 'Searching...' : 'Find Products'}
                </button>
              </div>

                {error && (
              <p style={{
                fontSize: '14px',
                    color: '#ef4444',
                    fontFamily: 'Jost, sans-serif',
                    marginTop: '10px'
                  }}>
                    {error}
                  </p>
                )}
            </div>
          </div>
          </div>
        </section>
      )}

      {/* Conversation Stage */}
      {stage === 'conversation' && (
        <section style={{
          padding: '40px 20px',
          backgroundColor: '#f8fafc',
          minHeight: '70vh'
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            {/* Header with Reset Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px'
            }}>
              <h2 style={{ fontSize: '28px', margin: 0 }}>AI Conversation</h2>
                <button
                onClick={handleReset}
                  style={{
                  padding: '10px 20px',
                    fontSize: '14px',
                  color: '#6366F1',
                  background: '#fff',
                  border: '2px solid #6366F1',
                  borderRadius: '8px',
                    cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                New Search
                </button>
              </div>

            {/* Image Preview (if uploaded) */}
                {selectedImage && (
              <div style={{
                marginBottom: '20px',
                padding: '15px',
                      backgroundColor: '#fff',
                borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                gap: '15px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <img
                      src={selectedImage}
                  alt="Your upload"
                        style={{
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '8px'
                  }}
                />
                <div>
                  <p style={{ fontSize: '14px', color: '#6B7280', margin: 0 }}>Your Image</p>
                  <p style={{ fontSize: '12px', color: '#9CA3AF', margin: '4px 0 0 0' }}>
                    AI is analyzing this image
                </p>
                      </div>
            </div>
            )}

                {/* Chat Messages */}
                      <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              minHeight: '400px',
              maxHeight: '500px',
                  overflowY: 'auto',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
              {messages.map((msg, idx) => (
                    <div
                      key={idx}
                              style={{
                        marginBottom: '20px',
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div
                        style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                          borderRadius: '12px',
                      backgroundColor: msg.role === 'user' ? '#6366F1' : '#F3F4F6',
                      color: msg.role === 'user' ? '#fff' : '#1F2937'
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.5' }}>
                          {msg.content}
                        </p>
                        <p style={{
                          margin: '8px 0 0 0',
                          fontSize: '11px',
                      opacity: 0.7
                        }}>
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                    </div>
                  </div>
                ))}
                  {isLoading && (
              <div style={{
                      display: 'flex',
                      justifyContent: 'flex-start',
                      marginBottom: '20px'
                    }}>
                      <div style={{
                    padding: '12px 16px',
                        borderRadius: '12px',
                    backgroundColor: '#F3F4F6',
                    color: '#6B7280'
                  }}>
                    <span>AI is thinking</span>
                    <span className="typing-dots">...</span>
                      </div>
              </div>
            )}
              <div ref={messagesEndRef} />
                </div>

            {/* Input Box */}
              <div style={{
                display: 'flex',
              gap: '10px'
            }}>
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                placeholder="Type your message..."
                      disabled={isLoading}
                  style={{
                    flex: 1,
                  padding: '14px 16px',
                  fontSize: '16px',
                  borderRadius: '12px',
                  border: '2px solid #D1D5DB',
                    outline: 'none',
                  fontFamily: 'inherit'
                  }}
                />
                <button
                      onClick={handleSendMessage}
                disabled={isLoading || !userInput.trim()}
                  style={{
                  padding: '14px 30px',
                        fontSize: '16px',
                          fontWeight: '600',
                    color: '#fff',
                  background: (isLoading || !userInput.trim())
                    ? '#9CA3AF'
                    : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                    border: 'none',
                  borderRadius: '12px',
                  cursor: (isLoading || !userInput.trim()) ? 'not-allowed' : 'pointer'
                }}
              >
                Send
                </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('Starting image to OpenSearch conversion...');

const imagesDir = path.join(__dirname, 'images');
const outputDir = path.join(__dirname, 'imagesopensearch');
const supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('Created output directory:', outputDir);
}

// Check if images directory exists
if (!fs.existsSync(imagesDir)) {
    console.error('Images directory not found:', imagesDir);
    process.exit(1);
}

// Get image files
const allFiles = fs.readdirSync(imagesDir);
const imageFiles = allFiles.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return supportedFormats.includes(ext);
});

console.log(`Found ${imageFiles.length} image files out of ${allFiles.length} total files`);

if (imageFiles.length === 0) {
    console.log('No supported image files found');
    process.exit(0);
}

// Helper functions
function getImageHash(imagePath) {
    try {
        const fileBuffer = fs.readFileSync(imagePath);
        return crypto.createHash('md5').update(fileBuffer).digest('hex');
    } catch (error) {
        console.error(`Error generating hash for ${imagePath}:`, error.message);
        return null;
    }
}

function extractProductName(filename) {
    const nameWithoutExt = path.parse(filename).name;
    return nameWithoutExt.replace(/_\d+$/, '');
}

function getImageNumber(filename) {
    const nameWithoutExt = path.parse(filename).name;
    const match = nameWithoutExt.match(/_(\d+)$/);
    return match ? parseInt(match[1]) : 1;
}

// Process images
const documents = [];
let processed = 0;

console.log('Processing images...');

for (const filename of imageFiles) {
    const imagePath = path.join(imagesDir, filename);
    
    try {
        const stats = fs.statSync(imagePath);
        const imageHash = getImageHash(imagePath);
        
        if (!imageHash) {
            continue;
        }

        const productName = extractProductName(filename);
        const imageNumber = getImageNumber(filename);
        const relativePath = path.relative(path.dirname(imagesDir), imagePath);

        const document = {
            image_path: relativePath.replace(/\\/g, '/'),
            image_name: filename,
            image_hash: imageHash,
            product_name: productName,
            image_number: imageNumber,
            vector: null, // Placeholder for ML-generated vector
            metadata: {
                file_size: stats.size,
                file_extension: path.extname(filename).toLowerCase(),
                created_at: stats.birthtime.toISOString(),
                modified_at: stats.mtime.toISOString(),
                processed_at: new Date().toISOString()
            }
        };

        documents.push(document);
        processed++;
        
        if (processed % 20 === 0) {
            console.log(`Processed ${processed}/${imageFiles.length} images...`);
        }
    } catch (error) {
        console.error(`Error processing ${filename}:`, error.message);
    }
}

console.log(`Successfully processed ${processed} out of ${imageFiles.length} images`);

if (documents.length === 0) {
    console.log('No documents created');
    process.exit(1);
}

// Create index mapping
const indexMapping = {
    mappings: {
        properties: {
            image_path: { type: "keyword" },
            image_name: { type: "text" },
            image_hash: { type: "keyword" },
            product_name: { type: "text" },
            image_number: { type: "integer" },
            vector: {
                type: "knn_vector",
                dimension: 512,
                method: {
                    name: "hnsw",
                    space_type: "cosinesimil",
                    engine: "lucene"
                }
            },
            metadata: {
                properties: {
                    file_size: { type: "long" },
                    file_extension: { type: "keyword" },
                    created_at: { type: "date" },
                    modified_at: { type: "date" },
                    processed_at: { type: "date" }
                }
            }
        }
    },
    settings: {
        index: {
            knn: true,
            "knn.algo_param.ef_search": 100
        }
    }
};

// Save files
console.log('Saving files...');

// 1. Save index mapping
const mappingFile = path.join(outputDir, 'index_mapping.json');
fs.writeFileSync(mappingFile, JSON.stringify(indexMapping, null, 2));
console.log(`✓ Saved index mapping: ${mappingFile}`);

// 2. Save bulk index file
const bulkFile = path.join(outputDir, 'bulk_index.ndjson');
const bulkData = [];

documents.forEach(doc => {
    bulkData.push(JSON.stringify({
        index: {
            _index: "image_vectors",
            _id: doc.image_hash
        }
    }));
    bulkData.push(JSON.stringify(doc));
});

fs.writeFileSync(bulkFile, bulkData.join('\n') + '\n');
console.log(`✓ Saved bulk index file: ${bulkFile}`);

// 3. Save individual document files
documents.forEach(doc => {
    const filename = `${doc.product_name}_${doc.image_number}.json`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(doc, null, 2));
});
console.log(`✓ Saved ${documents.length} individual document files`);

// 4. Group and save by product
const grouped = {};
documents.forEach(doc => {
    if (!grouped[doc.product_name]) {
        grouped[doc.product_name] = [];
    }
    grouped[doc.product_name].push(doc);
});

Object.entries(grouped).forEach(([productName, productDocs]) => {
    const filename = `product_${productName}.json`;
    const filepath = path.join(outputDir, filename);
    
    const productData = {
        product_name: productName,
        image_count: productDocs.length,
        images: productDocs,
        created_at: new Date().toISOString()
    };
    
    fs.writeFileSync(filepath, JSON.stringify(productData, null, 2));
});

console.log(`✓ Saved ${Object.keys(grouped).length} product files`);

// 5. Save summary
const summary = {
    total_images_found: imageFiles.length,
    total_images_processed: processed,
    total_products: Object.keys(grouped).length,
    index_name: "image_vectors",
    output_directory: outputDir,
    processed_at: new Date().toISOString(),
    files_created: {
        bulk_index: 'bulk_index.ndjson',
        index_mapping: 'index_mapping.json',
        individual_files: `${documents.length} JSON files`,
        product_files: `${Object.keys(grouped).length} product files`
    }
};

const summaryFile = path.join(outputDir, 'conversion_summary.json');
fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
console.log(`✓ Saved conversion summary: ${summaryFile}`);

console.log('\n🎉 Image conversion completed successfully!');
console.log(`📁 Files saved to: ${outputDir}`);
console.log(`🔍 Ready for OpenSearch indexing with ${documents.length} documents`);
console.log(`📊 Products found: ${Object.keys(grouped).length}`);
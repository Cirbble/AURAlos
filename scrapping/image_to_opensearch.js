#!/usr/bin/env node

// This is the original version - use image_to_opensearch_fixed.js for the working version
console.log('Please use image_to_opensearch_fixed.js instead - this version has execution issues');
process.exit(1);
/bin/env node

/**
 * Image to OpenSearch Index File Converter
 * 
 * This script processes images from the /scrapping/images folder and creates
 * OpenSearch index files in the /scrapping/imagesopensearch folder.
 * 
 * Each image gets converted to a JSON document with metadata and placeholder
 * for vector embeddings that can be populated later.
 * 
 * Usage: node image_to_opensearch.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ImageToOpenSearchConverter {
    constructor(imagesDir = 'images', outputDir = 'imagesopensearch') {
        this.imagesDir = path.resolve(__dirname, imagesDir);
        this.outputDir = path.resolve(__dirname, outputDir);
        this.supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
        this.indexName = 'image_vectors';
        
        // Ensure output directory exists
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * Generate MD5 hash for image file
     */
    getImageHash(imagePath) {
        try {
            const fileBuffer = fs.readFileSync(imagePath);
            return crypto.createHash('md5').update(fileBuffer).digest('hex');
        } catch (error) {
            console.error(`Error generating hash for ${imagePath}:`, error.message);
            return null;
        }
    }

    /**
     * Get all supported image files from the images directory
     */
    getImageFiles() {
        try {
            const files = fs.readdirSync(this.imagesDir);
            const imageFiles = files.filter(file => {
                const ext = path.extname(file).toLowerCase();
                return this.supportedFormats.includes(ext);
            });
            
            console.log(`Found ${imageFiles.length} image files`);
            return imageFiles;
        } catch (error) {
            console.error('Error reading images directory:', error.message);
            return [];
        }
    }

    /**
     * Extract product name from image filename
     * Assumes format: productname_number.extension
     */
    extractProductName(filename) {
        const nameWithoutExt = path.parse(filename).name;
        // Remove the _number suffix (e.g., _1, _2, etc.)
        return nameWithoutExt.replace(/_\d+$/, '');
    }

    /**
     * Get image number from filename
     */
    getImageNumber(filename) {
        const nameWithoutExt = path.parse(filename).name;
        const match = nameWithoutExt.match(/_(\d+)$/);
        return match ? parseInt(match[1]) : 1;
    }

    /**
     * Process a single image and create OpenSearch document
     */
    processImage(filename) {
        const imagePath = path.join(this.imagesDir, filename);
        
        try {
            const stats = fs.statSync(imagePath);
            const imageHash = this.getImageHash(imagePath);
            
            if (!imageHash) {
                return null;
            }

            const productName = this.extractProductName(filename);
            const imageNumber = this.getImageNumber(filename);
            const relativePath = path.relative(path.dirname(this.imagesDir), imagePath);

            // Create OpenSearch document structure
            const document = {
                image_path: relativePath.replace(/\\/g, '/'), // Normalize path separators
                image_name: filename,
                image_hash: imageHash,
                product_name: productName,
                image_number: imageNumber,
                // Placeholder for vector - would be populated by ML model
                vector: null,
                metadata: {
                    file_size: stats.size,
                    file_extension: path.extname(filename).toLowerCase(),
                    created_at: stats.birthtime.toISOString(),
                    modified_at: stats.mtime.toISOString(),
                    processed_at: new Date().toISOString()
                }
            };

            return document;
        } catch (error) {
            console.error(`Error processing ${filename}:`, error.message);
            return null;
        }
    }

    /**
     * Create OpenSearch mapping configuration
     */
    createIndexMapping() {
        return {
            mappings: {
                properties: {
                    image_path: { type: "keyword" },
                    image_name: { type: "text" },
                    image_hash: { type: "keyword" },
                    product_name: { type: "text" },
                    image_number: { type: "integer" },
                    vector: {
                        type: "knn_vector",
                        dimension: 512, // Standard CLIP dimension
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
    }

    /**
     * Save documents in bulk format for OpenSearch
     */
    saveBulkIndexFile(documents) {
        const bulkFile = path.join(this.outputDir, 'bulk_index.ndjson');
        const bulkData = [];

        documents.forEach(doc => {
            // Add index action
            bulkData.push(JSON.stringify({
                index: {
                    _index: this.indexName,
                    _id: doc.image_hash
                }
            }));
            // Add document
            bulkData.push(JSON.stringify(doc));
        });

        fs.writeFileSync(bulkFile, bulkData.join('\n') + '\n');
        console.log(`Saved bulk index file: ${bulkFile}`);
    }

    /**
     * Save individual document files
     */
    saveIndividualFiles(documents) {
        documents.forEach(doc => {
            const filename = `${doc.product_name}_${doc.image_number}.json`;
            const filepath = path.join(this.outputDir, filename);
            
            fs.writeFileSync(filepath, JSON.stringify(doc, null, 2));
        });
        
        console.log(`Saved ${documents.length} individual document files`);
    }

    /**
     * Group documents by product name
     */
    groupByProduct(documents) {
        const grouped = {};
        
        documents.forEach(doc => {
            if (!grouped[doc.product_name]) {
                grouped[doc.product_name] = [];
            }
            grouped[doc.product_name].push(doc);
        });

        return grouped;
    }

    /**
     * Save product-grouped files
     */
    saveProductFiles(documents) {
        const grouped = this.groupByProduct(documents);
        
        Object.entries(grouped).forEach(([productName, productDocs]) => {
            const filename = `product_${productName}.json`;
            const filepath = path.join(this.outputDir, filename);
            
            const productData = {
                product_name: productName,
                image_count: productDocs.length,
                images: productDocs,
                created_at: new Date().toISOString()
            };
            
            fs.writeFileSync(filepath, JSON.stringify(productData, null, 2));
        });
        
        console.log(`Saved ${Object.keys(grouped).length} product files`);
    }

    /**
     * Main conversion process
     */
    async convertImages() {
        console.log('Starting image to OpenSearch index conversion...');
        console.log(`Images directory: ${this.imagesDir}`);
        console.log(`Output directory: ${this.outputDir}`);
        
        // Check if directories exist
        if (!fs.existsSync(this.imagesDir)) {
            console.error(`Images directory does not exist: ${this.imagesDir}`);
            return false;
        }

        // Get all image files
        const imageFiles = this.getImageFiles();
        
        if (imageFiles.length === 0) {
            console.log('No image files found to process');
            return false;
        }

        // Process all images
        const documents = [];
        let processed = 0;

        for (const filename of imageFiles) {
            const doc = this.processImage(filename);
            if (doc) {
                documents.push(doc);
                processed++;
                
                if (processed % 10 === 0) {
                    console.log(`Processed ${processed}/${imageFiles.length} images...`);
                }
            }
        }

        console.log(`Successfully processed ${processed} out of ${imageFiles.length} images`);

        if (documents.length === 0) {
            console.log('No documents created');
            return false;
        }

        // Save index mapping
        const mappingFile = path.join(this.outputDir, 'index_mapping.json');
        fs.writeFileSync(mappingFile, JSON.stringify(this.createIndexMapping(), null, 2));
        console.log(`Saved index mapping: ${mappingFile}`);

        // Save in different formats
        this.saveBulkIndexFile(documents);
        this.saveIndividualFiles(documents);
        this.saveProductFiles(documents);

        // Save summary
        const summary = {
            total_images_found: imageFiles.length,
            total_images_processed: processed,
            total_products: new Set(documents.map(d => d.product_name)).size,
            index_name: this.indexName,
            output_directory: this.outputDir,
            processed_at: new Date().toISOString(),
            files_created: {
                bulk_index: 'bulk_index.ndjson',
                index_mapping: 'index_mapping.json',
                individual_files: `${documents.length} JSON files`,
                product_files: `${new Set(documents.map(d => d.product_name)).size} product files`
            }
        };

        const summaryFile = path.join(this.outputDir, 'conversion_summary.json');
        fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
        console.log(`Saved conversion summary: ${summaryFile}`);

        return true;
    }
}

// Main execution
async function main() {
    console.log('Script started...');
    try {
        console.log('Creating converter...');
        const converter = new ImageToOpenSearchConverter();
        console.log('Starting conversion...');
        const success = await converter.convertImages();
        
        if (success) {
            console.log('\n✅ Image conversion completed successfully!');
            console.log('📁 Files saved to: scrapping/imagesopensearch/');
            console.log('🔍 Ready for OpenSearch indexing');
        } else {
            console.log('\n❌ Image conversion failed');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Conversion failed:', error.message);
        process.exit(1);
    }
}

// Run main function
main();

module.exports = ImageToOpenSearchConverter;
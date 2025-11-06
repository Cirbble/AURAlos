#!/usr/bin/env python3
"""
Image to OpenSearch Vector Database Converter

This script processes JPG images from the /scrapping/images folder,
converts them to vector embeddings using a pre-trained model,
and stores them in an OpenSearch vector database.

Requirements:
- opensearch-py
- torch
- torchvision
- transformers
- Pillow
- numpy

Usage:
    python image_to_opensearch.py
"""

import os
import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np
from PIL import Image
import torch
from transformers import CLIPProcessor, CLIPModel
from opensearchpy import OpenSearch, RequestsHttpConnection
from opensearchpy.helpers import bulk
import hashlib
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ImageVectorizer:
    """Handles image processing and vector generation using CLIP model."""
    
    def __init__(self, model_name: str = "openai/clip-vit-base-patch32"):
        """Initialize the vectorizer with CLIP model."""
        logger.info(f"Loading CLIP model: {model_name}")
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = CLIPModel.from_pretrained(model_name).to(self.device)
        self.processor = CLIPProcessor.from_pretrained(model_name)
        logger.info(f"Model loaded on device: {self.device}")
    
    def process_image(self, image_path: str) -> Optional[np.ndarray]:
        """
        Process a single image and return its vector embedding.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Vector embedding as numpy array or None if processing fails
        """
        try:
            # Load and process image
            image = Image.open(image_path).convert('RGB')
            inputs = self.processor(images=image, return_tensors="pt").to(self.device)
            
            # Generate embeddings
            with torch.no_grad():
                image_features = self.model.get_image_features(**inputs)
                # Normalize the features
                image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            
            return image_features.cpu().numpy().flatten()
            
        except Exception as e:
            logger.error(f"Error processing image {image_path}: {str(e)}")
            return None

class OpenSearchManager:
    """Manages OpenSearch connection and operations."""
    
    def __init__(self, host: str = "localhost", port: int = 9200, 
                 username: str = "admin", password: str = "admin"):
        """Initialize OpenSearch connection."""
        self.client = OpenSearch(
            hosts=[{'host': host, 'port': port}],
            http_auth=(username, password),
            use_ssl=False,
            verify_certs=False,
            connection_class=RequestsHttpConnection
        )
        
        # Test connection
        try:
            info = self.client.info()
            logger.info(f"Connected to OpenSearch: {info['version']['number']}")
        except Exception as e:
            logger.error(f"Failed to connect to OpenSearch: {str(e)}")
            raise
    
    def create_index(self, index_name: str, vector_dimension: int = 512):
        """Create an index with vector field mapping."""
        mapping = {
            "mappings": {
                "properties": {
                    "image_path": {"type": "keyword"},
                    "image_name": {"type": "text"},
                    "image_hash": {"type": "keyword"},
                    "vector": {
                        "type": "knn_vector",
                        "dimension": vector_dimension,
                        "method": {
                            "name": "hnsw",
                            "space_type": "cosinesimil",
                            "engine": "lucene"
                        }
                    },
                    "metadata": {
                        "properties": {
                            "file_size": {"type": "long"},
                            "created_at": {"type": "date"},
                            "processed_at": {"type": "date"}
                        }
                    }
                }
            },
            "settings": {
                "index": {
                    "knn": True,
                    "knn.algo_param.ef_search": 100
                }
            }
        }
        
        try:
            if self.client.indices.exists(index=index_name):
                logger.info(f"Index {index_name} already exists")
                return True
            
            response = self.client.indices.create(index=index_name, body=mapping)
            logger.info(f"Created index {index_name}: {response}")
            return True
            
        except Exception as e:
            logger.error(f"Error creating index {index_name}: {str(e)}")
            return False
    
    def index_document(self, index_name: str, doc_id: str, document: Dict[str, Any]):
        """Index a single document."""
        try:
            response = self.client.index(
                index=index_name,
                id=doc_id,
                body=document
            )
            return response
        except Exception as e:
            logger.error(f"Error indexing document {doc_id}: {str(e)}")
            return None
    
    def bulk_index(self, index_name: str, documents: List[Dict[str, Any]]):
        """Bulk index multiple documents."""
        try:
            actions = []
            for doc in documents:
                action = {
                    "_index": index_name,
                    "_id": doc["image_hash"],
                    "_source": doc
                }
                actions.append(action)
            
            response = bulk(self.client, actions)
            logger.info(f"Bulk indexed {len(documents)} documents")
            return response
            
        except Exception as e:
            logger.error(f"Error in bulk indexing: {str(e)}")
            return None

class ImageToOpenSearchConverter:
    """Main converter class that orchestrates the conversion process."""
    
    def __init__(self, images_dir: str, output_dir: str, 
                 opensearch_host: str = "localhost", opensearch_port: int = 9200):
        """Initialize the converter."""
        self.images_dir = Path(images_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Initialize components
        self.vectorizer = ImageVectorizer()
        self.opensearch = OpenSearchManager(opensearch_host, opensearch_port)
        
        # Configuration
        self.index_name = "image_vectors"
        self.batch_size = 10
        self.supported_formats = {'.jpg', '.jpeg', '.png', '.gif'}
    
    def get_image_hash(self, image_path: str) -> str:
        """Generate a hash for the image file."""
        with open(image_path, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    
    def get_image_files(self) -> List[Path]:
        """Get all supported image files from the images directory."""
        image_files = []
        for file_path in self.images_dir.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in self.supported_formats:
                image_files.append(file_path)
        
        logger.info(f"Found {len(image_files)} image files")
        return image_files
    
    def process_image_batch(self, image_files: List[Path]) -> List[Dict[str, Any]]:
        """Process a batch of images and return documents for indexing."""
        documents = []
        
        for image_path in image_files:
            try:
                # Generate vector embedding
                vector = self.vectorizer.process_image(str(image_path))
                if vector is None:
                    continue
                
                # Get file metadata
                stat = image_path.stat()
                image_hash = self.get_image_hash(str(image_path))
                
                # Create document
                document = {
                    "image_path": str(image_path.relative_to(self.images_dir.parent)),
                    "image_name": image_path.name,
                    "image_hash": image_hash,
                    "vector": vector.tolist(),
                    "metadata": {
                        "file_size": stat.st_size,
                        "created_at": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                        "processed_at": datetime.now().isoformat()
                    }
                }
                
                documents.append(document)
                
                # Save vector to file as well
                vector_file = self.output_dir / f"{image_path.stem}_vector.json"
                with open(vector_file, 'w') as f:
                    json.dump({
                        "image_name": image_path.name,
                        "vector": vector.tolist(),
                        "metadata": document["metadata"]
                    }, f, indent=2)
                
                logger.info(f"Processed: {image_path.name}")
                
            except Exception as e:
                logger.error(f"Error processing {image_path}: {str(e)}")
                continue
        
        return documents
    
    def convert_images(self):
        """Main conversion process."""
        logger.info("Starting image to vector conversion process")
        
        # Create OpenSearch index
        vector_dim = 512  # CLIP model output dimension
        if not self.opensearch.create_index(self.index_name, vector_dim):
            logger.error("Failed to create OpenSearch index")
            return False
        
        # Get all image files
        image_files = self.get_image_files()
        if not image_files:
            logger.warning("No image files found")
            return False
        
        # Process images in batches
        total_processed = 0
        for i in range(0, len(image_files), self.batch_size):
            batch = image_files[i:i + self.batch_size]
            logger.info(f"Processing batch {i//self.batch_size + 1}/{(len(image_files)-1)//self.batch_size + 1}")
            
            documents = self.process_image_batch(batch)
            
            if documents:
                # Index to OpenSearch
                self.opensearch.bulk_index(self.index_name, documents)
                total_processed += len(documents)
        
        logger.info(f"Conversion complete! Processed {total_processed} images")
        
        # Save summary
        summary = {
            "total_images_found": len(image_files),
            "total_images_processed": total_processed,
            "index_name": self.index_name,
            "output_directory": str(self.output_dir),
            "processed_at": datetime.now().isoformat()
        }
        
        summary_file = self.output_dir / "conversion_summary.json"
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
        
        return True

def main():
    """Main function to run the conversion."""
    # Configuration
    images_dir = "images"
    output_dir = "imagesopensearch"
    
    # OpenSearch configuration (modify as needed)
    opensearch_host = "localhost"
    opensearch_port = 9200
    
    try:
        converter = ImageToOpenSearchConverter(
            images_dir=images_dir,
            output_dir=output_dir,
            opensearch_host=opensearch_host,
            opensearch_port=opensearch_port
        )
        
        success = converter.convert_images()
        
        if success:
            print("✅ Image conversion to OpenSearch completed successfully!")
            print(f"📁 Vector files saved to: {output_dir}")
            print(f"🔍 OpenSearch index: {converter.index_name}")
        else:
            print("❌ Image conversion failed. Check logs for details.")
            
    except Exception as e:
        logger.error(f"Conversion failed: {str(e)}")
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    main()
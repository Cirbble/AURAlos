# Image to OpenSearch Vector Conversion

This script converts JPG images from the `/scrapping/images` folder into vector embeddings and stores them in an OpenSearch vector database.

## Features

- 🖼️ Processes JPG, PNG, and GIF images
- 🧠 Uses CLIP model for high-quality image embeddings
- 🔍 Stores vectors in OpenSearch for similarity search
- 📁 Saves vector files locally as backup
- 📊 Batch processing for efficiency
- 📝 Comprehensive logging and error handling

## Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the setup script:**
   ```bash
   python setup_and_run.py
   ```

3. **Or run directly:**
   ```bash
   python image_to_opensearch.py
   ```

## Prerequisites

### OpenSearch Setup
- OpenSearch running on `localhost:9200`
- Default credentials: `admin/admin`
- KNN plugin enabled for vector search

### Python Dependencies
- `opensearch-py` - OpenSearch client
- `torch` - PyTorch for model inference
- `transformers` - Hugging Face transformers (CLIP model)
- `Pillow` - Image processing
- `numpy` - Numerical operations

## Configuration

Edit `config.json` to customize:

```json
{
  "opensearch": {
    "host": "localhost",
    "port": 9200,
    "username": "admin",
    "password": "admin"
  },
  "processing": {
    "batch_size": 10,
    "model_name": "openai/clip-vit-base-patch32"
  }
}
```

## Output

### OpenSearch Index
- **Index name:** `image_vectors`
- **Vector dimension:** 512 (CLIP model output)
- **Search method:** HNSW with cosine similarity

### Local Files
- Vector files saved to `/scrapping/imagesopensearch/`
- Each image gets a corresponding `*_vector.json` file
- Conversion summary in `conversion_summary.json`

## Usage Examples

### Search Similar Images (Python)
```python
from opensearchpy import OpenSearch

client = OpenSearch([{'host': 'localhost', 'port': 9200}])

# Search for similar images using vector similarity
query = {
    "size": 5,
    "query": {
        "knn": {
            "vector": {
                "vector": target_vector,  # Your query vector
                "k": 5
            }
        }
    }
}

results = client.search(index="image_vectors", body=query)
```

### Load Vector from File
```python
import json

with open('imagesopensearch/amur_1_vector.json', 'r') as f:
    data = json.load(f)
    vector = data['vector']
    metadata = data['metadata']
```

## Troubleshooting

### OpenSearch Connection Issues
- Ensure OpenSearch is running: `curl http://localhost:9200`
- Check credentials in config.json
- Verify KNN plugin is installed

### Memory Issues
- Reduce `batch_size` in config.json
- Use CPU instead of GPU if CUDA memory is limited

### Model Download Issues
- First run downloads CLIP model (~600MB)
- Ensure stable internet connection
- Model cached in `~/.cache/huggingface/`

## File Structure

```
scrapping/
├── images/                     # Source images
├── imagesopensearch/          # Output vector files
├── image_to_opensearch.py     # Main conversion script
├── setup_and_run.py          # Setup helper
├── requirements.txt          # Python dependencies
├── config.json              # Configuration
└── README_image_conversion.md # This file
```

## Performance Notes

- **Processing time:** ~1-2 seconds per image
- **Vector size:** 512 dimensions per image
- **Storage:** ~2KB per vector file
- **Memory usage:** ~2GB for CLIP model

## Next Steps

After conversion, you can:
1. Build image similarity search applications
2. Create image recommendation systems
3. Implement reverse image search
4. Cluster similar images
5. Build visual search interfaces
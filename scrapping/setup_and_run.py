#!/usr/bin/env python3
"""
Setup and Run Script for Image to OpenSearch Conversion

This script helps set up the environment and run the image conversion process.
"""

import subprocess
import sys
import os
from pathlib import Path

def install_requirements():
    """Install required Python packages."""
    print("📦 Installing required packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install requirements: {e}")
        return False

def check_opensearch_connection():
    """Check if OpenSearch is running and accessible."""
    try:
        from opensearchpy import OpenSearch
        client = OpenSearch(
            hosts=[{'host': 'localhost', 'port': 9200}],
            http_auth=('admin', 'admin'),
            use_ssl=False,
            verify_certs=False
        )
        info = client.info()
        print(f"✅ OpenSearch is running: {info['version']['number']}")
        return True
    except Exception as e:
        print(f"❌ OpenSearch connection failed: {e}")
        print("💡 Make sure OpenSearch is running on localhost:9200")
        print("💡 Default credentials: admin/admin")
        return False

def main():
    """Main setup and run function."""
    print("🚀 Image to OpenSearch Vector Conversion Setup")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not Path("images").exists():
        print("❌ Images directory not found!")
        print("💡 Make sure you're running this from the scrapping directory")
        return
    
    # Install requirements
    if not install_requirements():
        return
    
    # Check OpenSearch connection
    print("\n🔍 Checking OpenSearch connection...")
    opensearch_ok = check_opensearch_connection()
    
    if not opensearch_ok:
        print("\n⚠️  OpenSearch is not accessible.")
        print("You can still run the script to generate vector files locally.")
        response = input("Continue anyway? (y/n): ").lower().strip()
        if response != 'y':
            return
    
    # Run the conversion
    print("\n🔄 Starting image conversion...")
    try:
        from image_to_opensearch import main as convert_main
        convert_main()
    except Exception as e:
        print(f"❌ Conversion failed: {e}")
        print("💡 Try running: python image_to_opensearch.py")

if __name__ == "__main__":
    main()
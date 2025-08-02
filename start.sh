#!/bin/bash

# AI Agent Management Backend - Startup Script

echo "🚀 Starting AI Agent Management Backend..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if pip is installed
if ! command -v pip &> /dev/null; then
    echo "❌ pip is required but not installed."
    exit 1
fi

# Install dependencies if requirements.txt exists
if [ -f requirements.txt ]; then
    echo "📦 Installing Python dependencies..."
    pip install -r requirements.txt
fi

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Run the application
echo "🏃 Starting FastAPI server..."
python main.py
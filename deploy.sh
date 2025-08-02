#!/bin/bash

# AI Agent Management System - Deployment Script

echo "🚀 Deploying AI Agent Management System..."

# Check if we're in the right directory
if [ ! -f "main.py" ] || [ ! -d "frontend" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

# Backend Setup
echo "📦 Setting up backend..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -q -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env file from template..."
    cp .env.example .env
    echo "📝 Please edit .env file with your configuration!"
fi

# Frontend Setup
echo "📱 Setting up frontend..."
cd frontend

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install -q

# Build frontend for production
echo "Building frontend for production..."
npm run build

cd ..

echo "✅ Deployment complete!"
echo ""
echo "🔧 Configuration needed:"
echo "   1. Edit .env file with your Vapi API keys"
echo "   2. Set secure admin credentials"
echo "   3. Configure webhook URL in Vapi dashboard"
echo ""
echo "🏃 To start the system:"
echo "   Backend:  python main.py (or ./start.sh)"
echo "   Frontend: cd frontend && npm run dev"
echo ""
echo "🌐 Access URLs:"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "🔑 Default login: admin / admin123"
echo ""
echo "✨ Happy managing your AI agents!"
#!/bin/bash

# Neural Loom v2.0 Setup Script

echo "🧠 Initializing Neural Loom v2.0 Environment..."

# Define core paths
MEMORY_DIR="$HOME/.openclaw/v2/memory"
EPISODIC_DIR="$MEMORY_DIR/episodic"
PROCEDURAL_DIR="$MEMORY_DIR/procedural"
SEMANTIC_DIR="$MEMORY_DIR/semantic-index"
BACKUP_DIR="$HOME/.openclaw/backups"

# Create directories
echo "📂 Creating directory structure..."
mkdir -p "$EPISODIC_DIR"
mkdir -p "$PROCEDURAL_DIR"
mkdir -p "$SEMANTIC_DIR"
mkdir -p "$BACKUP_DIR"

# Initialize Meta Profile if it doesn't exist
META_PROFILE="$MEMORY_DIR/meta-profile.json"
if [ ! -f "$META_PROFILE" ]; then
    echo "Creating default meta-profile..."
    cat <<EOF > "$META_PROFILE"
{
  "identity": "AI Assistant",
  "tier": 5,
  "decay_rate": 0.01,
  "created_at": "$(date -Iseconds)",
  "traits": []
}
EOF
fi

# Initialize Git Repository
echo "🛡️ Initializing Git repository for memory versioning..."
cd "$MEMORY_DIR" || exit
if [ ! -d ".git" ]; then
    git init
    git branch -M main
    git config user.name "NeuralLoomBot"
    git config user.email "bot@neuralloom.local"
    
    # Initial commit
    git add .
    git commit -m "chore: Initialize Neural Loom Memory System v2.0"
    echo "✅ Git repository initialized."
else
    echo "✅ Git repository already exists."
fi

# NPM installation
echo "📦 Installing Node.js dependencies..."
cd - > /dev/null
npm install

echo ""
echo "✨ Neural Loom v2.0 setup is complete! ✨"
echo "You can now run 'npm start' to begin the cognitive loop."

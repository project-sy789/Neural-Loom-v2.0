#!/bin/bash

# Neural Loom v2.2 Setup Script

echo "🧠 Initializing Neural Loom v2.2 Environment..."

# Define core paths
MEMORY_DIR="$HOME/.openclaw/v2/memory"
EPISODIC_DIR="$MEMORY_DIR/episodic"
PROCEDURAL_DIR="$MEMORY_DIR/procedural"
SEMANTIC_DIR="$MEMORY_DIR/semantic-index"
ARCHIVE_DIR="$MEMORY_DIR/archive"
BACKUP_DIR="$HOME/.openclaw/backups"


# Create directories
echo "📂 Creating directory structure..."
mkdir -p "$EPISODIC_DIR"
mkdir -p "$PROCEDURAL_DIR"
mkdir -p "$SEMANTIC_DIR"
mkdir -p "$ARCHIVE_DIR"
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
    git commit -m "chore: Initialize Neural Loom Memory System v2.2"
    echo "✅ Git repository initialized."

    # Ask for GitHub configuration for automated remote backup
    echo ""
    echo "================================================="
    echo " 🌐 ตระเตรียมระบบ GitHub Remote Backup (Optional) "
    echo "================================================="
    echo "ระบบ Neural Loom ถูกออกแบบให้สำรองความจำอัจฉริยะแบบ Private บน GitHub ได้"
    read -p "ต้องการตั้งค่า Remote Repository ตอนนี้เลยไหม? (y/N): " SETUP_REMOTE
    if [[ "$SETUP_REMOTE" == "y" || "$SETUP_REMOTE" == "Y" ]]; then
        read -p "กรุณาใส่ GitHub Repository URL พร้อม Access Token: (เช่น https://<TOKEN>@github.com/User/Repo.git): " GIT_REMOTE_URL
        if [[ -n "$GIT_REMOTE_URL" ]]; then
            git remote add origin "$GIT_REMOTE_URL"
            # We don't push immediately because there might be no remote branch existing depending on setup, but it's configured.
            echo "✅ นำเข้า Remote URL เก็บไว้สำหรับ Auto-Backup ทุก 12 ชั่วโมงเรียบร้อย!"
        else
            echo "⚠️ ไม่พบ URL ขอข้ามการตั้งค่า Remote Push..."
        fi
    else
        echo "⏭️ ข้ามการตั้งค่า Remote Push (คุณสามารถตั้งค่าเองได้ภายหลังผ่านคำสั่ง git remote add origin)"
    fi
else
    echo "✅ Git repository already exists."
fi

# NPM installation
echo "📦 Installing Node.js dependencies..."
cd - > /dev/null
npm install

# PM2 - Auto-start service manager
echo ""
echo "================================================="
echo " 🚀 ตั้งค่า PM2 (Auto-start Service Manager)    "
echo "================================================="

if ! command -v pm2 &> /dev/null; then
    echo "ติดตั้ง PM2..."
    npm install -g pm2
fi

# Create log directory
mkdir -p "$MEMORY_DIR/logs"

# Start Neural Loom with PM2
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"; pwd)"
cd "$APP_DIR"

pm2 start ecosystem.config.js 2>/dev/null || pm2 restart neural-loom
pm2 save

# Register to start on OS boot
echo ""
echo "📌 กำลังลงทะเบียน Neural Loom ให้รันอัตโนมัติเมื่อเปิดเครื่อง..."
pm2 startup 2>/dev/null | tail -1 | bash 2>/dev/null || \
    echo "⚠️  (ทำ startup อัตโนมัติไม่ได้ - รัน 'pm2 startup' แล้วทำตามคำแนะนำ)"

echo ""
echo "✨ Neural Loom v2.3 setup is complete! ✨"
echo "   → Neural Loom is running in background via PM2"
echo "   → Check status: pm2 status"
echo "   → View logs:   pm2 logs neural-loom"

#!/bin/bash
# Romance Editor - Hostinger VPS Deployment Script
# Run this from your local machine with:
#   ANTHROPIC_KEY=your_key_here bash deploy-to-hostinger.sh
# OR
#   bash deploy-to-hostinger.sh
# (will prompt for API key)

set -e  # Exit on error

# Configuration
VPS_IP="76.13.108.96"
VPS_USER="root"
REPO_URL="https://github.com/lauranguyen546/write.git"
BRANCH="claude/setup-romance-editor-xT3g8"
APP_DIR="/var/www/write/romance-editor-final"

# Get Anthropic API key
if [ -z "$ANTHROPIC_KEY" ]; then
    echo "Enter your Anthropic API key:"
    read -s ANTHROPIC_KEY
    echo ""
fi

if [ -z "$ANTHROPIC_KEY" ]; then
    echo "❌ Error: ANTHROPIC_KEY is required"
    exit 1
fi

echo "🚀 Deploying Romance Editor to Hostinger VPS..."
echo "VPS IP: $VPS_IP"
echo ""

# Deploy via SSH
ssh -t $VPS_USER@$VPS_IP << 'ENDSSH'

echo "📦 Step 1: Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential git

echo ""
echo "📦 Step 2: Installing PM2 process manager..."
sudo npm install -g pm2

echo ""
echo "📥 Step 3: Cloning repository..."
sudo mkdir -p /var/www
cd /var/www
if [ -d "write" ]; then
    echo "Repository exists, pulling latest changes..."
    cd write
    sudo git fetch origin
    sudo git checkout claude/setup-romance-editor-xT3g8
    sudo git pull origin claude/setup-romance-editor-xT3g8
else
    sudo git clone https://github.com/lauranguyen546/write.git
    cd write
    sudo git checkout claude/setup-romance-editor-xT3g8
fi

cd romance-editor-final
sudo chown -R $USER:$USER /var/www/write

echo ""
echo "📦 Step 4: Installing dependencies..."
npm install

echo ""
echo "⚙️ Step 5: Configuring environment..."
ENDSSH

# Create .env file with API key (done from local machine)
ssh $VPS_USER@$VPS_IP "cat > $APP_DIR/.env" << ENVFILE
ANTHROPIC_API_KEY=$ANTHROPIC_KEY
LLM_PROVIDER=anthropic
NODE_ENV=production
PORT=3000
ENVFILE

# Continue with deployment
ssh -t $VPS_USER@$VPS_IP << 'ENDSSH2'
cd /var/www/write/romance-editor-final

echo ""
echo "🔨 Step 6: Building application..."
npm run build

echo ""
echo "🗄️ Step 7: Initializing database..."
npx prisma generate
npx prisma db push

echo ""
echo "⚙️ Step 8: Creating PM2 ecosystem config..."
cat > ecosystem.config.js << 'ECOFILE'
module.exports = {
  apps: [
    {
      name: 'romance-editor-web',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/write/romance-editor-final',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: 'logs/web-error.log',
      out_file: 'logs/web-out.log'
    },
    {
      name: 'romance-editor-worker',
      script: 'npm',
      args: 'run worker',
      cwd: '/var/www/write/romance-editor-final',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: 'logs/worker-error.log',
      out_file: 'logs/worker-out.log'
    }
  ]
};
ECOFILE

echo ""
echo "🚀 Step 9: Starting applications with PM2..."
mkdir -p logs
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo ""
echo "🌐 Step 10: Installing and configuring Nginx..."
sudo apt install -y nginx

sudo tee /etc/nginx/sites-available/romance-editor > /dev/null << 'NGINXCONF'
server {
    listen 80;
    server_name 76.13.108.96;

    client_max_body_size 20M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
    }
}
NGINXCONF

sudo ln -sf /etc/nginx/sites-available/romance-editor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "📊 Application Status:"
pm2 status

echo ""
echo "🌐 Your Romance Editor is now running at:"
echo "   http://76.13.108.96"
echo ""
echo "📝 Useful commands:"
echo "   pm2 status              - Check app status"
echo "   pm2 logs                - View all logs"
echo "   pm2 logs romance-editor-web    - View web server logs"
echo "   pm2 logs romance-editor-worker - View worker logs"
echo "   pm2 restart all         - Restart both apps"
echo ""
echo "⚠️ IMPORTANT: Open ports 80 and 443 in Hostinger hPanel firewall!"
echo "   1. Go to https://hpanel.hostinger.com/"
echo "   2. VPS → Firewall"
echo "   3. Allow ports 80 (HTTP) and 443 (HTTPS)"
echo ""
ENDSSH2

echo ""
echo "🎉 Deployment script completed!"
echo "Visit http://76.13.108.96 to see your Romance Editor!"

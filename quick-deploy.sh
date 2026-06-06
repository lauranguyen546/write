#!/bin/bash
# Romance Editor - Quick Deploy Commands
# Copy and paste these into your Hostinger VPS SSH session

echo "🚀 Starting Romance Editor Deployment..."

# Step 1: Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs build-essential git

# Step 2: Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Step 3: Clone repository
echo "📥 Cloning repository..."
sudo mkdir -p /var/www
cd /var/www
if [ -d "write" ]; then
    echo "Repository exists, updating..."
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

# Step 4: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 5: Configure environment
echo "⚙️ Configuring environment..."
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "Enter your Anthropic API key:"
    read -s ANTHROPIC_API_KEY
fi

cat > .env << EOF
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
LLM_PROVIDER=anthropic
NODE_ENV=production
PORT=3000
EOF

# Step 6: Build application
echo "🔨 Building application..."
npm run build

# Step 7: Initialize database
echo "🗄️ Initializing database..."
npx prisma generate
npx prisma db push

# Step 8: Create PM2 config
echo "⚙️ Creating PM2 configuration..."
cat > ecosystem.config.js << 'ECOEOF'
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
ECOEOF

# Step 9: Start with PM2
echo "🚀 Starting applications..."
mkdir -p logs
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup | grep -v "sudo env" | tail -1 > /tmp/pm2-startup.sh
sudo bash /tmp/pm2-startup.sh

# Step 10: Install and configure Nginx
echo "🌐 Installing Nginx..."
sudo apt install -y nginx

echo "⚙️ Configuring Nginx..."
sudo tee /etc/nginx/sites-available/romance-editor > /dev/null << 'NGINXEOF'
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
NGINXEOF

sudo ln -sf /etc/nginx/sites-available/romance-editor /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo ""
echo "✅ ========================================="
echo "✅  DEPLOYMENT COMPLETE!"
echo "✅ ========================================="
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
echo "   pm2 logs romance-editor-web    - Web server logs"
echo "   pm2 logs romance-editor-worker - Worker logs"
echo "   pm2 restart all         - Restart both apps"
echo ""

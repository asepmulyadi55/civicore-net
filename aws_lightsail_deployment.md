# 🚀 Deploy CiviCore to AWS Lightsail ($5 Ubuntu 24.04 LTS)

This guide walks you through deploying your **CiviCore** application (.NET 8 Backend + React/Vite Admin Frontend + Next.js Web Frontend) onto a $5/month AWS Lightsail instance (512 MB RAM, 2 vCPUs).

> [!WARNING]
> **512 MB RAM is very low** for compiling .NET and Node.js applications on the server. If we don't set up a Swap file first, the server will run out of memory and crash during `npm run build` or `dotnet publish`.

---

## 💡 Note on `appsettings.Production.json`

If you don't have an `appsettings.Production.json` file, **don't worry!** 
By default, .NET reads from `appsettings.json`. If an `appsettings.Production.json` exists (and `ASPNETCORE_ENVIRONMENT=Production`), it will override specific values (like database connections). If it doesn't exist, .NET will just happily use the values in your standard `appsettings.json`. 

---

## Step 1: Connect & Setup Swap File (Crucial)

Connect to your Lightsail instance via SSH. We'll create a 2GB swap file to prevent out-of-memory errors.

```bash
# 1. Create a 2GB swap file
sudo fallocate -l 2G /swapfile

# 2. Set the correct permissions
sudo chmod 600 /swapfile

# 3. Format the file as swap
sudo mkswap /swapfile

# 4. Enable the swap
sudo swapon /swapfile

# 5. Make it permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## Step 2: Install Prerequisites

```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install Nginx
sudo apt install nginx -y

# Install .NET 8 SDK
sudo apt install dotnet-sdk-8.0 -y

# Install Node.js (Latest LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (Process Manager for the Next.js app)
sudo npm install -g pm2
```

## Step 3: Deploy and Build the Projects

Clone or copy your code to `/var/www/civicore-net`.

```bash
cd /var/www
sudo git clone https://github.com/your-username/civicore-net.git
sudo chown -R $USER:$USER /var/www/civicore-net
cd civicore-net

# --- 1. Build the .NET API ---
cd CiviCore.Api
dotnet publish -c Release -o publish
cd ..

# --- 2. Build the React Frontend (Admin/Portal) ---
cd CiviCore.Frontend
npm install
npm run build
cd ..

# --- 3. Build the Next.js Web App (CiviCore.Web) ---
cd CiviCore.Web
npm install
npm run build
cd ..
```

## Step 4: Run Backend Apps in Background

### 1. Run the .NET API (Systemd)

1. Create a service file:
```bash
sudo nano /etc/systemd/system/civicore-api.service
```

2. Paste the following configuration:
```ini
[Unit]
Description=CiviCore .NET 8 Web API
After=network.target

[Service]
WorkingDirectory=/var/www/civicore-net/CiviCore.Api/publish
ExecStart=/usr/bin/dotnet /var/www/civicore-net/CiviCore.Api/publish/CiviCore.Api.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=civicore-api
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
# Specify the port Kestrel should listen on (e.g., 5000)
Environment=ASPNETCORE_URLS=http://127.0.0.1:5000

[Install]
WantedBy=multi-user.target
```

3. Enable and start:
```bash
sudo systemctl enable civicore-api.service
sudo systemctl start civicore-api.service
```

### 2. Run the Next.js Web App (PM2)

Next.js requires a Node.js server to run. We use PM2 to keep it alive.

```bash
cd /var/www/civicore-net/CiviCore.Web
# Start the Next.js app on port 3000
pm2 start npm --name "civicore-web" -- start -- -p 3000

# Save PM2 list so it restarts on server reboot
pm2 save
pm2 startup
# Follow the command PM2 prints out to enable startup on boot!
```

## Step 5: Configure Nginx

Nginx will handle routing traffic to the correct application:
- `yourdomain.com/` -> Next.js Web App (Port 3000)
- `yourdomain.com/admin/` -> React Frontend (`dist` folder)
- `yourdomain.com/api/` -> .NET Web API (Port 5000)

```bash
sudo nano /etc/nginx/sites-available/civicore
```

Paste this (adjust `server_name` and paths as needed):

```nginx
server {
    listen 80;
    server_name your_domain_or_ip; 

    # 1. Main Website: Reverse Proxy for Next.js (CiviCore.Web)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 2. Admin Panel: Serve React Frontend (CiviCore.Frontend)
    # Assumes your React app is built to run under /admin in Vite config
    location /admin {
        alias /var/www/civicore-net/CiviCore.Frontend/dist;
        index index.html index.htm;
        try_files $uri $uri/ /admin/index.html;
    }

    # 3. Backend: Reverse Proxy for .NET API (CiviCore.Api)
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/civicore /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## Step 6: Database Considerations

> [!TIP]
> CiviCore is migrating from Laravel/MySQL to **.NET Core/Supabase**. 
> Just ensure your `appsettings.json` has the correct Supabase Connection String. You don't need a local MySQL database on the Lightsail server.

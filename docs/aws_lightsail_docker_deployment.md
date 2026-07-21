# 🐳 VPS Deployment Guide — Two-Subdomain Architecture

This guide covers deploying CiviCore to a VPS using Docker and Nginx with the current two-subdomain architecture:

| Subdomain | Service |
|---|---|
| `dwipapuri.amsite.click` | Public Site (Next.js) |
| `admin.dwipapuri.amsite.click` | Admin Panel (React/Vite) |
| Backend API runs internally on port `5000` |

> [!CAUTION]
> **Memory Warning:** Building Docker images (especially for .NET and Next.js) requires significant memory. On a 512MB RAM server, a 2GB swap file is **mandatory**, otherwise the server will crash during `docker compose build`. See Step 1.

---

## Step 1: Connect & Setup Swap File (Mandatory)

SSH into your VPS and run:

```bash
# 1. Create a 2GB swap file
sudo fallocate -l 2G /swapfile

# 2. Set correct permissions
sudo chmod 600 /swapfile

# 3. Format as swap
sudo mkswap /swapfile

# 4. Enable the swap
sudo swapon /swapfile

# 5. Make it permanent across reboots
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Step 2: Install Docker & Docker Compose

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io -y

# Enable and start Docker
sudo systemctl enable docker
sudo systemctl start docker

# Add your user to the docker group (no more 'sudo' for docker)
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install docker-compose-v2 -y
```

> ⚠️ Log out of SSH and log back in for the `usermod` permission to take effect.

---

## Step 3: Clone Your Repository

```bash
cd ~
git clone https://github.com/your-username/civicore-net.git
cd civicore-net
```

---

## Step 4: Configure Environment

The `docker-compose.yml` already contains the correct environment variables. If you need to change the domain, edit it:

```bash
nano docker-compose.yml
```

The key variables to verify:

```yaml
# In the 'api' service:
- FrontendUrl=https://dwipapuri.amsite.click   # ← public site domain for CORS

# In the 'web' service (Next.js public site):
- API_INTERNAL_URL=http://api:8080             # ← internal Docker network call
- NEXT_PUBLIC_SITE_URL=https://dwipapuri.amsite.click  # ← used by sitemap.ts
```

---

## Step 5: Build and Run with Docker Compose

```bash
docker compose up --build -d
```

- `--build`: Forces Docker to build the images from Dockerfiles.
- `-d`: Runs in detached mode (background).

> ⏳ On low-RAM servers this will take several minutes as it relies on the swap file. Be patient.

Verify all containers are running:

```bash
docker compose ps
```

You should see `api`, `redis`, `web`, and `frontend` all with a `running` status.

---

## Step 6: Setup Nginx as Reverse Proxy (Two-Subdomain Config)

Install Nginx on the host machine:

```bash
sudo apt install nginx -y
```

### Create the Public Site config (`dwipapuri.amsite.click`)

```bash
sudo nano /etc/nginx/sites-available/civicore-public
```

Paste:
```nginx
server {
    listen 80;
    server_name dwipapuri.amsite.click;

    # Restrict uploads to 2MB (app limit is 1MB + buffer for form data)
    client_max_body_size 2M;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Public Site → Next.js container (port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API → .NET container (port 5000)
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Public media files
    location /public-media/ {
        proxy_pass http://127.0.0.1:5000/public-media/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### Create the Admin Panel config (`admin.dwipapuri.amsite.click`)

```bash
sudo nano /etc/nginx/sites-available/civicore-admin
```

Paste:
```nginx
server {
    listen 80;
    server_name admin.dwipapuri.amsite.click;

    # Restrict uploads to 2MB (app limit is 1MB + buffer for form data)
    client_max_body_size 2M;

    # Block search engine indexing at the Nginx level too
    add_header X-Robots-Tag "noindex, nofollow" always;

    # Admin SPA → React/Vite container (port 8080)
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API → .NET container (port 5000)
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Public media files (admin needs these too for image previews)
    location /public-media/ {
        proxy_pass http://127.0.0.1:5000/public-media/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:5000/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### Enable both sites

```bash
# Enable
sudo ln -s /etc/nginx/sites-available/civicore-public /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/civicore-admin /etc/nginx/sites-enabled/

# Remove the default placeholder site
sudo rm /etc/nginx/sites-enabled/default

# Test config is valid
sudo nginx -t

# Apply
sudo systemctl reload nginx
```

---

## Step 7: Point DNS Records

Before getting SSL certificates, you must create two DNS A records in your domain registrar (or Cloudflare, etc.):

| Type | Name | Value |
|---|---|---|
| `A` | `@` or `dwipapuri` | Your VPS public IP |
| `A` | `admin` | Your VPS public IP |

> ⏳ DNS propagation can take up to 24 hours, but is usually a few minutes.

---

## Step 8: HTTPS with Let's Encrypt (Certbot)

Install Certbot:

```bash
sudo apt install certbot python3-certbot-nginx -y
```

Issue SSL certificates for **both** subdomains at once:

```bash
sudo certbot --nginx -d dwipapuri.amsite.click -d admin.dwipapuri.amsite.click
```

Follow the prompts (enter your email, agree to terms). Certbot will automatically:
1. Fetch the certificates.
2. Update both Nginx config files to enable HTTPS.
3. Set up auto-renewal via a cron job.

Verify auto-renewal works:
```bash
sudo certbot renew --dry-run
```

---

## Step 9: Redeploying After Code Changes

When you push new code, SSH into the VPS and run:

```bash
cd ~/civicore-net
git pull origin main

# Build first (website stays online)
docker compose build

# Restart containers with new image (1-2 seconds downtime)
docker compose up -d
```

To rebuild only a specific service (faster):

```bash
# Only rebuild the public site
docker compose build web
docker compose up -d web

# Only rebuild the admin panel
docker compose build frontend
docker compose up -d frontend

# Only rebuild the API
docker compose build api
docker compose up -d api
```

Check container status at any time:

```bash
docker compose ps
docker compose logs -f web    # Stream logs for a specific service
```

---

## Quick Reference

| URL | Container | Port |
|---|---|---|
| `dwipapuri.amsite.click` | `web` (Next.js) | `3000` |
| `admin.dwipapuri.amsite.click` | `frontend` (React) | `8080` |
| `.../api/*` (internal) | `api` (.NET) | `5000` |
| Redis (internal only) | `redis` | `6379` |

> [!TIP]
> **Testing locally before deploy:** Run `docker compose up --build` on your machine to verify the full stack builds correctly before pushing to the VPS. Just note that `admin.dwipapuri.amsite.click` won't resolve locally — you'd access admin at `localhost:8080` and public at `localhost:3000`.

# 🐳 Deploy CiviCore to AWS Lightsail using Docker

Yes, it is **100% possible** to use Docker on your Lightsail server even if you don't have Docker installed on your laptop! 

You simply push your source code to GitHub/GitLab, pull it onto your Lightsail server, and run Docker there. Docker will handle all the building and running on the server.

> [!CAUTION]
> **Memory Warning for Docker Builds:** Building Docker images (especially for .NET and Next.js) requires a lot of memory. On a 512MB RAM server, a 2GB swap file is absolutely mandatory, otherwise the server will crash during the `docker-compose build` step. The build might take a few minutes as it relies on the Swap file (disk memory).

---

## Step 1: Connect & Setup Swap File (Mandatory)

Just like the previous guide, we must create a Swap file to handle the heavy memory lifting during the Docker build process.

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

## Step 2: Install Docker & Docker Compose on Lightsail

Run these commands on your Lightsail server to install Docker:

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install docker.io -y

# Enable and start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Add your user to the docker group so you don't need 'sudo' for every docker command
sudo usermod -aG docker ubuntu
```
*(You may need to log out of SSH and log back in for the `usermod` permission to take effect)*

Install Docker Compose:
```bash
sudo apt install docker-compose-v2 -y
```

## Step 3: Clone Your Repository

```bash
cd ~
git clone https://github.com/your-username/civicore-net.git
cd civicore-net
```

## Step 4: Create Docker Configuration Files

You will need to create a few files in your repository. You can either create them directly on the server using `nano`, or create them on your laptop, commit them to Git, and `git pull` on the server.

### 1. Root `docker-compose.yml`
Create a file named `docker-compose.yml` in the root of your project:
```yaml
services:
  api:
    build:
      context: .
      dockerfile: CiviCore.Api/Dockerfile
    ports:
      - "5000:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
    volumes:
      - civicore_public_media:/app/wwwroot/public-media
      - civicore_private_media:/app/App_Data/PrivateMedia

  web:
    build:
      context: ./CiviCore.Web
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - API_INTERNAL_URL=http://api:8080

  frontend:
    build:
      context: ./CiviCore.Frontend
      dockerfile: Dockerfile
    ports:
      - "8080:80"

volumes:
  civicore_public_media:
  civicore_private_media:
```

### 2. .NET API Dockerfile
Create `CiviCore.Api/Dockerfile`:
```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["CiviCore.Api/CiviCore.Api.csproj", "CiviCore.Api/"]
COPY ["CiviCore.Application/CiviCore.Application.csproj", "CiviCore.Application/"]
COPY ["CiviCore.Domain/CiviCore.Domain.csproj", "CiviCore.Domain/"]
COPY ["CiviCore.Infrastructure/CiviCore.Infrastructure.csproj", "CiviCore.Infrastructure/"]
RUN dotnet restore "CiviCore.Api/CiviCore.Api.csproj"
COPY . .
WORKDIR "/src/CiviCore.Api"
RUN dotnet publish "CiviCore.Api.csproj" -c Release -o /app/publish

# Serve stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CiviCore.Api.dll"]
```

### 3. Next.js Web Dockerfile
Create `CiviCore.Web/Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

### 4. React Frontend Dockerfile
Create `CiviCore.Frontend/Dockerfile`:
```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve stage using Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Step 5: Build and Run with Docker Compose

Now that your files are ready, simply run this command in the root folder (`~/civicore-net`) on your server:

```bash
docker compose up --build -d
```
- `--build`: Forces Docker to build the images from the Dockerfiles.
- `-d`: Runs the containers in "detached" mode (in the background).

*(Note: Because of the 512MB RAM, this step will take some time as it heavily uses the Swap file. Be patient!)*

## Step 6: Set up Nginx as a Reverse Proxy (On the Host)

Even though Docker is running your apps, it's best practice to let Nginx handle the internet-facing traffic on port 80 and route it to your Docker containers.

```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/civicore
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name your_domain_or_ip; 

    # 1. Main Website: Route to Next.js Docker Container
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 2. Admin Panel: Route to React Docker Container
    location /admin/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 3. Backend: Route to .NET API Docker Container
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

    # 4. Public Media: Route to .NET API Docker Container
    location /public-media/ {
        proxy_pass http://127.0.0.1:5000/public-media/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

Enable and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/civicore /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### You're Done! 🎉
Your apps are now containerized using Docker, isolating them and making them much easier to manage, restart, and upgrade in the future!

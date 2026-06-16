# Ubuntu Server Deployment Guide

This is a comprehensive, step-by-step guide to deploying **JobAIder** on a fresh **Ubuntu Linux server** (e.g., Ubuntu 20.04 or 22.04 on AWS, DigitalOcean, or Linode).

---

## Phase 1: Server Preparation

First, SSH into your new Ubuntu server:
```bash
ssh root@your_server_ip
```

Update your system packages:
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Docker and Docker Compose
Install Docker using the official installation script, which is the easiest and most reliable method:
```bash
# Download and run the Docker install script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Verify Docker is running
sudo systemctl status docker

# Verify Docker Compose is installed
docker compose version
```

---

## Phase 2: Project Setup

### 1. Upload Your Code
You can get your code onto the server either by cloning it via Git or copying it via `scp`/`rsync`. 

**Option A: Git Clone (Recommended)**
```bash
git clone https://github.com/your-username/JobAIder.git
cd JobAIder
```

**Option B: SCP from your local machine**
*Run this on your LOCAL computer, not the server:*
```bash
scp -r /path/to/JobAIder root@your_server_ip:~/JobAIder
```
Then, on the server, `cd ~/JobAIder`.

### 2. Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```

Edit the `.env` file with `nano`:
```bash
nano .env
```
Make the following changes:
- Set `OPENAI_API_KEY` to your real OpenAI key.
- Set `SECRET_KEY` to a random string (run `openssl rand -hex 32` in your terminal to generate one).
- Set `NEXT_PUBLIC_API_BASE="http://your_server_ip:8000"` (or your domain name if you are setting up DNS later).
- Set `ALLOWED_ORIGINS="http://your_server_ip:3000"` (or your domain name).

*(Press `Ctrl+O`, `Enter`, then `Ctrl+X` to save and exit nano).*

---

## Phase 3: Launch the Application!

With Docker installed and your `.env` configured, launching the app is one simple command:

```bash
docker compose up --build -d
```
Docker will now build the optimized frontend and backend images and start them in the background.

**Test it:** Open your browser and go to `http://your_server_ip:3000`. You should see JobAIder running!

---

## Phase 4: Production Enhancements (Optional but Highly Recommended)

Serving your application directly on ports 3000/8000 works, but in production, you should use a reverse proxy (like **Nginx**) to serve the app on standard HTTP/HTTPS ports (80/443).

### 1. Install Nginx
```bash
sudo apt install nginx -y
```

### 2. Configure Nginx
Create a new configuration file for JobAIder:
```bash
sudo nano /etc/nginx/sites-available/jobaider
```

Paste the following configuration (replace `yourdomain.com` with your actual domain or IP):
```nginx
server {
    listen 80;
    server_name yourdomain.com; # <--- Change this

    # Route all traffic to the Next.js Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name api.yourdomain.com; # <--- Change this to your API subdomain

    # Route API traffic to the FastAPI Backend
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/jobaider /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Update `.env` for Nginx
Since you are now using Nginx and a domain name, edit your `.env` file again:
```bash
NEXT_PUBLIC_API_BASE="http://api.yourdomain.com"
ALLOWED_ORIGINS="http://yourdomain.com"
```
Restart the docker containers to apply the new `.env`:
```bash
docker compose down
docker compose up -d
```

### 4. Enable HTTPS (SSL)
To secure your site with HTTPS, use Let's Encrypt Certbot:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```
Certbot will automatically configure Nginx to use HTTPS!

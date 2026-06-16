# Production Deployment Guide

This guide covers how to deploy JobAIder to a production environment using Docker and Docker Compose. This setup is highly portable and can be deployed to any VPS (e.g., DigitalOcean Droplet, AWS EC2, Linode) or on-premise server.

## Prerequisites
1. **Docker**: Ensure Docker is installed on your server.
2. **Docker Compose**: Ensure the Docker Compose plugin (`docker compose`) is installed.
3. **OpenAI API Key**: You must have a valid API key.

---

## 1. Environment Configuration

Before starting the application, you must configure the environment variables.

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` in your preferred editor (e.g., `nano .env`) and configure the following required variables:

- `OPENAI_API_KEY`: Your OpenAI API key.
- `SECRET_KEY`: A strong, random string used for JWT session security. You can generate one using `openssl rand -hex 32`.
- `NEXT_PUBLIC_API_BASE`: The fully qualified public URL where the backend will be accessible to users (e.g., `https://api.yourdomain.com`). If you are running both frontend and backend on the same machine without a reverse proxy, you can leave it as `http://localhost:8000` (or the server's public IP).
- `ALLOWED_ORIGINS`: A comma-separated list of domains that are allowed to make requests to the backend (e.g., `https://yourdomain.com,http://localhost:3000`).

---

## 2. Start the Application

Once your `.env` file is ready, start the application in detached mode:

```bash
docker compose up --build -d
```

This will automatically:
1. Build the lightweight Python backend image.
2. Build the optimized Next.js standalone frontend image.
3. Start both containers and bind the frontend to port `3000` and the backend to port `8000`.

To view the application, navigate to `http://<your-server-ip>:3000`.

---

## 3. Database & Data Persistence

JobAIder uses a SQLite database. To ensure your data is never lost when containers restart or update, the `docker-compose.yml` mounts a persistent Docker volume called `jobaider_backend_data`.

**Migrating an Existing Database:**
If you have an existing `jobaider.db` file from local development that you want to bring into production, you can copy it into the backend container after it has started:

```bash
# 1. Start the container first so the volume is created
docker compose up -d

# 2. Copy your local database file into the running container
docker cp ./backend/jobaider.db jobaider-backend:/app/data/jobaider.db

# 3. Restart the backend to load the new database
docker restart jobaider-backend
```

---

## 4. Maintenance & Operations

**Viewing Logs:**
To view real-time logs for both services:
```bash
docker compose logs -f
```
To view logs for just the backend:
```bash
docker compose logs -f backend
```

**Updating the Application:**
When you pull new code changes via Git, you must rebuild the images for the changes to take effect:
```bash
docker compose down
docker compose up --build -d
```

**Stopping the Application:**
```bash
docker compose down
```
*(Note: `docker compose down` will NOT delete your database. Your data remains safe in the persistent volume).*

---

## 5. Exposing to the Public Web (Optional but Recommended)

By default, the application runs on ports `3000` and `8000`. For a true production setup, it is highly recommended to place a Reverse Proxy (like **Nginx** or **Caddy**) in front of the application. 

A reverse proxy will allow you to serve the frontend on standard port 80/443 (HTTP/HTTPS) and provide automatic SSL certificates. 

*Example Caddyfile:*
```caddyfile
yourdomain.com {
    reverse_proxy localhost:3000
}

api.yourdomain.com {
    reverse_proxy localhost:8000
}
```
*(If you do this, remember to update `NEXT_PUBLIC_API_BASE` and `ALLOWED_ORIGINS` in your `.env` file to match your new domains!)*

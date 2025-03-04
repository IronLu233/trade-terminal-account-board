# Bull Dashboard

A dashboard application for managing BullMQ job queues.

## Prerequisites

1. Install nvm (Node Version Manager):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

2. Install Node.js 22:

```bash
# Reload shell configuration
source ~/.bashrc

# Install and use Node.js 22
nvm install 22
nvm use 22
```

3. Install [Bun](https://bun.sh) runtime:

```bash
curl -fsSL https://bun.sh/install | bash
```

## Installation

1. Install project dependencies:

```bash
bun install
```

2. Build the frontend:

```bash
bun run --filter "*" build
```

3. Configure the backend:

```bash
# Copy environment file
cp apps/backend/.env.example apps/backend/.env

# Copy accounts configuration
cp apps/backend/accounts.example.json apps/backend/accounts.json
```

4. Configure .env file (apps/backend/.env):

```env
REDIS_HOST=localhost      # Redis server hostname
REDIS_PORT=6379          # Redis server port
REDIS_PASS=your_password # Redis password
SCRIPT_PWD=/path/to/scripts  # Python scripts directory
```

5. Configure accounts in apps/backend/accounts.json:

- The file contains a list of allowed account names
- Each account represents a trading bot instance
- Edit the list according to your needs

## Running the Application

Start the backend server:

```bash
PORT=5822 bun start --filter "backend"
```

The dashboard will be available at http://localhost:5822

## Nginx Configuration

Add this to your Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5822;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Then reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Security Notes

- Use strong Redis passwords
- Configure proper firewall rules
- Enable HTTPS in production
- Keep dependencies updated

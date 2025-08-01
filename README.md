# CompFood - Load Balanced Website

A Docker-based load-balanced deployment of the CompFood website with HAProxy load balancer.

## Quick Start

1. Start the services:
   ```bash
   docker-compose up --build -d
   ```

2. Access your website:
   - Main site: http://localhost:8080

3. Stop the services:
   ```bash
   docker-compose down
   ```

## Architecture

- 2 Web Servers (Nginx) serving your static files
- 1 HAProxy Load Balancer distributing traffic
- Custom Docker Network for secure communication

## Features

- Round-robin load balancing
- Health checks and automatic failover
- Response headers showing which server handled the request
- Easy scaling and management

## Files

- `docker-compose.yml` - Main orchestration file
- `webserver.Dockerfile` - Web server container definition
- `haproxy/haproxy.cfg` - Load balancer configuration
- `CompFood/` - Your website files (HTML, CSS, JS)

 Step-by-Step Deployment Guide

### Step 1: Verify Your Project Structure

Ensure your project has the following structure:
```
your-project/
├── CompFood/
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   └── ... (other website files)
├── haproxy/
│   └── haproxy.cfg
├── webserver.Dockerfile
├── docker-compose.yml
└── deploy-guide.md
```

### Step 2: Build and Start the Services

1. Open a terminal/command prompt in your project directory

2. Build and start all services:
   ```bash
   docker-compose up --build -d
   ```

   This command will:
   - Build the web server images
   - Create a custom Docker network
   - Start 2 web servers and 1 HAProxy load balancer
   - Run everything in detached mode (-d flag)

### Step 3: Verify the Deployment

1. Check if all containers are running:
   ```bash
   docker-compose ps
   ```

   You should see 3 containers running:
   - `haproxy-lb` (load balancer)
   - `web-server-01` (web server 1)
   - `web-server-02` (web server 2)

2. Check container logs:
   ```bash
   docker-compose logs
   ```

3. Access your website:
   - Open your web browser
   - Go to `http://localhost`
   - Your website should load with load balancing

 How to run Comp Food - Global Food Price Comparison App locally

A web application for comparing food prices globally, perfect for students studying abroad. Built with Node.js, Express, and free APIs.

## Features

**Global Food Price Comparison** - Compare food prices across different countries
**AI Food Assistant** - Chat with AI about nutrition, cooking, and food tips
**Real Data Sources** - Uses World Bank and FAO APIs for accurate prices
**Student-Focused** - Designed for students planning study abroad budgets
 **Free APIs** - No paid subscriptions required

## Prerequisites

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

## Installation

### Step 1: Clone the Repository
```bash
git clone <your-repository-url>
cd CompFood
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# Create .env file
touch .env
```

Add your API keys to the `.env` file:

```env
# API Keys for Comp Food App

# Get your Gemini API key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Get your RapidAPI key from: https://rapidapi.com/
# (Optional - app works without this using free World Bank API)
RAPIDAPI_KEY=your_rapidapi_key_here
```

### Step 4: Get Your API Keys

#### Gemini AI API (Required for Chat Feature)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key
5. Paste it in your `.env` file as `GEMINI_API_KEY`

#### RapidAPI (Optional - Backup Food Prices)
1. Go to [RapidAPI](https://rapidapi.com/)
2. Sign up for a free account
3. Subscribe to any food prices API (e.g., "World Food Prices API")
4. Copy your API key
5. Paste it in your `.env` file as `RAPIDAPI_KEY`

**Note:** The app works perfectly with just the Gemini API key. The RapidAPI is only used as a backup if the free World Bank API is slow.

### Step 5: Start the Server

```bash
npm start
```

Or run directly with Node:
```bash
node server.js
```

### Step 6: Access the Application

Open your browser and go to:
```
http://localhost:3005

**Built for students, by students!
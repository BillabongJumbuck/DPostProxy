# PostTestProxy

A lightweight proxy server designed to solve browser CORS issues.

## Features

- Dynamic URL proxying
- Automatic HTTPS request handling
- Built-in CORS support
- Professional logging system
- Health check endpoint

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/PostTestProxy.git
cd PostTestProxy
```

2. Install dependencies:
```bash
pnpm install
```

## Configuration

1. Copy environment variables file:
```bash
cp .env.example .env
```

2. Edit `.env` file:
```env
PORT=3000
NODE_ENV=production
```

## Usage

1. Start the server:
```bash
npm start
```

2. Proxy request examples:
```
GET /api/example.com
POST /api/example.com/api/data
```

## Logging System

- Log files location: `logs/` directory
- `combined.log`: Contains all log levels
- `error.log`: Contains only error level logs
- Log rotation: Maximum 5MB per file, up to 5 files retained

## Health Check

Check server status by accessing the `/health` endpoint:
```bash
curl http://localhost:3000/health
```

## Development

- Development environment: Set `NODE_ENV=development` to enable console logging
- Production environment: Set `NODE_ENV=production` to disable console logging

## License

MIT License
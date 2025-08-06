# SaaS Pricing Calculator Backend API

## Overview
Production-ready Node.js/Express backend with PostgreSQL database, JWT authentication, and Redis caching. Designed to handle 10,000+ concurrent users with horizontal scaling capabilities.

## Tech Stack
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod
- **Security**: Argon2, Helmet, CORS
- **Logging**: Winston
- **Email**: Nodemailer

## Features
✅ JWT authentication with refresh tokens  
✅ User registration with email verification  
✅ Password reset flow  
✅ Pricing calculation engine  
✅ Team collaboration  
✅ Calculation versioning  
✅ PDF/CSV export  
✅ API key management  
✅ Rate limiting  
✅ Redis caching  
✅ Comprehensive error handling  

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- npm or yarn

### Installation

1. **Install dependencies**:
```bash
cd backend
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up database**:
```bash
# Create PostgreSQL database
createdb saas_pricing_calculator

# Run Prisma migrations
npm run prisma:generate
npm run prisma:migrate
```

4. **Seed database (optional)**:
```bash
npm run prisma:seed
```

5. **Start development server**:
```bash
npm run dev
```

The API will be available at `http://localhost:3001/api/v1`

## API Documentation

### Authentication Endpoints

#### Register
```
POST /api/v1/auth/register
Body: {
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "company": "Acme Inc"
}
```

#### Login
```
POST /api/v1/auth/login
Body: {
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Refresh Token
```
POST /api/v1/auth/refresh
Body: {
  "refreshToken": "your-refresh-token"
}
```

### Calculation Endpoints

#### Create Calculation
```
POST /api/v1/calculations
Headers: Authorization: Bearer <token>
Body: {
  "name": "Q1 2025 Pricing",
  "inputs": {
    "currentPrice": 99,
    "customers": 100,
    "churnRate": 5,
    "competitorPrice": 120,
    "cac": 300
  }
}
```

#### Get Calculations
```
GET /api/v1/calculations
Headers: Authorization: Bearer <token>
```

#### Share Calculation
```
POST /api/v1/calculations/:id/share
Headers: Authorization: Bearer <token>
```

#### Export Calculation
```
POST /api/v1/calculations/:id/export
Headers: Authorization: Bearer <token>
Body: {
  "format": "pdf" | "csv" | "json"
}
```

### User Endpoints

#### Get Profile
```
GET /api/v1/user/profile
Headers: Authorization: Bearer <token>
```

#### Update Profile
```
PUT /api/v1/user/profile
Headers: Authorization: Bearer <token>
Body: {
  "name": "Jane Doe",
  "company": "New Company"
}
```

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── services/         # Business logic
│   ├── middleware/       # Express middleware
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   └── server.ts         # Main server file
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── tests/                # Test files
├── logs/                 # Log files
└── package.json
```

## Database Schema

### Core Tables
- **users**: User accounts and authentication
- **teams**: Team collaboration
- **calculations**: Pricing calculations
- **calculation_versions**: Version history
- **subscriptions**: Stripe subscriptions
- **api_keys**: API key management
- **analytics_events**: Event tracking

## Security Features

- **Password Security**: Argon2 hashing with salt
- **JWT Security**: RS256 signing, short-lived access tokens
- **Rate Limiting**: 100 requests/15 minutes default
- **Input Validation**: Zod schema validation
- **SQL Injection Prevention**: Prisma ORM
- **XSS Protection**: Helmet middleware
- **CORS Configuration**: Whitelisted origins

## Performance Optimizations

- **Redis Caching**: Session and calculation caching
- **Database Indexing**: Optimized queries
- **Connection Pooling**: Efficient database connections
- **Lazy Loading**: On-demand module loading
- **Compression**: Gzip response compression

## Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Deployment

### Docker

```bash
# Build Docker image
docker build -t saas-pricing-backend .

# Run with Docker Compose
docker-compose up
```

### Production

1. Set production environment variables
2. Run database migrations
3. Build TypeScript
4. Start with PM2 or similar process manager

```bash
npm run build
npm run prisma:deploy
npm start
```

## Monitoring

- Health check: `GET /health`
- Metrics: Winston logs to `logs/` directory
- Error tracking: Comprehensive error logging

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, contact support@predictionnexus.com
# Technology Stack

## Backend (Node.js/Express)

### Core Framework
- **Node.js** with Express.js server
- **Supabase** as primary database (PostgreSQL with real-time features)
- **Redis** for caching and session management

### Key Dependencies
- **Authentication**: JWT tokens, bcryptjs, session management
- **Security**: helmet, cors, express-rate-limit, xss-clean, express-mongo-sanitize
- **File Processing**: multer, csv-parser, sharp (image processing)
- **AI/Automation**: puppeteer for web scraping, axios for API calls
- **Logging**: winston with daily rotation
- **Validation**: express-validator, validator

### Database
- **Primary**: Supabase (PostgreSQL)
- **Caching**: Redis with connection pooling
- **Connection**: pg, pg-pool for PostgreSQL connections

## Frontend (Vue.js 3)

### Core Framework
- **Vue 3** with Composition API
- **Vue Router 4** for navigation
- **Vue CLI** for build tooling

### Key Dependencies
- **HTTP Client**: axios for API communication
- **Charts**: Chart.js for data visualization
- **PDF Generation**: jspdf, html2canvas for report generation
- **Build Tools**: Webpack with compression and image optimization

### Development Tools
- **ESLint** for code linting
- **Babel** for JavaScript transpilation
- **PWA** support with service workers

## Common Commands

### Backend Development
```bash
cd backend
npm install                 # Install dependencies
npm run dev                # Start development server with nodemon
npm start                  # Start production server
```

### Frontend Development
```bash
cd "Eunoia frontend"
npm install                # Install dependencies
npm run serve             # Start development server
npm run build             # Build for production
npm run lint              # Lint and fix files
```

### Production Deployment
```bash
# Backend with PM2
pm2 start ecosystem.config.js

# Frontend build analysis
ANALYZE=true npm run build
```

## Environment Setup

### Required Environment Variables
```env
# Database
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Security
JWT_SECRET=your_jwt_secret_key

# Redis (Production)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
```

## Performance Features

- **Caching**: Redis-based session and query caching
- **Rate Limiting**: Express rate limiting middleware
- **Compression**: Gzip compression for frontend assets
- **Image Optimization**: WebP support and image compression
- **Bundle Splitting**: Code splitting for faster loads
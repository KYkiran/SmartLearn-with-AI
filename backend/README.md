# SmartLearn Backend

Backend API for the SmartLearn AI-powered learning platform.

## Setup

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Configure Environment Variables**
```bash
cp .env.example .env
```

Edit `.env` and set your configuration:
- `MONGODB_URI`: Your MongoDB connection string
- `JWT_SECRET`: A secure random string for JWT tokens
- `OPENAI_API_KEY`: Your OpenAI API key for AI features
- `FRONTEND_URL`: Your frontend URL (default: http://localhost:8080)

3. **Start MongoDB**
Make sure MongoDB is running locally or use MongoDB Atlas.

4. **Run the Server**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register a new user
- `POST /login` - Login user
- `GET /me` - Get current user (requires auth)
- `PUT /profile` - Update user profile (requires auth)
- `PUT /change-password` - Change password (requires auth)
- `POST /logout` - Logout user (requires auth)

### Courses (`/api/courses`)
- `GET /` - List all courses
- `POST /` - Create a new course (requires auth)
- `GET /:id` - Get course details
- `PUT /:id` - Update course (requires auth)
- `DELETE /:id` - Delete course (requires auth)

### Quizzes (`/api/quizzes`)
- `GET /` - List all quizzes
- `POST /` - Create a new quiz (requires auth)
- `GET /:id` - Get quiz details
- `POST /:id/submit` - Submit quiz answers (requires auth)

### Users (`/api/users`)
- `GET /progress` - Get user progress (requires auth)
- `PUT /progress` - Update user progress (requires auth)

## Tech Stack

- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **OpenAI API** - AI course generation
- **Helmet** - Security headers
- **Rate Limiting** - API protection

## Development

The backend uses:
- ESLint for code quality
- Morgan for request logging
- Compression for response optimization
- CORS for cross-origin requests

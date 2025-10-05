# AI Learning Platform

A full-stack learning platform with AI-powered course generation, built with React, TypeScript, and Node.js.

## Project Structure

```
├── src/                # Frontend React application
├── backend/           # Node.js/Express backend API
└── public/           # Static assets
```

## Frontend Setup

The frontend runs automatically in Lovable. Create a `.env` file in the root directory:

```
VITE_API_URL=http://localhost:5000/api
```

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from the example:
```bash
cp .env.example .env
```

4. Configure your environment variables in `backend/.env`:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string for JWT signing
   - `OPENAI_API_KEY`: Your OpenAI API key (optional, for AI features)
   - `FRONTEND_URL`: Set to your Lovable preview URL

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

## Features

- 🔐 User authentication (register, login, logout)
- 📚 Browse and enroll in courses
- 🤖 AI-powered course generation
- 📝 Interactive quizzes
- 📊 Progress tracking
- 🎯 Personalized learning paths

## API Documentation

See `backend/README.md` for detailed API documentation.

## Tech Stack

**Frontend:**
- React 18
- TypeScript
- Tailwind CSS
- React Router
- Shadcn UI Components

**Backend:**
- Node.js
- Express
- MongoDB
- JWT Authentication
- OpenAI API Integration

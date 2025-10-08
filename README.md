# AI-Powered Learning Management System 

An intelligent Learning Management System that enables users to create, manage, and take courses and quizzes with AI-powered content generation using Google's Gemini API.

## ✨ Features

### 🎯 Core Functionality
- **Smart Course Creation**: Create courses manually or let AI generate comprehensive course content
- **Intelligent Quiz System**: Build quizzes from scratch or use AI to generate questions based on course content
- **Progress Tracking**: Monitor learning progress with detailed analytics and statistics
- **User Management**: Secure authentication with role-based access control (Learner & Admin)
- **Interactive Learning**: Multiple lesson types (text, video, interactive) with bookmarks and notes

### 🤖 AI-Powered Features
- Automated course generation with customizable parameters
- Context-aware quiz generation with multiple question types
- Intelligent content structuring and validation
- Adaptive difficulty levels

### 📊 Progress & Analytics
- Course enrollment and completion tracking
- Lesson progress monitoring
- Quiz attempt history with detailed results
- Achievement system
- Study streak tracking
- Personal dashboard with statistics

## 🛠️ Technology Stack

### Backend
- **Node.js & Express.js** - Server and API
- **MongoDB & Mongoose** - Database and ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Request validation
- **Google Generative AI** - Gemini 2.5 Pro integration

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Radix UI** - Accessible component library
- **Tailwind CSS** - Styling
- **React Hook Form + Zod** - Form handling and validation
- **TanStack Query** - Data fetching and caching
- **React Router v6** - Routing
- **react-markdown** - Markdown rendering with syntax highlighting

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- Google Gemini API Key
- npm or yarn

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/KYkiran/SmartLearn-with-AI.git
cd SmartLearn-with-AI
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ai-lms

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# CORS
CORS_ORIGIN=http://localhost:5173
```

Start the backend server:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📁 Project Structure

```
SmartLearn-with-AI/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Request handlers
│   │   ├── models/           # Database models
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Custom middleware
│   │   ├── services/         # Business logic (AI service)
│   │   ├── utils/            # Utility functions
│   │   └── tests/            # Test files
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilities and helpers
│   │   └── styles/           # CSS styles
│   ├── .env
│   └── package.json
└── README.md
```

## 🔑 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123",
  "role": "learner"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Course Endpoints

#### Create Course (Manual)
```http
POST /api/courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Introduction to JavaScript",
  "description": "Learn JavaScript fundamentals",
  "subject": "Programming",
  "level": "beginner",
  "tags": ["javascript", "programming", "web-development"],
  "learningObjectives": ["Understand variables", "Learn functions"],
  "lessons": []
}
```

#### Generate Course (AI)
```http
POST /api/courses/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "topic": "Python Programming",
  "level": "beginner",
  "duration": 10,
  "learningObjectives": ["Learn Python basics", "Build simple programs"],
  "language": "en"
}
```

#### Get All Courses
```http
GET /api/courses?page=1&limit=10&level=beginner&sortBy=createdAt&sortOrder=desc
```

#### Get Course by ID
```http
GET /api/courses/:id
```

#### Update Course
```http
PUT /api/courses/:id
Authorization: Bearer <token>
Content-Type: application/json
```

#### Delete Course
```http
DELETE /api/courses/:id
Authorization: Bearer <token>
```

### Quiz Endpoints

#### Create Quiz (Manual)
```http
POST /api/quizzes
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "JavaScript Basics Quiz",
  "description": "Test your JavaScript knowledge",
  "course": "course_id",
  "timeLimit": 20,
  "passingScore": 70,
  "questions": [
    {
      "question": "What is a variable?",
      "type": "multiple-choice",
      "options": [
        {"text": "A container for data", "isCorrect": true},
        {"text": "A function", "isCorrect": false}
      ],
      "difficulty": "easy",
      "points": 1
    }
  ]
}
```

#### Generate Quiz (AI)
```http
POST /api/quizzes/generate
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": "course_id",
  "difficulty": "medium",
  "numQuestions": 10,
  "questionTypes": ["multiple-choice", "true-false"],
  "topics": ["variables", "functions"]
}
```

#### Submit Quiz Attempt
```http
POST /api/quizzes/:id/attempt
Authorization: Bearer <token>
Content-Type: application/json

{
  "answers": ["answer1", "answer2"],
  "timeSpent": 300,
  "startedAt": "2025-10-08T10:00:00Z"
}
```

#### Get Quiz Attempts
```http
GET /api/quizzes/:id/attempts
Authorization: Bearer <token>
```

#### Get Quiz Results
```http
GET /api/quizzes/:id/results
Authorization: Bearer <token>
```

### User Progress Endpoints

#### Get User Progress
```http
GET /api/users/progress
Authorization: Bearer <token>
```

#### Update Course Progress
```http
PUT /api/users/progress/:courseId
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in-progress",
  "progressPercentage": 50,
  "timeSpent": 120
}
```

#### Update Lesson Progress
```http
PUT /api/users/progress/:courseId/lesson
Authorization: Bearer <token>
Content-Type: application/json

{
  "lessonId": "lesson_id",
  "status": "completed",
  "timeSpent": 30
}
```

#### Get User Dashboard
```http
GET /api/users/dashboard
Authorization: Bearer <token>
```

## 🔒 Authentication & Authorization

### Authentication Flow
1. User registers or logs in
2. Server validates credentials and returns JWT token
3. Client stores token (localStorage/sessionStorage)
4. Client includes token in Authorization header for protected routes
5. Server validates token and grants access

### Authorization Levels
- **Public Routes**: Accessible without authentication
- **Protected Routes**: Require valid JWT token
- **Resource-Based**: Users can only modify their own content
- **Admin Routes**: Restricted to admin users only

### Middleware

#### `protect`
Verifies JWT token and attaches user to request

#### `optionalAuth`
Attaches user if token exists, but doesn't block access

#### `adminOnly`
Restricts access to admin users only

#### `checkResourceOwnership`
Ensures users can only modify resources they created

## 🤖 AI Integration

### Gemini Service

The system uses Google's Gemini 2.5 Pro model for content generation.

#### Course Generation
- Generates 5-8 structured lessons
- Creates comprehensive course descriptions
- Suggests prerequisites and learning objectives
- Ensures progressive difficulty
- Validates output structure

#### Quiz Generation
- Creates questions based on course content
- Supports multiple question types
- Adjusts difficulty appropriately
- Provides explanations for answers
- Calculates passing scores automatically

#### Rate Limiting
- Course generation: 5 requests per hour per user
- Quiz generation: 10 requests per hour per user

## 🧪 Testing

### Running Tests

```bash
cd backend
npm test
```

### Test Coverage
- **Integration Tests**: Auth, Courses, Quizzes
- **Test Database**: MongoDB Memory Server
- **Test Framework**: Jest with Supertest

### Test Files
- `auth.test.js` - Authentication endpoints
- `quizzes.test.js` - Quiz functionality
- `testDb.js` - Database setup and teardown

## 📊 Data Models

### User
- Basic information (name, email, password)
- Role-based permissions
- Learning preferences
- Account status

### Course
- Course metadata (title, description, subject)
- Difficulty level and tags
- Lessons with content and resources
- Creator reference
- Publishing status
- Rating system

### Quiz
- Quiz configuration (time limit, passing score)
- Questions with multiple types
- Attempt tracking
- Settings (shuffle, show answers)
- Association with course

### QuizAttempt
- User answers and correctness
- Score and percentage
- Time tracking
- Status (completed, abandoned)

### UserProgress
- Course enrollment status
- Lesson completion tracking
- Overall statistics
- Achievements
- Study streaks

## 🎨 UI Components

Built with Radix UI and Tailwind CSS for accessible, responsive design:

- **Forms**: Input, Select, Checkbox, Radio, Switch
- **Navigation**: Tabs, Accordion, Navigation Menu
- **Feedback**: Toast, Alert Dialog, Progress
- **Overlay**: Dialog, Popover, Tooltip, Dropdown Menu
- **Data Display**: Avatar, Badge, Card, Separator

## 🔄 State Management

- **TanStack Query**: Server state management with caching
- **React Hook Form**: Form state and validation
- **React Context**: Theme and auth state
- **Local State**: Component-specific state with useState/useReducer

## 🚦 Environment Variables

### Backend Variables
```env
PORT=5000
NODE_ENV=development|production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
JWT_EXPIRE=7d
GEMINI_API_KEY=your_gemini_api_key
CORS_ORIGIN=http://localhost:5173
```

### Frontend Variables
```env
VITE_API_URL=http://localhost:5000/api
```

## 📝 Getting Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Get API Key"
4. Create a new API key or use an existing one
5. Copy the key and add it to your `.env` file

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Known Issues

- Browser storage APIs (localStorage/sessionStorage) are not used in artifacts as per platform limitations
- All state is managed in-memory during sessions

## 📧 Support

For support, email support@example.com or open an issue in the repository.

## 🙏 Acknowledgments

- Google Gemini AI for powerful content generation
- Radix UI for accessible components
- The React and Node.js communities
- [Lovable.dev](https://lovable.dev/) for the whole Frontend UI

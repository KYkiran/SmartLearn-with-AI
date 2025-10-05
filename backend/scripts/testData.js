const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Quiz = require('../src/models/Quiz');
const UserProgress = require('../src/models/UserProgress');

async function createTestData() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to database');

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Quiz.deleteMany({});
    await UserProgress.deleteMany({});
    console.log('Cleared existing data');

    // Create test users
    const users = await createTestUsers();
    console.log('Created test users');

    // Create test courses
    const courses = await createTestCourses(users);
    console.log('Created test courses');

    // Create test quizzes
    const quizzes = await createTestQuizzes(users, courses);
    console.log('Created test quizzes');

    // Create test progress
    await createTestProgress(users, courses, quizzes);
    console.log('Created test progress');

    console.log('\n🎉 Test data created successfully!');
    console.log('\n📋 Test Accounts:');
    console.log('Admin: admin@test.com / Password123');
    console.log('Learner 1: john@test.com / Password123');
    console.log('Learner 2: jane@test.com / Password123');
    console.log('Learner 3: bob@test.com / Password123');

    process.exit(0);
  } catch (error) {
    console.error('Error creating test data:', error);
    process.exit(1);
  }
}

async function createTestUsers() {
  const users = [];

  // Admin user
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'Password123',
    role: 'admin',
    bio: 'System administrator with full access',
    isEmailVerified: true,
    preferences: {
      learningStyle: 'visual',
      difficultyLevel: 'advanced',
      subjects: ['Management', 'Technology', 'Education']
    }
  });
  users.push(admin);

  // Learner 1 - Course Creator
  const john = await User.create({
    name: 'John Doe',
    email: 'john@test.com',
    password: 'Password123',
    role: 'learner',
    bio: 'Full-stack developer and coding instructor',
    isEmailVerified: true,
    preferences: {
      learningStyle: 'hands-on',
      difficultyLevel: 'advanced',
      subjects: ['JavaScript', 'React', 'Node.js', 'Python']
    }
  });
  users.push(john);

  // Learner 2 - Course Creator  
  const jane = await User.create({
    name: 'Jane Smith',
    email: 'jane@test.com',
    password: 'Password123',
    role: 'learner',
    bio: 'Data scientist and AI enthusiast',
    isEmailVerified: true,
    preferences: {
      learningStyle: 'visual',
      difficultyLevel: 'intermediate',
      subjects: ['Python', 'Machine Learning', 'Data Science', 'Statistics']
    }
  });
  users.push(jane);

  // Learner 3 - Student
  const bob = await User.create({
    name: 'Bob Wilson',
    email: 'bob@test.com',
    password: 'Password123',
    role: 'learner',
    bio: 'Computer science student eager to learn',
    isEmailVerified: true,
    preferences: {
      learningStyle: 'reading',
      difficultyLevel: 'beginner',
      subjects: ['Programming', 'Web Development', 'Databases']
    }
  });
  users.push(bob);

  return users;
}

async function createTestCourses(users) {
  const [admin, john, jane, bob] = users;
  const courses = [];

  // Course 1 - JavaScript Fundamentals (by John)
  const jsCourse = await Course.create({
    title: 'JavaScript Fundamentals',
    description: 'Master the basics of JavaScript programming. Learn variables, functions, objects, and modern ES6+ features. Perfect for beginners starting their web development journey.',
    subject: 'Programming',
    level: 'beginner',
    tags: ['javascript', 'programming', 'web-development', 'beginner'],
    creator: john._id,
    isPublished: true,
    publishedAt: new Date(),
    prerequisites: ['Basic computer skills', 'Understanding of HTML/CSS'],
    learningObjectives: [
      'Understand JavaScript syntax and fundamentals',
      'Work with variables, data types, and operators',
      'Create and use functions effectively',
      'Manipulate objects and arrays',
      'Handle events and DOM manipulation'
    ],
    lessons: [
      {
        title: 'Introduction to JavaScript',
        content: 'JavaScript is a high-level, interpreted programming language that is one of the core technologies of the World Wide Web. It enables dynamic web pages and is an essential part of web applications. JavaScript can be used for client-side development in web browsers, server-side development with Node.js, mobile app development, and even desktop applications.',
        duration: 30,
        type: 'text',
        order: 1,
        resources: [
          { title: 'MDN JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', type: 'link' }
        ]
      },
      {
        title: 'Variables and Data Types',
        content: 'In JavaScript, variables are containers for storing data values. You can declare variables using var, let, or const keywords. JavaScript has several data types including numbers, strings, booleans, objects, and undefined. Understanding these fundamentals is crucial for writing effective JavaScript code.',
        duration: 45,
        type: 'text',
        order: 2,
        resources: [
          { title: 'JavaScript Data Types', url: 'https://www.w3schools.com/js/js_datatypes.asp', type: 'link' }
        ]
      },
      {
        title: 'Functions and Scope',
        content: 'Functions are blocks of code designed to perform particular tasks. They are executed when called (invoked). JavaScript functions can be declared in several ways and understanding scope (global vs local) is essential for writing clean, maintainable code.',
        duration: 50,
        type: 'text',
        order: 3
      },
      {
        title: 'Objects and Arrays',
        content: 'Objects and arrays are fundamental data structures in JavaScript. Objects store data in key-value pairs, while arrays store ordered lists of values. Mastering these concepts is essential for effective JavaScript programming.',
        duration: 40,
        type: 'text',
        order: 4
      }
    ],
    difficulty: 3,
    metadata: {
      estimatedCompletionTime: 3,
      targetAudience: 'Beginners to programming',
      language: 'en'
    }
  });
  courses.push(jsCourse);

  // Course 2 - Python Data Science (by Jane)
  const pythonCourse = await Course.create({
    title: 'Python for Data Science',
    description: 'Learn Python programming specifically for data science applications. Cover NumPy, Pandas, Matplotlib, and basic machine learning concepts using real-world datasets.',
    subject: 'Data Science',
    level: 'intermediate',
    tags: ['python', 'data-science', 'numpy', 'pandas', 'machine-learning'],
    creator: jane._id,
    isPublished: true,
    publishedAt: new Date(),
    prerequisites: ['Basic programming knowledge', 'High school mathematics'],
    learningObjectives: [
      'Master Python syntax for data analysis',
      'Use NumPy for numerical computing',
      'Manipulate data with Pandas',
      'Create visualizations with Matplotlib',
      'Implement basic machine learning algorithms'
    ],
    lessons: [
      {
        title: 'Python Basics for Data Science',
        content: 'Python is one of the most popular programming languages for data science due to its simplicity and powerful libraries. In this lesson, we cover Python fundamentals specifically relevant to data science: data types, control structures, and functions.',
        duration: 60,
        type: 'text',
        order: 1
      },
      {
        title: 'NumPy for Numerical Computing',
        content: 'NumPy (Numerical Python) is the foundation of the Python data science stack. It provides support for large multi-dimensional arrays and matrices, along with mathematical functions to operate on these arrays efficiently.',
        duration: 75,
        type: 'text',
        order: 2
      },
      {
        title: 'Data Manipulation with Pandas',
        content: 'Pandas is a powerful data manipulation and analysis library. It provides data structures like DataFrame and Series that make it easy to work with structured data, clean datasets, and perform complex data operations.',
        duration: 90,
        type: 'text',
        order: 3
      },
      {
        title: 'Data Visualization',
        content: 'Data visualization is crucial for understanding data patterns and communicating insights. Learn to create effective charts, plots, and graphs using Matplotlib and Seaborn libraries.',
        duration: 80,
        type: 'text',
        order: 4
      }
    ],
    difficulty: 6,
    metadata: {
      estimatedCompletionTime: 5,
      targetAudience: 'Aspiring data scientists',
      language: 'en'
    }
  });
  courses.push(pythonCourse);

  // Course 3 - React Essentials (by John)
  const reactCourse = await Course.create({
    title: 'React Essentials',
    description: 'Build modern web applications with React. Learn components, state management, hooks, and best practices for creating interactive user interfaces.',
    subject: 'Web Development',
    level: 'intermediate',
    tags: ['react', 'javascript', 'frontend', 'web-development', 'components'],
    creator: john._id,
    isPublished: true,
    publishedAt: new Date(),
    prerequisites: ['JavaScript fundamentals', 'HTML/CSS knowledge', 'ES6+ features'],
    learningObjectives: [
      'Understand React components and JSX',
      'Manage component state and props',
      'Use React hooks effectively',
      'Handle events and forms',
      'Build and deploy React applications'
    ],
    lessons: [
      {
        title: 'Introduction to React',
        content: 'React is a JavaScript library for building user interfaces, particularly web applications. Developed by Facebook, React allows developers to create reusable UI components and manage application state efficiently.',
        duration: 45,
        type: 'text',
        order: 1
      },
      {
        title: 'Components and JSX',
        content: 'React components are the building blocks of React applications. JSX is a syntax extension that allows you to write HTML-like code in JavaScript. Understanding components and JSX is fundamental to React development.',
        duration: 60,
        type: 'text',
        order: 2
      },
      {
        title: 'State and Props',
        content: 'State and props are core concepts in React. Props allow you to pass data between components, while state allows components to create and manage their own data that can change over time.',
        duration: 70,
        type: 'text',
        order: 3
      }
    ],
    difficulty: 5,
    metadata: {
      estimatedCompletionTime: 4,
      targetAudience: 'Web developers',
      language: 'en'
    }
  });
  courses.push(reactCourse);

  // Course 4 - Machine Learning Basics (by Jane)
  const mlCourse = await Course.create({
    title: 'Machine Learning Fundamentals',
    description: 'Introduction to machine learning concepts, algorithms, and practical applications. Learn supervised and unsupervised learning with hands-on examples.',
    subject: 'Machine Learning',
    level: 'intermediate',
    tags: ['machine-learning', 'ai', 'algorithms', 'python', 'data-science'],
    creator: jane._id,
    isPublished: true,
    publishedAt: new Date(),
    prerequisites: ['Python programming', 'Basic statistics', 'Linear algebra basics'],
    learningObjectives: [
      'Understand machine learning fundamentals',
      'Implement supervised learning algorithms',
      'Apply unsupervised learning techniques',
      'Evaluate model performance',
      'Use scikit-learn for ML tasks'
    ],
    lessons: [
      {
        title: 'What is Machine Learning?',
        content: 'Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions from data without being explicitly programmed. Explore different types of ML and real-world applications.',
        duration: 50,
        type: 'text',
        order: 1
      },
      {
        title: 'Supervised Learning',
        content: 'Supervised learning uses labeled data to train models that can make predictions on new, unseen data. Learn about classification and regression problems, and explore algorithms like linear regression and decision trees.',
        duration: 80,
        type: 'text',
        order: 2
      }
    ],
    difficulty: 7,
    metadata: {
      estimatedCompletionTime: 6,
      targetAudience: 'Data scientists and ML engineers',
      language: 'en'
    }
  });
  courses.push(mlCourse);

  return courses;
}

async function createTestQuizzes(users, courses) {
  const [admin, john, jane, bob] = users;
  const [jsCourse, pythonCourse, reactCourse, mlCourse] = courses;
  const quizzes = [];

  // Quiz 1 - JavaScript Basics Quiz
  const jsQuiz = await Quiz.create({
    title: 'JavaScript Fundamentals Quiz',
    description: 'Test your knowledge of JavaScript basics including variables, functions, and data types.',
    course: jsCourse._id,
    creator: john._id,
    isPublished: true,
    publishedAt: new Date(),
    timeLimit: 15,
    passingScore: 70,
    attempts: { allowed: 3 },
    questions: [
      {
        question: 'Which keyword is used to declare a variable in modern JavaScript?',
        type: 'multiple-choice',
        options: [
          { text: 'var', isCorrect: false },
          { text: 'let', isCorrect: true },
          { text: 'variable', isCorrect: false },
          { text: 'declare', isCorrect: false }
        ],
        explanation: 'let is the modern way to declare variables in JavaScript, providing block scope.',
        difficulty: 'easy',
        points: 1
      },
      {
        question: 'What data type is returned by typeof null?',
        type: 'multiple-choice',
        options: [
          { text: 'null', isCorrect: false },
          { text: 'undefined', isCorrect: false },
          { text: 'object', isCorrect: true },
          { text: 'string', isCorrect: false }
        ],
        explanation: 'This is a known quirk in JavaScript - typeof null returns "object".',
        difficulty: 'medium',
        points: 2
      },
      {
        question: 'JavaScript is a _____ language.',
        type: 'fill-blank',
        correctAnswer: 'programming',
        explanation: 'JavaScript is a programming language used primarily for web development.',
        difficulty: 'easy',
        points: 1
      },
      {
        question: 'Functions in JavaScript can be assigned to variables.',
        type: 'true-false',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        explanation: 'JavaScript functions are first-class objects and can be assigned to variables.',
        difficulty: 'medium',
        points: 1
      }
    ],
    settings: {
      shuffleQuestions: true,
      shuffleOptions: true,
      showCorrectAnswers: true,
      showScore: true,
      allowReview: true
    }
  });
  quizzes.push(jsQuiz);

  // Quiz 2 - Python Data Science Quiz
  const pythonQuiz = await Quiz.create({
    title: 'Python Data Science Basics',
    description: 'Test your understanding of Python libraries for data science: NumPy, Pandas, and basic concepts.',
    course: pythonCourse._id,
    creator: jane._id,
    isPublished: true,
    publishedAt: new Date(),
    timeLimit: 20,
    passingScore: 75,
    attempts: { allowed: 2 },
    questions: [
      {
        question: 'Which library is primarily used for numerical computing in Python?',
        type: 'multiple-choice',
        options: [
          { text: 'Pandas', isCorrect: false },
          { text: 'NumPy', isCorrect: true },
          { text: 'Matplotlib', isCorrect: false },
          { text: 'Scikit-learn', isCorrect: false }
        ],
        explanation: 'NumPy is the fundamental package for numerical computing in Python.',
        difficulty: 'easy',
        points: 1
      },
      {
        question: 'What is the main data structure in Pandas for handling tabular data?',
        type: 'multiple-choice',
        options: [
          { text: 'Array', isCorrect: false },
          { text: 'List', isCorrect: false },
          { text: 'DataFrame', isCorrect: true },
          { text: 'Matrix', isCorrect: false }
        ],
        explanation: 'DataFrame is the primary Pandas data structure for 2-dimensional labeled data.',
        difficulty: 'easy',
        points: 1
      },
      {
        question: 'NumPy arrays are more memory efficient than Python lists.',
        type: 'true-false',
        options: [
          { text: 'True', isCorrect: true },
          { text: 'False', isCorrect: false }
        ],
        explanation: 'NumPy arrays store data more efficiently and provide better performance than Python lists.',
        difficulty: 'medium',
        points: 2
      }
    ],
    settings: {
      shuffleQuestions: false,
      shuffleOptions: true,
      showCorrectAnswers: true,
      showScore: true,
      allowReview: true
    }
  });
  quizzes.push(pythonQuiz);

  // Quiz 3 - React Components Quiz
  const reactQuiz = await Quiz.create({
    title: 'React Components and State',
    description: 'Evaluate your knowledge of React components, JSX, state, and props.',
    course: reactCourse._id,
    creator: john._id,
    isPublished: true,
    publishedAt: new Date(),
    timeLimit: 18,
    passingScore: 80,
    attempts: { allowed: 3 },
    questions: [
      {
        question: 'What does JSX stand for?',
        type: 'multiple-choice',
        options: [
          { text: 'JavaScript XML', isCorrect: true },
          { text: 'Java Syntax Extension', isCorrect: false },
          { text: 'JavaScript Extension', isCorrect: false },
          { text: 'JSON XML', isCorrect: false }
        ],
        explanation: 'JSX stands for JavaScript XML and allows you to write HTML-like syntax in JavaScript.',
        difficulty: 'easy',
        points: 1
      },
      {
        question: 'Which hook is used to manage state in functional components?',
        type: 'multiple-choice',
        options: [
          { text: 'useEffect', isCorrect: false },
          { text: 'useState', isCorrect: true },
          { text: 'useContext', isCorrect: false },
          { text: 'useReducer', isCorrect: false }
        ],
        explanation: 'useState is the primary hook for managing state in React functional components.',
        difficulty: 'medium',
        points: 2
      }
    ],
    settings: {
      shuffleQuestions: true,
      shuffleOptions: true,
      showCorrectAnswers: true,
      showScore: true,
      allowReview: true
    }
  });
  quizzes.push(reactQuiz);

  return quizzes;
}

async function createTestProgress(users, courses, quizzes) {
  const [admin, john, jane, bob] = users;
  const [jsCourse, pythonCourse, reactCourse, mlCourse] = courses;
  const [jsQuiz, pythonQuiz, reactQuiz] = quizzes;

  // Create progress for Bob (student)
  const bobProgress = await UserProgress.create({
    user: bob._id,
    courses: [
      {
        course: jsCourse._id,
        status: 'in-progress',
        enrolledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        startedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastAccessedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        progressPercentage: 75,
        totalTimeSpent: 180, // 3 hours
        lessonsProgress: [
          {
            lesson: jsCourse.lessons[0]._id,
            status: 'completed',
            timeSpent: 35,
            completedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            lastAccessedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
          },
          {
            lesson: jsCourse.lessons[1]._id,
            status: 'completed',
            timeSpent: 50,
            completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            lastAccessedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          },
          {
            lesson: jsCourse.lessons[2]._id,
            status: 'completed',
            timeSpent: 55,
            completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            lastAccessedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          },
          {
            lesson: jsCourse.lessons[3]._id,
            status: 'in-progress',
            timeSpent: 20,
            lastAccessedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          }
        ],
        quizAttempts: [
          {
            quiz: jsQuiz._id,
            answers: ['let', 'object', 'programming', 'True'],
            score: {
              points: 5,
              percentage: 100,
              passed: true
            },
            timeSpent: 12,
            startedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            status: 'completed'
          }
        ],
        notes: [
          {
            lesson: jsCourse.lessons[1]._id,
            content: 'Remember: let and const have block scope, var has function scope',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
          }
        ],
        bookmarks: [
          {
            lesson: jsCourse.lessons[2]._id,
            timestamp: 0,
            note: 'Important function concepts section',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
          }
        ]
      },
      {
        course: pythonCourse._id,
        status: 'enrolled',
        enrolledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        lastAccessedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        progressPercentage: 0,
        totalTimeSpent: 0,
        lessonsProgress: [],
        quizAttempts: []
      }
    ],
    overallStats: {
      totalCoursesEnrolled: 2,
      totalCoursesCompleted: 0,
      totalTimeSpent: 180,
      totalQuizzesTaken: 1,
      averageQuizScore: 100,
      streakDays: 3,
      lastStudyDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    achievements: [
      {
        type: 'first-course',
        earnedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        type: 'quiz-master',
        earnedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      }
    ]
  });

  // Create progress for Jane (some courses taken by other creators)
  const janeProgress = await UserProgress.create({
    user: jane._id,
    courses: [
      {
        course: jsCourse._id,
        status: 'completed',
        enrolledAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        lastAccessedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        progressPercentage: 100,
        totalTimeSpent: 200,
        lessonsProgress: jsCourse.lessons.map((lesson, index) => ({
          lesson: lesson._id,
          status: 'completed',
          timeSpent: 45 + index * 5,
          completedAt: new Date(Date.now() - (9 - index) * 24 * 60 * 60 * 1000),
          lastAccessedAt: new Date(Date.now() - (9 - index) * 24 * 60 * 60 * 1000)
        })),
        quizAttempts: [
          {
            quiz: jsQuiz._id,
            answers: ['let', 'object', 'programming', 'True'],
            score: {
              points: 5,
              percentage: 100,
              passed: true
            },
            timeSpent: 10,
            startedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
            status: 'completed'
          }
        ]
      }
    ],
    overallStats: {
      totalCoursesEnrolled: 1,
      totalCoursesCompleted: 1,
      totalTimeSpent: 200,
      totalQuizzesTaken: 1,
      averageQuizScore: 100,
      streakDays: 1,
      lastStudyDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    },
    achievements: [
      {
        type: 'first-course',
        earnedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
      },
      {
        type: 'course-completed',
        earnedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      }
    ]
  });

  console.log('Created user progress records');
}

// Run the script
createTestData();

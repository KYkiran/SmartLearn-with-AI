import { Course, DailyActivity, UserProgress } from "@/types/course";

// Mock data generator for courses
export const generateMockCourse = (topic: string): Course => {
  const modules = [
    {
      id: "1",
      title: `Introduction to ${topic}`,
      content: `Welcome to your comprehensive course on ${topic}. In this module, we'll cover the fundamentals and give you a strong foundation to build upon.`,
      completed: false,
      duration: 15,
    },
    {
      id: "2",
      title: `Core Concepts of ${topic}`,
      content: `Now that you understand the basics, let's dive deeper into the core concepts that make ${topic} so important and useful in today's world.`,
      completed: false,
      duration: 25,
    },
    {
      id: "3",
      title: `Practical Applications`,
      content: `Learn how to apply ${topic} in real-world scenarios. We'll explore various use cases and practical examples.`,
      completed: false,
      duration: 30,
    },
    {
      id: "4",
      title: `Advanced Techniques`,
      content: `Master advanced techniques and best practices in ${topic}. This module will take your skills to the next level.`,
      completed: false,
      duration: 35,
    },
    {
      id: "5",
      title: `Final Project and Summary`,
      content: `Apply everything you've learned in a comprehensive final project. We'll also review key concepts and discuss next steps.`,
      completed: false,
      duration: 40,
    },
  ];

  const quizzes = modules.map((module) => ({
    id: `quiz-${module.id}`,
    moduleId: module.id,
    completed: false,
    questions: [
      {
        id: `q1-${module.id}`,
        question: `What is the main focus of ${module.title}?`,
        options: [
          "Understanding basic concepts",
          "Practical implementation",
          "Advanced optimization",
          "Historical context",
        ],
        correctAnswer: 1,
      },
      {
        id: `q2-${module.id}`,
        question: `Which approach is most effective for learning ${topic}?`,
        options: [
          "Theory only",
          "Practice only",
          "Balanced theory and practice",
          "Memorization",
        ],
        correctAnswer: 2,
      },
      {
        id: `q3-${module.id}`,
        question: `What is a key benefit of mastering ${topic}?`,
        options: [
          "Career advancement",
          "Personal growth",
          "Problem-solving skills",
          "All of the above",
        ],
        correctAnswer: 3,
      },
    ],
  }));

  return {
    id: Math.random().toString(36).substr(2, 9),
    title: `Complete Guide to ${topic}`,
    description: `Master ${topic} with this comprehensive AI-generated course covering fundamentals to advanced concepts.`,
    modules,
    quizzes,
    totalTime: 0,
    progress: 0,
    createdAt: new Date(),
  };
};

// Generate mock daily activities
export const generateMockDailyActivities = (): DailyActivity[] => {
  const activities: DailyActivity[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    activities.push({
      date: date.toISOString().split("T")[0],
      minutes: Math.floor(Math.random() * 120),
      quizzesTaken: Math.floor(Math.random() * 5),
    });
  }

  return activities;
};

// Calculate streak from daily activities
export const calculateStreak = (activities: DailyActivity[]): number => {
  let streak = 0;
  const today = new Date().toISOString().split("T")[0];

  for (let i = activities.length - 1; i >= 0; i--) {
    if (activities[i].minutes > 0) {
      streak++;
    } else if (activities[i].date !== today) {
      break;
    }
  }

  return streak;
};

// Popular course topics
export const popularTopics = [
  {
    title: "Web Development",
    icon: "💻",
    description: "Learn HTML, CSS, JavaScript and modern frameworks",
  },
  {
    title: "Data Science",
    icon: "📊",
    description: "Master data analysis, ML, and statistical methods",
  },
  {
    title: "Digital Marketing",
    icon: "📱",
    description: "Social media, SEO, and content marketing strategies",
  },
  {
    title: "Graphic Design",
    icon: "🎨",
    description: "UI/UX, visual design, and creative tools",
  },
  {
    title: "Business Strategy",
    icon: "💼",
    description: "Leadership, management, and strategic planning",
  },
  {
    title: "Photography",
    icon: "📷",
    description: "Camera techniques, composition, and editing",
  },
];

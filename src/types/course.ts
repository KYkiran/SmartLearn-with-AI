export interface Module {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  duration: number; // in minutes
}

export interface Quiz {
  id: string;
  moduleId: string;
  questions: Question[];
  score?: number;
  completed: boolean;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer?: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  quizzes: Quiz[];
  totalTime: number; // in minutes
  progress: number; // percentage
  createdAt: Date;
}

export interface DailyActivity {
  date: string;
  minutes: number;
  quizzesTaken: number;
}

export interface UserProgress {
  courses: Course[];
  dailyActivities: DailyActivity[];
  totalMinutes: number;
  streak: number;
}

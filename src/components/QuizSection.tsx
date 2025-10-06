// frontend/src/components/QuizSection.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Clock, 
  Trophy, 
  CheckCircle, 
  X, 
  Play, 
  RotateCcw,
  Sparkles,
  BookOpen,
  Target,
  Star
} from "lucide-react";
import { quizService } from "@/services/quizService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface QuizSectionProps {
  courseId: string;
  currentLesson?: any;
}

export function QuizSection({ courseId, currentLesson }: QuizSectionProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [lessonQuizzes, setLessonQuizzes] = useState<any[]>([]);
  const [courseQuiz, setCourseQuiz] = useState<any>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    fetchQuizzes();
    if (user) {
      fetchResults();
    }
  }, [courseId, user]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await quizService.getCourseQuizzes(courseId);
      
      if (response.success && response.data?.quizzes) {
        const allQuizzes = response.data.quizzes;
        setQuizzes(allQuizzes);
        
        // Separate lesson quizzes and course quiz
        const lessonQuizList = allQuizzes.filter((q: any) => q.quizType === 'lesson');
        const finalQuiz = allQuizzes.find((q: any) => q.quizType === 'course');
        
        setLessonQuizzes(lessonQuizList);
        setCourseQuiz(finalQuiz);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    try {
      const response = await quizService.getQuizResults(courseId);
      if (response.success) {
        setResults(response.data);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  };

  const generateLessonQuiz = async () => {
    if (!currentLesson) {
      toast.error("No lesson selected");
      return;
    }

    try {
      const response = await quizService.generateLessonQuiz({
        courseId,
        lessonId: currentLesson._id,
        difficulty: 'medium',
        numQuestions: 5
      });

      if (response.success) {
        toast.success("Lesson quiz generated!");
        fetchQuizzes();
      } else {
        toast.error(response.message || "Failed to generate quiz");
      }
    } catch (error) {
      console.error("Error generating lesson quiz:", error);
      toast.error("Failed to generate lesson quiz");
    }
  };

  const generateCourseQuiz = async () => {
    try {
      const response = await quizService.generateCourseQuiz({
        courseId,
        difficulty: 'medium',
        numQuestions: 15
      });

      if (response.success) {
        toast.success("Final course quiz generated!");
        fetchQuizzes();
      } else {
        toast.error(response.message || "Failed to generate quiz");
      }
    } catch (error) {
      console.error("Error generating course quiz:", error);
      toast.error("Failed to generate course quiz");
    }
  };

  const startQuiz = (quiz: any) => {
    setSelectedQuiz(quiz);
    setAnswers(new Array(quiz.questions.length).fill(""));
    setCurrentQuestion(0);
    setQuizStarted(true);
    setQuizCompleted(false);
    setQuizResult(null);
    setStartTime(new Date());

    if (quiz.timeLimit) {
      setTimeRemaining(quiz.timeLimit * 60);
    }

    toast.success("Quiz started! Good luck!");
  };

  const submitQuiz = async () => {
    if (!selectedQuiz || !startTime) return;

    try {
      const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000 / 60);
      
      const response = await quizService.submitQuizAttempt(selectedQuiz._id, {
        answers,
        timeSpent,
        startedAt: startTime.toISOString()
      });

      if (response.success) {
        setQuizResult(response.data);
        setQuizCompleted(true);
        setQuizStarted(false);
        fetchResults(); // Refresh results
        toast.success(`Quiz completed! Score: ${response.data?.result?.percentage || 0}%`);
      } else {
        toast.error(response.message || "Failed to submit quiz");
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz");
    }
  };

  const resetQuiz = () => {
    setSelectedQuiz(null);
    setCurrentQuestion(0);
    setAnswers([]);
    setQuizStarted(false);
    setQuizCompleted(false);
    setQuizResult(null);
    setTimeRemaining(null);
    setStartTime(null);
  };

  const getQuizStatus = (quiz: any) => {
    if (!results) return null;
    
    const attempts = quiz.quizType === 'lesson' 
      ? results.lessonQuizzes.filter((a: any) => a.quiz._id === quiz._id)
      : quiz.quizType === 'course' && results.courseQuiz && results.courseQuiz.quiz._id === quiz._id
        ? [results.courseQuiz]
        : [];

    if (attempts.length === 0) return null;

    const bestAttempt = attempts.reduce((best: any, current: any) => 
      current.score.percentage > best.score.percentage ? current : best
    );

    return {
      attempts: attempts.length,
      bestScore: bestAttempt.score.percentage,
      passed: bestAttempt.score.passed,
      remaining: quiz.attempts.allowed - attempts.length
    };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Quiz Taking Interface (same as before but with better UX)
  if (quizStarted && selectedQuiz) {
    const currentQ = selectedQuiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / selectedQuiz.questions.length) * 100;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedQuiz.quizType === 'lesson' && <BookOpen className="h-5 w-5" />}
                  {selectedQuiz.quizType === 'course' && <Trophy className="h-5 w-5" />}
                  {selectedQuiz.title}
                </CardTitle>
                <CardDescription>
                  Question {currentQuestion + 1} of {selectedQuiz.questions.length}
                </CardDescription>
              </div>
              {timeRemaining !== null && (
                <div className={`text-lg font-mono ${timeRemaining < 300 ? 'text-red-500' : ''}`}>
                  <Clock className="h-4 w-4 inline mr-1" />
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{currentQ.question}</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline">{currentQ.type}</Badge>
              <Badge variant="secondary">{currentQ.difficulty}</Badge>
              <Badge variant="outline">{currentQ.points} points</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Question rendering logic same as before */}
            {/* ... */}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={resetQuiz}>
              Exit Quiz
            </Button>
            
            {currentQuestion === selectedQuiz.questions.length - 1 ? (
              <Button onClick={submitQuiz}>
                Submit Quiz
              </Button>
            ) : (
              <Button onClick={() => setCurrentQuestion(prev => prev + 1)}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="lesson" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lesson">Lesson Quizzes</TabsTrigger>
          <TabsTrigger value="final">Final Assessment</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        {/* Lesson Quizzes Tab */}
        <TabsContent value="lesson" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Lesson Quizzes</h3>
              <p className="text-sm text-muted-foreground">
                Test your understanding after each lesson
              </p>
            </div>
            {user && currentLesson && (
              <Button onClick={generateLessonQuiz}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Quiz for This Lesson
              </Button>
            )}
          </div>

          {lessonQuizzes.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Lesson Quizzes Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Generate quizzes for individual lessons to test understanding
                </p>
                {user && currentLesson && (
                  <Button onClick={generateLessonQuiz}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Quiz for Current Lesson
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {lessonQuizzes.map((quiz) => {
                const status = getQuizStatus(quiz);
                return (
                  <Card key={quiz._id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            {quiz.title}
                            {quiz.aiGenerated && (
                              <Badge variant="gradient" className="text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{quiz.description}</CardDescription>
                          
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">
                              {quiz.questions.length} questions
                            </Badge>
                            <Badge variant="outline">
                              {quiz.totalPoints} points
                            </Badge>
                            {quiz.timeLimit && (
                              <Badge variant="outline">
                                <Clock className="h-3 w-3 mr-1" />
                                {quiz.timeLimit} min
                              </Badge>
                            )}
                            <Badge variant="secondary">
                              Pass: {quiz.passingScore}%
                            </Badge>
                          </div>

                          {status && (
                            <div className="mt-2 flex items-center gap-2">
                              {status.passed ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm">
                                Best: {status.bestScore}% ({status.attempts}/{quiz.attempts.allowed} attempts)
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {user ? (
                            <Button 
                              onClick={() => startQuiz(quiz)}
                              disabled={status && status.remaining <= 0}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              {status && status.remaining <= 0 ? 'No attempts left' : 'Start Quiz'}
                            </Button>
                          ) : (
                            <Button onClick={() => navigate('/login')}>
                              Login to Take Quiz
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Final Assessment Tab */}
        <TabsContent value="final" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Final Assessment</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive quiz covering the entire course
              </p>
            </div>
            {user && !courseQuiz && (
              <Button onClick={generateCourseQuiz}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Final Quiz
              </Button>
            )}
          </div>

          {!courseQuiz ? (
            <Card>
              <CardContent className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Final Assessment Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Generate a comprehensive quiz to test your complete understanding of the course
                </p>
                {user && (
                  <Button onClick={generateCourseQuiz}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Final Assessment
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      {courseQuiz.title}
                      {courseQuiz.aiGenerated && (
                        <Badge variant="gradient" className="text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{courseQuiz.description}</CardDescription>
                    
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">
                        {courseQuiz.questions.length} questions
                      </Badge>
                      <Badge variant="outline">
                        {courseQuiz.totalPoints} points
                      </Badge>
                      {courseQuiz.timeLimit && (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {courseQuiz.timeLimit} min
                        </Badge>
                      )}
                      <Badge variant="destructive">
                        Pass: {courseQuiz.passingScore}%
                      </Badge>
                    </div>

                    {(() => {
                      const status = getQuizStatus(courseQuiz);
                      return status && (
                        <div className="mt-2 flex items-center gap-2">
                          {status.passed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            Best: {status.bestScore}% ({status.attempts}/{courseQuiz.attempts.allowed} attempts)
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex gap-2">
                    {user ? (
                      <Button 
                        onClick={() => startQuiz(courseQuiz)}
                        disabled={(() => {
                          const status = getQuizStatus(courseQuiz);
                          return status && status.remaining <= 0;
                        })()}
                        size="lg"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {(() => {
                          const status = getQuizStatus(courseQuiz);
                          return status && status.remaining <= 0 ? 'No attempts left' : 'Start Final Assessment';
                        })()}
                      </Button>
                    ) : (
                      <Button onClick={() => navigate('/login')} size="lg">
                        Login to Take Assessment
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          {!user ? (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Login to View Results</h3>
                <p className="text-muted-foreground mb-4">
                  Sign in to track your quiz performance and progress
                </p>
                <Button onClick={() => navigate('/login')}>
                  Login
                </Button>
              </CardContent>
            </Card>
          ) : !results ? (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Results Yet</h3>
                <p className="text-muted-foreground">
                  Take some quizzes to see your results here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{results.summary.totalAttempts}</div>
                      <div className="text-sm text-muted-foreground">Total Attempts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">{results.summary.passed}</div>
                      <div className="text-sm text-muted-foreground">Quizzes Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">{results.summary.averageScore}%</div>
                      <div className="text-sm text-muted-foreground">Average Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Final Assessment Result */}
              {results.courseQuiz && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Final Assessment Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">
                          {results.courseQuiz.score.percentage}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {results.courseQuiz.score.points} / {results.courseQuiz.quiz.totalPoints} points
                        </div>
                      </div>
                      <div className="text-right">
                        {results.courseQuiz.score.passed ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Passed
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <X className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          Required: {results.courseQuiz.quiz.passingScore}%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lesson Quiz Results */}
              {results.lessonQuizzes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Lesson Quiz Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {results.lessonQuizzes.map((attempt: any) => (
                        <div key={attempt._id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{attempt.quiz.title}</h4>
                            <div className="text-sm text-muted-foreground">
                              {new Date(attempt.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">
                              {attempt.score.percentage}%
                            </div>
                            {attempt.score.passed ? (
                              <Badge variant="default" className="bg-green-500 text-xs">
                                Passed
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs">
                                Failed
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

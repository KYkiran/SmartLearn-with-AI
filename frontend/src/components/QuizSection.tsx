// frontend/src/components/QuizSection.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { 
  Clock, 
  Trophy, 
  CheckCircle, 
  X, 
  Play, 
  RotateCcw,
  Edit,
  Trash2,
  PlusCircle,
  Sparkles
} from "lucide-react";
import { quizService, Quiz, QuizAttempt } from "@/services/quizService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface QuizSectionProps {
  courseId: string;
}

export function QuizSection({ courseId }: QuizSectionProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, [courseId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (quizStarted && timeRemaining !== null && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            handleSubmitQuiz(); // Auto-submit when time runs out
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizStarted, timeRemaining]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await quizService.getQuizzes({ course: courseId });
      
      if (response.success && response.data?.quizzes) {
        setQuizzes(response.data.quizzes);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast.error("Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (quiz: Quiz) => {
    try {
      const response = await quizService.getQuiz(quiz._id);
      
      if (response.success && response.data?.quiz) {
        setSelectedQuiz(response.data.quiz);
        setAnswers(new Array(response.data.quiz.questions.length).fill(""));
        setCurrentQuestion(0);
        setQuizStarted(true);
        setQuizCompleted(false);
        setQuizResult(null);
        setStartTime(new Date());
        
        if (quiz.timeLimit) {
          setTimeRemaining(quiz.timeLimit * 60); // Convert minutes to seconds
        }
        
        toast.success("Quiz started! Good luck!");
      }
    } catch (error) {
      console.error("Error starting quiz:", error);
      toast.error("Failed to start quiz");
    }
  };

  const handleAnswerChange = (questionIndex: number, answer: any) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answer;
    setAnswers(newAnswers);
  };

  const nextQuestion = () => {
    if (selectedQuiz && currentQuestion < selectedQuiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!selectedQuiz || !startTime) return;

    try {
      const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000 / 60); // in minutes
      
      const response = await quizService.submitQuizAttempt(selectedQuiz._id, {
        answers,
        timeSpent,
        startedAt: startTime.toISOString()
      });

      if (response.success) {
        setQuizResult(response.data);
        setQuizCompleted(true);
        setQuizStarted(false);
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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const canEditQuiz = (quiz: Quiz) => {
    return user && (user.role === 'admin' || quiz.creator._id === user.id);
  };

  const handleEditQuiz = (quizId: string) => {
    navigate(`/quizzes/${quizId}/edit`);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) return;

    try {
      const response = await quizService.deleteQuiz(quizId);
      if (response.success) {
        toast.success("Quiz deleted successfully");
        fetchQuizzes(); // Refresh the list
      } else {
        toast.error(response.message || "Failed to delete quiz");
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz");
    }
  };

  const handleCreateQuiz = () => {
    navigate(`/courses/${courseId}/create-quiz`);
  };

  const handleGenerateQuiz = () => {
    navigate(`/courses/${courseId}/generate-quiz`);
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

  // Quiz Taking Interface
  if (quizStarted && selectedQuiz) {
    const currentQ = selectedQuiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / selectedQuiz.questions.length) * 100;

    return (
      <div className="space-y-6">
        {/* Quiz Header */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{selectedQuiz.title}</CardTitle>
                <CardDescription>
                  Question {currentQuestion + 1} of {selectedQuiz.questions.length}
                </CardDescription>
              </div>
              <div className="text-right">
                {timeRemaining !== null && (
                  <div className={`text-lg font-mono ${timeRemaining < 300 ? 'text-red-500' : ''}`}>
                    <Clock className="h-4 w-4 inline mr-1" />
                    {formatTime(timeRemaining)}
                  </div>
                )}
              </div>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
        </Card>

        {/* Current Question */}
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
            {currentQ.type === 'multiple-choice' && currentQ.options && (
              <RadioGroup
                value={answers[currentQuestion] || ""}
                onValueChange={(value) => handleAnswerChange(currentQuestion, value)}
              >
                {currentQ.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.text} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQ.type === 'true-false' && currentQ.options && (
              <RadioGroup
                value={answers[currentQuestion] || ""}
                onValueChange={(value) => handleAnswerChange(currentQuestion, value)}
              >
                {currentQ.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.text} id={`tf-${index}`} />
                    <Label htmlFor={`tf-${index}`} className="cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQ.type === 'fill-blank' && (
              <Input
                value={answers[currentQuestion] || ""}
                onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                placeholder="Enter your answer"
                className="max-w-md"
              />
            )}

            {currentQ.type === 'essay' && (
              <Textarea
                value={answers[currentQuestion] || ""}
                onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                placeholder="Write your essay response"
                rows={6}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={previousQuestion}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={resetQuiz}>
              Exit Quiz
            </Button>
            
            {currentQuestion === selectedQuiz.questions.length - 1 ? (
              <Button onClick={handleSubmitQuiz}>
                Submit Quiz
              </Button>
            ) : (
              <Button onClick={nextQuestion}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz Results Interface
  if (quizCompleted && quizResult) {
    const { result, passed, correctAnswers } = quizResult.data || {};
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {passed ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <X className="h-6 w-6 text-red-500" />
              )}
              Quiz {passed ? 'Completed' : 'Failed'}
            </CardTitle>
            <CardDescription>
              {selectedQuiz?.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-4xl font-bold">
              {result?.percentage || 0}%
            </div>
            <div className="text-muted-foreground">
              {result?.score || 0} out of {result?.totalPossible || 0} points
            </div>
            <div className={`text-lg font-medium ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {passed ? 'Congratulations! You passed!' : `Passing score: ${selectedQuiz?.passingScore || 70}%`}
            </div>
          </CardContent>
        </Card>

        {correctAnswers && selectedQuiz?.settings.showCorrectAnswers && (
          <Card>
            <CardHeader>
              <CardTitle>Answer Review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedQuiz.questions.map((question, index) => {
                const correctAnswer = correctAnswers.find((ca: any) => ca.questionId === question._id);
                const userAnswer = answers[index];
                const isCorrect = correctAnswer && userAnswer === correctAnswer.correctAnswer;

                return (
                  <div key={question._id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-2">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-red-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{question.question}</h4>
                        <div className="mt-2 space-y-1 text-sm">
                          <div>
                            <span className="font-medium">Your answer: </span>
                            <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                              {userAnswer || 'No answer'}
                            </span>
                          </div>
                          {!isCorrect && correctAnswer && (
                            <div>
                              <span className="font-medium">Correct answer: </span>
                              <span className="text-green-600">{correctAnswer.correctAnswer}</span>
                            </div>
                          )}
                          {correctAnswer?.explanation && (
                            <div className="text-muted-foreground">
                              <span className="font-medium">Explanation: </span>
                              {correctAnswer.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={resetQuiz}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Back to Quizzes
          </Button>
          <Button onClick={() => navigate(`/quizzes/${selectedQuiz?._id}/results`)}>
            <Trophy className="h-4 w-4 mr-2" />
            View Detailed Results
          </Button>
        </div>
      </div>
    );
  }

  // Quiz List Interface
  return (
    <div className="space-y-6">
      {/* Create Quiz Actions - Available to all learners */}
      {user && (
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleCreateQuiz}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Quiz
          </Button>
          <Button variant="gradient" onClick={handleGenerateQuiz}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate with AI
          </Button>
        </div>
      )}

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Quizzes Available</h3>
            <p className="text-muted-foreground mb-4">
              There are no quizzes for this course yet.
            </p>
            {user && (
              <div className="flex gap-2 justify-center">
                <Button onClick={handleCreateQuiz}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create First Quiz
                </Button>
                <Button variant="outline" onClick={handleGenerateQuiz}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate with AI
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz) => (
            <Card key={quiz._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
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
                  </div>

                  <div className="flex gap-2">
                    {canEditQuiz(quiz) && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditQuiz(quiz._id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteQuiz(quiz._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {user ? (
                      <Button 
                        onClick={() => startQuiz(quiz)}
                        disabled={quiz.attempts.current >= quiz.attempts.allowed}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {quiz.attempts.current >= quiz.attempts.allowed ? 'No attempts left' : 'Start Quiz'}
                      </Button>
                    ) : (
                      <Button onClick={() => navigate('/login')}>
                        Login to Take Quiz
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {quiz.attempts.current > 0 && (
                <CardContent className="pt-0">
                  <div className="text-sm text-muted-foreground">
                    Attempts: {quiz.attempts.current}/{quiz.attempts.allowed}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

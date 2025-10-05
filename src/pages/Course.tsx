import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseProgress } from "@/components/CourseProgress";
import { QuizSection } from "@/components/QuizSection";
import { generateMockCourse } from "@/utils/mockData";
import { Course as CourseType } from "@/types/course";
import { BookOpen, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Course() {
  const { topic } = useParams<{ topic: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseType | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    if (topic) {
      const generatedCourse = generateMockCourse(decodeURIComponent(topic));
      setCourse(generatedCourse);
      setActiveModuleId(generatedCourse.modules[0].id);
      toast.success("Course generated successfully!");
    }
  }, [topic]);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Generating your course...</p>
        </div>
      </div>
    );
  }

  const activeModule = course.modules.find((m) => m.id === activeModuleId);
  const activeQuiz = course.quizzes.find((q) => q.moduleId === activeModuleId);

  const handleCompleteModule = () => {
    if (!activeModule) return;

    setCourse((prev) => {
      if (!prev) return prev;
      const updatedModules = prev.modules.map((m) =>
        m.id === activeModuleId ? { ...m, completed: true } : m
      );
      const newTotalTime = prev.totalTime + activeModule.duration;
      const completedCount = updatedModules.filter((m) => m.completed).length;
      const newProgress = (completedCount / updatedModules.length) * 100;

      return {
        ...prev,
        modules: updatedModules,
        totalTime: newTotalTime,
        progress: newProgress,
      };
    });

    toast.success("Module completed!");
    setShowQuiz(true);
  };

  const handleQuizComplete = (score: number) => {
    setCourse((prev) => {
      if (!prev) return prev;
      const updatedQuizzes = prev.quizzes.map((q) =>
        q.moduleId === activeModuleId ? { ...q, completed: true, score } : q
      );
      return { ...prev, quizzes: updatedQuizzes };
    });

    toast.success(`Quiz completed with ${Math.round(score)}% score!`);

    // Move to next module if available
    const currentIndex = course.modules.findIndex((m) => m.id === activeModuleId);
    if (currentIndex < course.modules.length - 1) {
      setActiveModuleId(course.modules[currentIndex + 1].id);
      setShowQuiz(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div>
            <h1 className="text-4xl font-bold mb-2">{course.title}</h1>
            <p className="text-muted-foreground text-lg">{course.description}</p>
          </div>

          <div className="flex gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {course.modules.length} Modules
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {course.modules.reduce((acc, m) => acc + m.duration, 0)} min total
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={showQuiz ? "quiz" : "content"} onValueChange={(v) => setShowQuiz(v === "quiz")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Module Content</TabsTrigger>
                <TabsTrigger value="quiz" disabled={!activeModule?.completed}>
                  Quiz
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-6">
                {/* Module Selector */}
                <Card>
                  <CardHeader>
                    <CardTitle>Course Modules</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {course.modules.map((module, idx) => (
                      <button
                        key={module.id}
                        onClick={() => {
                          setActiveModuleId(module.id);
                          setShowQuiz(false);
                        }}
                        className={`w-full text-left p-4 rounded-lg border transition-all ${
                          activeModuleId === module.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium flex-shrink-0">
                            {module.completed ? <CheckCircle className="h-5 w-5" /> : idx + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{module.title}</h4>
                            <p className="text-sm text-muted-foreground">{module.duration} minutes</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                {/* Active Module Content */}
                {activeModule && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{activeModule.title}</CardTitle>
                      <CardDescription>{activeModule.duration} minute read</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p className="text-foreground leading-relaxed">{activeModule.content}</p>
                      </div>

                      {!activeModule.completed && (
                        <Button onClick={handleCompleteModule} className="w-full" size="lg" variant="gradient">
                          Complete Module & Take Quiz
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="quiz">
                {activeQuiz && <QuizSection quiz={activeQuiz} onComplete={handleQuizComplete} />}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <CourseProgress modules={course.modules} totalTime={course.totalTime} />
          </div>
        </div>
      </div>
    </div>
  );
}

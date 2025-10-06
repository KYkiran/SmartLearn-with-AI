// frontend/src/pages/Course.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Clock, 
  BookOpen, 
  User, 
  Play, 
  CheckCircle, 
  Star,
  Edit,
  Trash2,
  PlusCircle,
  Share2
} from "lucide-react";
import { courseService, Course } from "@/services/courseService";
import { userService } from "@/services/userService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { QuizSection } from "@/components/QuizSection";
import { CourseProgress } from "@/components/CourseProgress";

// Import syntax highlighting CSS
import 'highlight.js/styles/github.css'; // You can choose different themes

export function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [userProgress, setUserProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentLesson, setCurrentLesson] = useState(0);

  useEffect(() => {
    if (id) {
      fetchCourse();
    }
  }, [id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourse(id!);
      
      if (response.success && response.data?.course) {
        setCourse(response.data.course);
        setUserProgress(response.data.userProgress || null);
      } else {
        toast.error(response.message || "Failed to load course");
        navigate("/courses");
      }
    } catch (error) {
      console.error("Error fetching course:", error);
      toast.error("Failed to load course");
      navigate("/courses");
    } finally {
      setLoading(false);
    }
  };

  const updateLessonProgress = async (lessonId: string, status: string) => {
    if (!user || !course) return;

    try {
      await userService.updateLessonProgress(course._id, {
        lessonId,
        status: status as any,
        timeSpent: 30 // Default time, you can track actual time
      });
      
      // Refresh course data to get updated progress
      fetchCourse();
      toast.success("Progress updated!");
    } catch (error) {
      console.error("Error updating progress:", error);
      toast.error("Failed to update progress");
    }
  };

  const isOwner = user && course && course.creator._id === user.id;
  const isAdmin = user?.role === 'admin';
  const canEdit = isOwner || isAdmin;

  const handleEditCourse = () => {
    navigate(`/courses/${id}/edit`);
  };

  const handleDeleteCourse = async () => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      const response = await courseService.deleteCourse(id!);
      if (response.success) {
        toast.success("Course deleted successfully");
        navigate("/courses");
      } else {
        toast.error(response.message || "Failed to delete course");
      }
    } catch (error) {
      console.error("Error deleting course:", error);
      toast.error("Failed to delete course");
    }
  };

  const handleAddLesson = () => {
    navigate(`/courses/${id}/add-lesson`);
  };

  const shareCourse = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Course link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <Button onClick={() => navigate("/courses")}>Back to Courses</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Course Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{course.subject}</Badge>
              <Badge variant="outline">{course.level}</Badge>
              {course.aiGenerated && (
                <Badge variant="gradient">
                  <Star className="h-3 w-3 mr-1" />
                  AI Generated
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
            <p className="text-muted-foreground mb-4">{course.description}</p>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{course.creator.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{Math.ceil(course.totalDuration / 60)} hours</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{course.lessons.length} lessons</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={shareCourse}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            
            {canEdit && (
              <>
                <Button variant="outline" size="sm" onClick={handleAddLesson}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Lesson
                </Button>
                <Button variant="outline" size="sm" onClick={handleEditCourse}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDeleteCourse}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        {userProgress && (
          <CourseProgress 
            progress={userProgress} 
            course={course}
            onLessonComplete={(lessonId) => updateLessonProgress(lessonId, 'completed')}
          />
        )}
      </div>

      {/* Course Content */}
      <Tabs defaultValue="lessons" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="objectives">Objectives</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lesson List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Course Lessons</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {course.lessons.map((lesson, index) => (
                    <div
                      key={lesson._id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        currentLesson === index
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setCurrentLesson(index)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{lesson.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {lesson.duration} min
                            </span>
                          </div>
                        </div>
                        {userProgress?.lessonsProgress?.find((lp: any) => lp.lesson === lesson._id)?.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Lesson Content */}
            <div className="lg:col-span-2">
              {course.lessons[currentLesson] && (
                <Card>
                  <CardHeader>
                    <CardTitle>{course.lessons[currentLesson].title}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{course.lessons[currentLesson].type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {course.lessons[currentLesson].duration} minutes
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Updated Markdown Rendering */}
                    <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          // Customize heading styles
                          h1: ({ children }) => (
                            <h1 className="text-2xl font-bold mb-4 text-foreground">{children}</h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-xl font-semibold mb-3 text-foreground">{children}</h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-lg font-medium mb-2 text-foreground">{children}</h3>
                          ),
                          // Customize paragraph styles
                          p: ({ children }) => (
                            <p className="mb-4 text-foreground leading-relaxed">{children}</p>
                          ),
                          // Customize list styles
                          ul: ({ children }) => (
                            <ul className="list-disc list-inside mb-4 space-y-1 text-foreground">{children}</ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal list-inside mb-4 space-y-1 text-foreground">{children}</ol>
                          ),
                          li: ({ children }) => (
                            <li className="text-foreground">{children}</li>
                          ),
                          // Customize code styles
                          code: ({ children, className }) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                                {children}
                              </code>
                            ) : (
                              <code className={className}>{children}</code>
                            );
                          },
                          pre: ({ children }) => (
                            <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4 border">
                              {children}
                            </pre>
                          ),
                          // Customize blockquote styles
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4">
                              {children}
                            </blockquote>
                          ),
                          // Customize table styles
                          table: ({ children }) => (
                            <div className="overflow-x-auto mb-4">
                              <table className="w-full border-collapse border border-border">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className="border border-border bg-muted p-2 text-left font-medium">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="border border-border p-2">
                              {children}
                            </td>
                          ),
                          // Customize link styles
                          a: ({ href, children }) => (
                            <a 
                              href={href} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {course.lessons[currentLesson].content}
                      </ReactMarkdown>
                    </div>
                    
                    {user && (
                      <div className="mt-6 pt-6 border-t">
                        <Button 
                          onClick={() => updateLessonProgress(course.lessons[currentLesson]._id, 'completed')}
                          className="w-full"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Complete
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        
        <TabsContent value="quizzes">
          <QuizSection 
            courseId={course._id} 
            currentLesson={course.lessons[currentLesson]} 
          />
        </TabsContent>


        <TabsContent value="objectives" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Objectives</CardTitle>
              <CardDescription>
                What you'll learn from this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {course.learningObjectives.map((objective, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {course.prerequisites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Prerequisites</CardTitle>
                <CardDescription>
                  What you should know before taking this course
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {course.prerequisites.map((prerequisite, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <BookOpen className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>{prerequisite}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
              <CardDescription>
                Helpful links and materials for this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              {course.lessons.some(lesson => lesson.resources && lesson.resources.length > 0) ? (
                <div className="space-y-4">
                  {course.lessons.map((lesson, index) => 
                    lesson.resources && lesson.resources.length > 0 && (
                      <div key={lesson._id}>
                        <h4 className="font-medium mb-2">{lesson.title}</h4>
                        <ul className="space-y-2 ml-4">
                          {lesson.resources.map((resource, resourceIndex) => (
                            <li key={resourceIndex}>
                              <a 
                                href={resource.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-2"
                              >
                                <BookOpen className="h-4 w-4" />
                                {resource.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No additional resources available for this course.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

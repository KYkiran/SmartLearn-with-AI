// frontend/src/pages/Courses.tsx.
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { BookOpen, User, Star, PlusCircle, Sparkles } from "lucide-react";
import { courseService } from "../services/courseService";
import { useAuth } from "../contexts/AuthContext";

export function CoursesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const resp = await courseService.getCourses();
      setCourses(resp.data?.courses || []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="container py-12">Loading...</div>;
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Courses</h1>
        {user && (
          <div className="flex gap-2">
            <Button onClick={() => navigate("/create-course")}>
              <PlusCircle className="h-4 w-4 mr-2" /> Create Course
            </Button>
            <Button variant="gradient" onClick={() => navigate("/ai/generate-course")}>
              <Sparkles className="h-4 w-4 mr-2" /> AI Generate
            </Button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.length ? courses.map((course) => (
          <Card 
            key={course._id}
            className="hover:shadow-xl transition-all cursor-pointer"
            onClick={() => navigate(`/courses/${course._id}`)}
          >
            <CardHeader>
              <div className="flex flex-col gap-2">
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription>{course.description?.slice(0, 80)}...</CardDescription>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{course.subject}</Badge>
                  <Badge>{course.level}</Badge>
                  {course.aiGenerated && (
                    <Badge variant="gradient"><Star className="h-3 w-3 mr-1" />AI</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                  <User className="h-4 w-4" /> {course.creator.name}
                  <BookOpen className="h-4 w-4 ml-6" /> {course.lessons?.length || 0} lessons
                </div>
              </div>
            </CardHeader>
          </Card>
        )) : (
          <p className="col-span-full text-muted-foreground p-8 text-center">No published courses yet.</p>
        )}
      </div>
    </div>
  );
}

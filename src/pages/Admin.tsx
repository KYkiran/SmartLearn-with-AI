// frontend/src/pages/Admin.tsx
import { useState, useEffect } from "react";
import { courseService } from "../services/courseService";
import { quizService } from "../services/quizService";
import { userService } from "../services/userService";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

export function AdminPanel() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]); // You'll need a getUsers endpoint if you want to show users.
  
  // Only display if admin
  if (!user || user.role !== "admin") return <div className="container py-10">Admin access only.</div>;

  useEffect(() => {
    (async () => {
      const courseResp = await courseService.getCourses();
      setCourses(courseResp.data?.courses || []);
      const quizResp = await quizService.getQuizzes();
      setQuizzes(quizResp.data?.quizzes || []);
      // Get users if you have a user listing endpoint
      // const userResp = await userService.getAll();
      // setUsers(userResp.data?.users || []);
    })();
  }, []);

  const handleCourseDelete = async (id: string) => {
    await courseService.deleteCourse(id);
    toast.success("Course deleted");
    setCourses((prev) => prev.filter(c => c._id !== id));
  };

  const handleQuizDelete = async (id: string) => {
    await quizService.deleteQuiz(id);
    toast.success("Quiz deleted");
    setQuizzes((prev) => prev.filter(q => q._id !== id));
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Courses */}
        <div>
          <h2 className="font-semibold text-lg mb-4">All Courses</h2>
          <ul className="divide-y">
            {courses.map(c => (
              <li key={c._id} className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-medium">{c.title}</span>
                  <span className="text-xs text-muted-foreground ml-2">by {c.creator?.name}</span>
                </div>
                <Button size="sm" variant="destructive" onClick={() => handleCourseDelete(c._id)}>Delete</Button>
              </li>
            ))}
          </ul>
        </div>
        {/* Quizzes */}
        <div>
          <h2 className="font-semibold text-lg mb-4">All Quizzes</h2>
          <ul className="divide-y">
            {quizzes.map(q => (
              <li key={q._id} className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-medium">{q.title}</span>
                  <span className="text-xs text-muted-foreground ml-2">for {q.course?.title}</span>
                </div>
                <Button size="sm" variant="destructive" onClick={() => handleQuizDelete(q._id)}>Delete</Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

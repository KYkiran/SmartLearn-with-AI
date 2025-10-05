import { useState, useEffect } from 'react';
import { courseService, Course } from '@/services/courseService';
import { toast } from 'sonner';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      const response = await courseService.getCourses();
      
      if (response.success && response.data) {
        setCourses(response.data.courses);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch courses');
        toast.error(response.message || 'Failed to fetch courses');
      }
      
      setIsLoading(false);
    };

    fetchCourses();
  }, []);

  return { courses, isLoading, error };
}

export function useCourse(id: string) {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoading(true);
      const response = await courseService.getCourse(id);
      
      if (response.success && response.data) {
        setCourse(response.data.course);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch course');
        toast.error(response.message || 'Failed to fetch course');
      }
      
      setIsLoading(false);
    };

    if (id) {
      fetchCourse();
    }
  }, [id]);

  return { course, isLoading, error };
}

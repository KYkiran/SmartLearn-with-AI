import { useState, useEffect } from 'react';
import { userService, UserProgress } from '@/services/userService';
import { toast } from 'sonner';

export function useUserProgress() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    setIsLoading(true);
    const response = await userService.getUserProgress();
    
    if (response.success && response.data) {
      setProgress(response.data);
      setError(null);
    } else {
      setError(response.message || 'Failed to fetch progress');
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  return { progress, isLoading, error, refetch: fetchProgress };
}

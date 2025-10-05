// frontend/src/pages/Dashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  BookOpen, 
  Trophy, 
  Clock, 
  TrendingUp, 
  Star,
  Users,
  Target,
  Calendar,
  PlusCircle,
  Sparkles,
  CheckCircle,
  Play,
  Award,
  BarChart3
} from "lucide-react";
import { userService } from "../services/userService";
import { courseService } from "../services/courseService";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

interface DashboardStats {
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  totalTimeSpent: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
  streakDays: number;
  lastStudyDate: string;
}

interface CourseProgress {
  course: {
    _id: string;
    title: string;
    subject: string;
    level: string;
    thumbnail?: string;
    totalDuration: number;
    creator: {
      name: string;
      avatar?: string;
    };
  };
  status: string;
  progressPercentage: number;
  enrolledAt: string;
  lastAccessedAt: string;
  totalTimeSpent: number;
}

interface Achievement {
  type: string;
  earnedAt: string;
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<CourseProgress[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data in parallel
      const [
        progressResponse,
        achievementsResponse,
        leaderboardResponse,
        enrolledResponse
      ] = await Promise.all([
        userService.getProgress(),
        userService.getAchievements(),
        userService.getLeaderboard(10),
        courseService.getEnrolledCourses()
      ]);

      if (progressResponse.success && progressResponse.data?.progress) {
        setStats(progressResponse.data.progress.overallStats);
      }

      if (achievementsResponse.success && achievementsResponse.data?.achievements) {
        setAchievements(achievementsResponse.data.achievements);
      }

      if (leaderboardResponse.success && leaderboardResponse.data?.leaderboard) {
        setLeaderboard(leaderboardResponse.data.leaderboard);
      }

      if (enrolledResponse.success && enrolledResponse.data?.courses) {
        setEnrolledCourses(enrolledResponse.data.courses);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'first-course':
        return <BookOpen className="h-4 w-4" />;
      case 'course-completed':
        return <Trophy className="h-4 w-4" />;
      case 'quiz-master':
        return <Star className="h-4 w-4" />;
      case 'streak-week':
        return <Target className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  const getAchievementTitle = (type: string) => {
    switch (type) {
      case 'first-course':
        return 'First Course';
      case 'course-completed':
        return 'Course Completed';
      case 'quiz-master':
        return 'Quiz Master';
      case 'streak-week':
        return 'Week Streak';
      default:
        return 'Achievement';
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You must be logged in to view the dashboard.</p>
          <Button onClick={() => navigate("/login")}>Login</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user.name}! 👋
            </h1>
            <p className="text-muted-foreground">
              Continue your learning journey
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/courses")}>
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Courses
            </Button>
            <Button variant="gradient" onClick={() => navigate("/create-course")}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Courses Enrolled</p>
                <p className="text-2xl font-bold">{stats?.totalCoursesEnrolled || 0}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Courses Completed</p>
                <p className="text-2xl font-bold">{stats?.totalCoursesCompleted || 0}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Study Time</p>
                <p className="text-2xl font-bold">{formatTime(stats?.totalTimeSpent || 0)}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Quiz Score</p>
                <p className="text-2xl font-bold">{Math.round(stats?.averageQuizScore || 0)}%</p>
              </div>
              <Star className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* My Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          {enrolledCourses.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start your learning journey by exploring our course catalog
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => navigate("/courses")}>
                    Browse Courses
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/create-course")}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {enrolledCourses.map((courseProgress) => (
                <Card key={courseProgress.course._id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-8 w-8 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1">
                              {courseProgress.course.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              by {courseProgress.course.creator.name}
                            </p>
                            <div className="flex gap-2 mb-3">
                              <Badge variant="outline">{courseProgress.course.subject}</Badge>
                              <Badge variant="secondary">{courseProgress.course.level}</Badge>
                              <Badge 
                                variant={courseProgress.status === 'completed' ? 'default' : 'outline'}
                              >
                                {courseProgress.status}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{Math.round(courseProgress.progressPercentage)}%</span>
                              </div>
                              <Progress 
                                value={courseProgress.progressPercentage} 
                                className="h-2"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>
                                  Time spent: {formatTime(courseProgress.totalTimeSpent)}
                                </span>
                                <span>
                                  Last accessed: {new Date(courseProgress.lastAccessedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => navigate(`/courses/${courseProgress.course._id}`)}
                        >
                          {courseProgress.status === 'completed' ? 'Review' : 'Continue'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="text-center py-12">
                    <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Achievements Yet</h3>
                    <p className="text-muted-foreground">
                      Complete courses and take quizzes to earn achievements
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              achievements.map((achievement, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      {getAchievementIcon(achievement.type)}
                    </div>
                    <h3 className="font-semibold mb-2">
                      {getAchievementTitle(achievement.type)}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Earned on {new Date(achievement.earnedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Top Learners
              </CardTitle>
              <CardDescription>
                See how you rank among other learners
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No leaderboard data available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard.map((learner, index) => (
                    <div key={learner.id} className="flex items-center gap-4 p-4 rounded-lg border">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-amber-600' : 'bg-muted'
                      }`}>
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{learner.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {learner.coursesCompleted} courses • {formatTime(learner.totalTimeSpent)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{learner.points || 0} pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Courses Completed</span>
                    <span className="font-semibold">
                      {stats?.totalCoursesCompleted || 0} / {stats?.totalCoursesEnrolled || 0}
                    </span>
                  </div>
                  <Progress 
                    value={stats?.totalCoursesEnrolled ? (stats.totalCoursesCompleted / stats.totalCoursesEnrolled) * 100 : 0}
                  />
                  
                  <div className="flex justify-between items-center">
                    <span>Average Quiz Score</span>
                    <span className="font-semibold">{Math.round(stats?.averageQuizScore || 0)}%</span>
                  </div>
                  <Progress value={stats?.averageQuizScore || 0} />
                  
                  <div className="flex justify-between items-center">
                    <span>Study Streak</span>
                    <span className="font-semibold">{stats?.streakDays || 0} days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Study Habits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Total Study Time</span>
                      <span className="font-semibold">{formatTime(stats?.totalTimeSpent || 0)}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Average: {stats?.totalCoursesEnrolled ? formatTime(Math.round((stats?.totalTimeSpent || 0) / stats.totalCoursesEnrolled)) : '0m'} per course
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Quizzes Taken</span>
                      <span className="font-semibold">{stats?.totalQuizzesTaken || 0}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span>Last Study Session</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stats?.lastStudyDate ? new Date(stats.lastStudyDate).toLocaleDateString() : 'No recent activity'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// frontend/src/pages/Landing.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { courseService } from "@/services/courseService";
import { popularTopics } from "@/utils/mockData";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import {
  Sparkles,
  Search,
  TrendingUp,
  Award,
  BookOpen,
  Brain,
  Users,
  Trophy,
  Zap,
  ArrowRight,
  Star,
  CheckCircle,
  Play,
  Target,
  Globe,
} from "lucide-react";

import heroImage from "@/assets/hero-learning.jpg";

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchTopic, setSearchTopic] = useState("");
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [stats] = useState({ totalCourses: 0, totalUsers: 0, totalQuizzes: 0 });

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      try {
        const response = await courseService.getCourses({ limit: 3, sortBy: "enrollmentCount", sortOrder: "desc" });
        if (response.success && response.data?.courses) {
          setFeaturedCourses(response.data.courses.slice(0, 3));
        }
      } catch (e) {
        console.error("Error fetching featured courses:", e);
      }
    };
    fetchFeaturedCourses();
  }, []);

  const handleCreateCourse = (topic: string) => {
    const t = topic.trim();
    if (!t) return;
    // Navigate to your generator route. You previously used /course/:topic.
    // If your app expects a different route, adjust here.
    navigate(`/course/${encodeURIComponent(t)}`);
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Hero Section (merged) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 animate-fade-in"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 to-background" />

        <div className="container relative z-10 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary animate-slide-down border border-primary/20">
              <Sparkles className="h-4 w-4 animate-pulse" />
              AI-Powered Learning Platform
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl gradient-text animate-fade-in">
              Learn Anything with AI
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Generate personalized courses on any topic. Track your progress, take quizzes, and master new skills at your own pace.
            </p>

            {/* Search Bar */}
            <div className="flex gap-2 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="What do you want to learn today?"
                  value={searchTopic}
                  onChange={(e) => setSearchTopic(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateCourse(searchTopic)}
                  className="pl-10 h-12 text-base hover-lift focus:shadow-lg transition-all"
                />
              </div>
              <Button
                size="lg"
                variant="gradient"
                onClick={() => handleCreateCourse(searchTopic)}
                disabled={!searchTopic.trim()}
                className="hover-lift"
              >
                Generate Course
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Three Feature Cards (from Home) */}
      <section className="container py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="card-interactive border-2 hover:border-primary/50 hover-glow animate-fade-in">
            <CardHeader>
              <Sparkles className="h-10 w-10 text-primary mb-2 animate-pulse" />
              <CardTitle>AI-Generated Content</CardTitle>
              <CardDescription>
                Courses tailored to your learning style with comprehensive modules and quizzes
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-interactive border-2 hover:border-primary/50 hover-glow animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Track Your Progress</CardTitle>
              <CardDescription>
                Detailed analytics showing daily activity, streaks, and completion rates
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="card-interactive border-2 hover:border-primary/50 hover-glow animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <Award className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Interactive Quizzes</CardTitle>
              <CardDescription>
                Test your knowledge with AI-generated quizzes for each module
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Why Choose (from Landing) */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Why Choose SmartLearn?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the future of education with our innovative platform designed for modern learners and creators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="text-center hover:shadow-lg transition-all duration-300 group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <CardTitle>Open Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No enrollment barriers. Access any published course instantly and start learning immediately.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <CardTitle>AI-Powered Creation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create courses and quizzes effortlessly with our advanced AI assistance technology.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <CardTitle>Smart Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Automatic progress tracking, achievements, and analytics to keep you motivated.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="h-8 w-8 text-white" />
                </div>
                <CardTitle>Interactive Quizzes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Test your knowledge with dynamic quizzes and get instant feedback on your performance.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle>Community Driven</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Learn from a diverse community of educators and experts from around the world.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-300 group">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <CardTitle>Real-time Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Monitor your learning journey with detailed analytics and performance insights.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Popular Topics (from Home) */}
      <section className="container py-16">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="text-3xl font-bold mb-4 gradient-text">Popular Topics</h2>
          <p className="text-muted-foreground">Start learning with these trending courses</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {popularTopics.map((topic, index) => (
            <Card
              key={topic.title}
              className="card-interactive border-2 hover:border-primary/50 hover-glow animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => handleCreateCourse(topic.title)}
            >
              <CardHeader>
                <div className="text-4xl mb-2 transition-transform duration-300 hover:scale-125">{topic.icon}</div>
                <CardTitle>{topic.title}</CardTitle>
                <CardDescription>{topic.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full group">
                  <span className="group-hover:scale-110 transition-transform">Start Learning</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Courses (from Landing) */}
      {featuredCourses.length > 0 && (
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Popular Courses</h2>
              <p className="text-xl text-muted-foreground">Start with these highly-rated courses from our community</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCourses.map((course) => (
                <Card
                  key={course._id}
                  className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
                  onClick={() => navigate(`/courses/${course._id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{course.subject}</Badge>
                          <Badge variant="outline">{course.level}</Badge>
                          {course.aiGenerated && (
                            <Badge variant="gradient">
                              <Star className="h-3 w-3 mr-1" />
                              AI
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="group-hover:text-primary transition-colors">{course.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {course.lessons?.length || 0} lessons
                      </span>
                      <span>{course.creator.name}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button variant="outline" size="lg" onClick={() => navigate('/courses')}>
                View All Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* How It Works (from Landing) */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Get started in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Sign Up Free</h3>
              <p className="text-muted-foreground">Create your account in seconds and join our learning community at no cost.</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Explore & Learn</h3>
              <p className="text-muted-foreground">Browse courses, start learning immediately, and track your progress automatically.</p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Create & Share</h3>
              <p className="text-muted-foreground">Build your own courses with AI assistance and share knowledge with others.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section (from Landing) */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">Ready to Start Your Learning Journey?</h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of learners who are already transforming their skills with SmartLearn. It's free, it's powerful, and it's waiting for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6"
                onClick={() => navigate('/register')}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-purple-600"
                onClick={() => navigate('/courses')}
              >
                Browse Courses
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

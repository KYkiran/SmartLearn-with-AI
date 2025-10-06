import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Sparkles, TrendingUp, Award } from "lucide-react";
import { popularTopics } from "@/utils/mockData";
import heroImage from "@/assets/hero-learning.jpg";

export default function Home() {
  const [searchTopic, setSearchTopic] = useState("");
  const navigate = useNavigate();

  const handleCreateCourse = (topic: string) => {
    if (topic.trim()) {
      navigate(`/course/${encodeURIComponent(topic.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Hero Section */}
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
              AI-Powered Learning
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
                  onKeyPress={(e) => e.key === "Enter" && handleCreateCourse(searchTopic)}
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

      {/* Features */}
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

      {/* Popular Topics */}
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
    </div>
  );
}

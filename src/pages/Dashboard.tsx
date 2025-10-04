import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import { generateMockDailyActivities, calculateStreak, popularTopics } from "@/utils/mockData";
import { DailyActivity } from "@/types/course";
import { Clock, Flame, Award, Target, TrendingUp, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setDailyActivities(generateMockDailyActivities());
  }, []);

  const totalMinutes = dailyActivities.reduce((acc, day) => acc + day.minutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const streak = calculateStreak(dailyActivities);
  const totalQuizzes = dailyActivities.reduce((acc, day) => acc + day.quizzesTaken, 0);
  const avgMinutesPerDay = Math.round(totalMinutes / dailyActivities.length);

  // Last 7 days for mini charts
  const last7Days = dailyActivities.slice(-7);
  
  // Weekly data grouped
  const weeklyData = [];
  for (let i = 0; i < dailyActivities.length; i += 7) {
    const week = dailyActivities.slice(i, i + 7);
    const weekMinutes = week.reduce((acc, day) => acc + day.minutes, 0);
    weeklyData.push({
      week: `Week ${Math.floor(i / 7) + 1}`,
      minutes: weekMinutes,
      hours: Math.round(weekMinutes / 60),
    });
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Learning Dashboard</h1>
          <p className="text-muted-foreground text-lg">Track your progress and stay motivated</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2 hover:shadow-lg transition-all hover-scale animate-scale-in">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Learning Time
                </CardTitle>
                <Clock className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{totalHours}h</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalMinutes % 60}m · Avg {avgMinutesPerDay}m/day
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all hover-scale animate-scale-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Current Streak
                </CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">{streak}</div>
              <p className="text-xs text-muted-foreground mt-1">days in a row 🔥</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all hover-scale animate-scale-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Quizzes Completed
                </CardTitle>
                <Award className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{totalQuizzes}</div>
              <p className="text-xs text-muted-foreground mt-1">Total assessments</p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all hover-scale animate-scale-in" style={{ animationDelay: "0.3s" }}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Week
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.round(last7Days.reduce((acc, day) => acc + day.minutes, 0) / 60)}h
              </div>
              <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-6">
            {/* Daily Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Activity</CardTitle>
                <CardDescription>Your learning time over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyActivities}>
                    <defs>
                      <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tickFormatter={(date) => new Date(date).getDate().toString()}
                    />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Area
                      type="monotone"
                      dataKey="minutes"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMinutes)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Contribution Graph */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Heatmap</CardTitle>
                <CardDescription>Your daily learning activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-10 gap-1">
                  {dailyActivities.map((day, idx) => {
                    const intensity = day.minutes === 0 ? 0 : Math.min(Math.floor(day.minutes / 30) + 1, 4);
                    return (
                      <div
                        key={idx}
                        className="aspect-square rounded-sm"
                        style={{
                          backgroundColor:
                            intensity === 0
                              ? "hsl(var(--muted))"
                              : `hsl(var(--primary) / ${intensity * 0.25})`,
                        }}
                        title={`${day.date}: ${day.minutes} minutes`}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
                  <span>Less</span>
                  <div className="h-3 w-3 rounded-sm bg-muted" />
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "hsl(var(--primary) / 0.25)" }} />
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "hsl(var(--primary) / 0.5)" }} />
                  <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: "hsl(var(--primary) / 0.75)" }} />
                  <div className="h-3 w-3 rounded-sm bg-primary" />
                  <span>More</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            {/* Weekly Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Progress</CardTitle>
                <CardDescription>Hours spent learning each week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Goals Section */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Weekly Goal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">10 hours target</span>
                      <span className="font-medium">
                        {Math.round(last7Days.reduce((acc, day) => acc + day.minutes, 0) / 60)}/10h
                      </span>
                    </div>
                    <Progress
                      value={
                        (last7Days.reduce((acc, day) => acc + day.minutes, 0) / 60 / 10) * 100
                      }
                      className="h-2"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Keep going! You're {Math.round((last7Days.reduce((acc, day) => acc + day.minutes, 0) / 60 / 10) * 100)}% of the way there.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-500" />
                    Streak Goal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">30 days target</span>
                      <span className="font-medium">{streak}/30 days</span>
                    </div>
                    <Progress value={(streak / 30) * 100} className="h-2" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maintain your streak by learning a little bit every day!
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Start a New Course</CardTitle>
                <CardDescription>Choose a topic to begin learning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {popularTopics.map((topic) => (
                    <button
                      key={topic.title}
                      onClick={() => navigate(`/course/${encodeURIComponent(topic.title)}`)}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-accent transition-all text-left"
                    >
                      <div className="text-3xl">{topic.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{topic.title}</h4>
                        <p className="text-sm text-muted-foreground">{topic.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

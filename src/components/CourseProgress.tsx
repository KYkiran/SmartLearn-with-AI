import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { Module } from "@/types/course";

interface CourseProgressProps {
  modules: Module[];
  totalTime: number;
}

export function CourseProgress({ modules, totalTime }: CourseProgressProps) {
  const completedModules = modules.filter((m) => m.completed).length;
  const progress = (completedModules / modules.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Completion</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="rounded-lg border p-3">
            <div className="text-2xl font-bold text-primary">{completedModules}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-2xl font-bold text-muted-foreground">
              {modules.length - completedModules}
            </div>
            <div className="text-xs text-muted-foreground">Remaining</div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Module Checklist</h4>
          {modules.map((module) => (
            <div key={module.id} className="flex items-start gap-3">
              {module.completed ? (
                <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 space-y-1">
                <p className={`text-sm ${module.completed ? "line-through text-muted-foreground" : ""}`}>
                  {module.title}
                </p>
                <p className="text-xs text-muted-foreground">{module.duration} min</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-lg bg-muted p-4 text-center">
          <div className="text-sm text-muted-foreground mb-1">Total Time Spent</div>
          <div className="text-2xl font-bold text-primary">
            {Math.floor(totalTime / 60)}h {totalTime % 60}m
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

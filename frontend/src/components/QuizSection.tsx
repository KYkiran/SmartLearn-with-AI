import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Quiz, Question } from "@/types/course";
import { CheckCircle2, XCircle, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface QuizSectionProps {
  quiz: Quiz;
  onComplete: (score: number) => void;
}

export function QuizSection({ quiz, onComplete }: QuizSectionProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const question = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);

    if (isLastQuestion) {
      const correctCount = newAnswers.filter(
        (ans, idx) => ans === quiz.questions[idx].correctAnswer
      ).length;
      const score = (correctCount / quiz.questions.length) * 100;
      setShowResults(true);
      onComplete(score);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    }
  };

  const handleRetake = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowResults(false);
  };

  if (showResults) {
    const correctCount = answers.filter(
      (ans, idx) => ans === quiz.questions[idx].correctAnswer
    ).length;
    const score = (correctCount / quiz.questions.length) * 100;

    return (
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-10 w-10 text-primary" />
          </div>
          <CardTitle>Quiz Complete!</CardTitle>
          <CardDescription>Here's how you did</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-primary mb-2">{Math.round(score)}%</div>
            <p className="text-muted-foreground">
              {correctCount} out of {quiz.questions.length} correct
            </p>
          </div>

          <div className="space-y-4">
            {quiz.questions.map((q, idx) => {
              const userAnswer = answers[idx];
              const isCorrect = userAnswer === q.correctAnswer;

              return (
                <div
                  key={q.id}
                  className={`rounded-lg border p-4 ${
                    isCorrect ? "border-success bg-success/5" : "border-destructive bg-destructive/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-success mt-1 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-2">{q.question}</p>
                      <p className="text-sm text-muted-foreground">
                        Your answer: {q.options[userAnswer]}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-success">
                          Correct answer: {q.options[q.correctAnswer]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button onClick={handleRetake} className="w-full">
            Retake Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Module Quiz</CardTitle>
          <span className="text-sm text-muted-foreground">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </span>
        </div>
        <Progress
          value={((currentQuestion + 1) / quiz.questions.length) * 100}
          className="h-2"
        />
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{question.question}</h3>

          <RadioGroup
            value={selectedAnswer?.toString()}
            onValueChange={(value) => setSelectedAnswer(parseInt(value))}
          >
            <div className="space-y-3">
              {question.options.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent transition-colors">
                  <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                  <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <Button
          onClick={handleNext}
          disabled={selectedAnswer === null}
          className="w-full"
          size="lg"
        >
          {isLastQuestion ? "Finish Quiz" : "Next Question"}
        </Button>
      </CardContent>
    </Card>
  );
}

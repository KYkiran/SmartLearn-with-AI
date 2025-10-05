// frontend/src/pages/CreateCourse.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  BookOpen, 
  Sparkles, 
  Plus, 
  X, 
  Save,
  Wand2
} from "lucide-react";
import { courseService } from "@/services/courseService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LessonForm {
  title: string;
  content: string;
  duration: number;
  type: 'text' | 'video' | 'interactive';
  order: number;
}

export function CreateCoursePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Course form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subject: "",
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    tags: [] as string[],
    prerequisites: [] as string[],
    learningObjectives: [] as string[],
    isPublished: false
  });

  // Lessons state
  const [lessons, setLessons] = useState<LessonForm[]>([]);
  const [currentLesson, setCurrentLesson] = useState<LessonForm>({
    title: "",
    content: "",
    duration: 30,
    type: "text",
    order: 1
  });

  // AI Generation state
  const [aiForm, setAiForm] = useState({
    topic: "",
    level: "beginner" as "beginner" | "intermediate" | "advanced",
    duration: 4,
    learningObjectives: [] as string[],
    language: "en"
  });

  // Input helpers
  const [tagInput, setTagInput] = useState("");
  const [prerequisiteInput, setPrerequisiteInput] = useState("");
  const [objectiveInput, setObjectiveInput] = useState("");
  const [aiObjectiveInput, setAiObjectiveInput] = useState("");

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addPrerequisite = () => {
    if (prerequisiteInput.trim() && !formData.prerequisites.includes(prerequisiteInput.trim())) {
      setFormData(prev => ({
        ...prev,
        prerequisites: [...prev.prerequisites, prerequisiteInput.trim()]
      }));
      setPrerequisiteInput("");
    }
  };

  const removePrerequisite = (prerequisite: string) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter(p => p !== prerequisite)
    }));
  };

  const addObjective = () => {
    if (objectiveInput.trim() && !formData.learningObjectives.includes(objectiveInput.trim())) {
      setFormData(prev => ({
        ...prev,
        learningObjectives: [...prev.learningObjectives, objectiveInput.trim()]
      }));
      setObjectiveInput("");
    }
  };

  const removeObjective = (objective: string) => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter(o => o !== objective)
    }));
  };

  const addAiObjective = () => {
    if (aiObjectiveInput.trim() && !aiForm.learningObjectives.includes(aiObjectiveInput.trim())) {
      setAiForm(prev => ({
        ...prev,
        learningObjectives: [...prev.learningObjectives, aiObjectiveInput.trim()]
      }));
      setAiObjectiveInput("");
    }
  };

  const removeAiObjective = (objective: string) => {
    setAiForm(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter(o => o !== objective)
    }));
  };

  const addLesson = () => {
    if (currentLesson.title && currentLesson.content) {
      setLessons(prev => [...prev, { ...currentLesson, order: prev.length + 1 }]);
      setCurrentLesson({
        title: "",
        content: "",
        duration: 30,
        type: "text",
        order: lessons.length + 2
      });
    }
  };

  const removeLesson = (index: number) => {
    setLessons(prev => prev.filter((_, i) => i !== index));
  };

  const handleManualSubmit = async () => {
    if (!formData.title || !formData.description || !formData.subject) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const courseData = {
        ...formData,
        lessons: lessons.map((lesson, index) => ({
          ...lesson,
          order: index + 1
        }))
      };

      const response = await courseService.createCourse(courseData);
      
      if (response.success) {
        toast.success("Course created successfully!");
        navigate(`/courses/${response.data?.course?._id}`);
      } else {
        toast.error(response.message || "Failed to create course");
      }
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error("Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiForm.topic) {
      toast.error("Please enter a topic for AI generation");
      return;
    }

    try {
      setAiLoading(true);
      const response = await courseService.generateCourse(aiForm);
      
      if (response.success) {
        toast.success("Course generated successfully!");
        navigate(`/courses/${response.data?.course?._id}`);
      } else {
        toast.error(response.message || "Failed to generate course");
      }
    } catch (error) {
      console.error("Error generating course:", error);
      toast.error("Failed to generate course. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">You must be logged in to create courses.</p>
          <Button onClick={() => navigate("/login")}>Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Course</h1>
        <p className="text-muted-foreground">
          Share your knowledge with learners around the world
        </p>
      </div>

      <Tabs defaultValue="manual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Manual Creation
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Generation
          </TabsTrigger>
        </TabsList>

        {/* Manual Course Creation */}
        <TabsContent value="manual" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Core details about your course
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter course title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what students will learn"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g., Programming"
                    />
                  </div>
                  <div>
                    <Label htmlFor="level">Level *</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, level: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="published">Publish immediately</Label>
                  <Switch
                    id="published"
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublished: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
                <CardDescription>
                  Tags, prerequisites, and learning objectives
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tag"
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button type="button" onClick={addTag} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Prerequisites</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={prerequisiteInput}
                      onChange={(e) => setPrerequisiteInput(e.target.value)}
                      placeholder="Add prerequisite"
                      onKeyPress={(e) => e.key === 'Enter' && addPrerequisite()}
                    />
                    <Button type="button" onClick={addPrerequisite} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {formData.prerequisites.map((prerequisite) => (
                      <div key={prerequisite} className="flex items-center gap-2 text-sm">
                        <span className="flex-1">{prerequisite}</span>
                        <X 
                          className="h-4 w-4 cursor-pointer text-destructive" 
                          onClick={() => removePrerequisite(prerequisite)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Learning Objectives</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={objectiveInput}
                      onChange={(e) => setObjectiveInput(e.target.value)}
                      placeholder="Add learning objective"
                      onKeyPress={(e) => e.key === 'Enter' && addObjective()}
                    />
                    <Button type="button" onClick={addObjective} size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {formData.learningObjectives.map((objective) => (
                      <div key={objective} className="flex items-center gap-2 text-sm">
                        <span className="flex-1">{objective}</span>
                        <X 
                          className="h-4 w-4 cursor-pointer text-destructive" 
                          onClick={() => removeObjective(objective)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lessons Section */}
          <Card>
            <CardHeader>
              <CardTitle>Course Lessons</CardTitle>
              <CardDescription>
                Add lessons to your course content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Lesson Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 border rounded-lg">
                <div>
                  <Label htmlFor="lesson-title">Lesson Title</Label>
                  <Input
                    id="lesson-title"
                    value={currentLesson.title}
                    onChange={(e) => setCurrentLesson(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter lesson title"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="lesson-duration">Duration (min)</Label>
                    <Input
                      id="lesson-duration"
                      type="number"
                      value={currentLesson.duration}
                      onChange={(e) => setCurrentLesson(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lesson-type">Type</Label>
                    <Select
                      value={currentLesson.type}
                      onValueChange={(value: any) => setCurrentLesson(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="interactive">Interactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <Label htmlFor="lesson-content">Content</Label>
                  <Textarea
                    id="lesson-content"
                    value={currentLesson.content}
                    onChange={(e) => setCurrentLesson(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter lesson content"
                    rows={6}
                  />
                </div>

                <div className="lg:col-span-2">
                  <Button 
                    type="button" 
                    onClick={addLesson}
                    disabled={!currentLesson.title || !currentLesson.content}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lesson
                  </Button>
                </div>
              </div>

              {/* Added Lessons */}
              {lessons.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Added Lessons ({lessons.length})</h4>
                  {lessons.map((lesson, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex-1">
                        <h5 className="font-medium">{lesson.title}</h5>
                        <p className="text-sm text-muted-foreground">
                          {lesson.duration} min • {lesson.type}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeLesson(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleManualSubmit} 
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Course
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* AI Course Generation */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                AI Course Generation
              </CardTitle>
              <CardDescription>
                Let AI create a complete course for you based on your requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ai-topic">Course Topic *</Label>
                    <Input
                      id="ai-topic"
                      value={aiForm.topic}
                      onChange={(e) => setAiForm(prev => ({ ...prev, topic: e.target.value }))}
                      placeholder="e.g., Introduction to React"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ai-level">Level</Label>
                      <Select
                        value={aiForm.level}
                        onValueChange={(value: any) => setAiForm(prev => ({ ...prev, level: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ai-duration">Duration (hours)</Label>
                      <Input
                        id="ai-duration"
                        type="number"
                        value={aiForm.duration}
                        onChange={(e) => setAiForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                        min="1"
                        max="50"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Learning Objectives (Optional)</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={aiObjectiveInput}
                        onChange={(e) => setAiObjectiveInput(e.target.value)}
                        placeholder="Add learning objective"
                        onKeyPress={(e) => e.key === 'Enter' && addAiObjective()}
                      />
                      <Button type="button" onClick={addAiObjective} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {aiForm.learningObjectives.map((objective) => (
                        <div key={objective} className="flex items-center gap-2 text-sm">
                          <span className="flex-1">{objective}</span>
                          <X 
                            className="h-4 w-4 cursor-pointer text-destructive" 
                            onClick={() => removeAiObjective(objective)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="text-center">
                <Button 
                  onClick={handleAiGenerate} 
                  disabled={aiLoading || !aiForm.topic}
                  size="lg"
                  className="w-full lg:w-auto"
                >
                  {aiLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Course...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Course with AI
                    </>
                  )}
                </Button>
                {aiLoading && (
                  <p className="text-sm text-muted-foreground mt-2">
                    This may take a few moments while AI creates your course content...
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

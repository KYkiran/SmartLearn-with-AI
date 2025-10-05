// frontend/src/components/Navigation.tsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { 
  Home, 
  LayoutDashboard, 
  Sparkles, 
  LogOut, 
  User, 
  BookOpen, 
  PlusCircle,
  Trophy,
  Settings
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { toast } from "sonner";

export function Navigation() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' ? 'destructive' : 'default';
  };

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 animate-slide-down">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg hover-scale">
            <Sparkles className="h-6 w-6 text-primary animate-pulse-glow" />
            SmartLearn
          </Link>

          {user && (
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant={isActivePath("/") ? "default" : "ghost"}
                size="sm"
                asChild
                className="transition-all"
              >
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </Button>
              
              <Button
                variant={isActivePath("/courses") ? "default" : "ghost"}
                size="sm"
                asChild
                className="transition-all"
              >
                <Link to="/courses">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Courses
                </Link>
              </Button>

              <Button
                variant={isActivePath("/dashboard") ? "default" : "ghost"}
                size="sm"
                asChild
                className="transition-all"
              >
                <Link to="/dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>

              <Button
                variant={isActivePath("/leaderboard") ? "default" : "ghost"}
                size="sm"
                asChild
                className="transition-all"
              >
                <Link to="/leaderboard">
                  <Trophy className="h-4 w-4 mr-2" />
                  Leaderboard
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          {user ? (
            <>
              {/* Create Content Button - Available to all learners */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="hidden sm:flex hover-scale">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/create-course")}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Create Course
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/create-quiz")}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Create Quiz
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover-scale">
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 animate-scale-in">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{user.name}</p>
                        <Badge variant={getRoleBadgeColor(user.role)} className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate("/my-courses")}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    My Courses
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/register">Sign Up</Link>
              </Button>
              <Button asChild variant="gradient" size="sm" className="hover-scale">
                <Link to="/login">
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// frontend/src/components/RequireAdmin.tsx
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
export function RequireAdmin({children}: {children: JSX.Element}) {
  const { user } = useAuth();
  return user?.role==='admin' ? children : <Navigate to="/" />;
}

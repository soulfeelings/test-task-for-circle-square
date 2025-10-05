import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@shared/contexts/UserContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user } = useUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

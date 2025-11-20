
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

/**
 * AuthLayout Component
 * 
 * This component acts as a guard for protected routes.
 * 
 * 1. It uses the `useAuth` hook to get the authentication status (`user`, `loading`).
 * 2. While `loading` is true, it displays a full-screen loading spinner, preventing
 *    any child components from rendering prematurely (and thus avoiding race conditions).
 * 3. Once `loading` is false, it checks if a `user` object exists.
 * 4. If `user` exists, it renders the child route using the `<Outlet />` component.
 * 5. If `user` does not exist, it redirects the user to the `/login` page using
 *    the `<Navigate />` component, effectively protecting the route.
 */
const AuthLayout = () => {
  const { user, loading } = useAuth();

  // While checking authentication, show a loading screen
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
      </div>
    );
  }

  // If loading is finished and there is no user, redirect to login
  if (!user) {
    // You can pass the original location to redirect back after login
    return <Navigate to="/login" replace />;
  }

  // If loading is finished and there is a user, render the protected content
  return <Outlet />;
};

export default AuthLayout;

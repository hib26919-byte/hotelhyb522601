import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-loader">Loading your profile...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/" replace state={{ redirectTo: location.pathname }} />;
  }

  return children;
};

export default ProtectedRoute;


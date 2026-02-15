import { Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "./utils/api";
import './pp.css'

const readCookie = (name) => {
  if (typeof document === "undefined") return null;
  const nameEQ = `${name}=`;
  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(nameEQ))
    ?.slice(nameEQ.length)
    || null;
};

const syncAccessTokenFromCookie = () => {
  if (typeof window === "undefined") return null;
  const storedToken = localStorage.getItem("access");
  const cookieToken = readCookie("access");
  if (cookieToken && storedToken !== cookieToken) {
    localStorage.setItem("access", cookieToken);
    console.log("[ProtectedRoute] Synced access token from cookie to localStorage");
  }
  return storedToken || cookieToken;
};

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        console.log("[ProtectedRoute] Checking auth via GET /api/core/me/", {
          path: location.pathname,
          search: location.search,
        });
        syncAccessTokenFromCookie();
        const response = await api.get("core/me/");
        console.log("[ProtectedRoute] Auth check succeeded:", {
          status: response?.status,
          data: response?.data,
        });
        setIsAuthenticated(true);
      } catch (error) {
        console.error("[ProtectedRoute] Auth check failed for /api/core/me/", {
          message: error?.message,
          status: error?.response?.status,
          data: error?.response?.data,
          url: error?.config?.url,
          method: error?.config?.method,
        });
        debugger;
        setIsAuthenticated(false);
      }
    };
    checkAuthentication();
    // Add location.pathname to dependencies to re-check on navigation
  }, [location.pathname]);

  if (isAuthenticated === null) {
    return <div className="h-screen flex justify-center items-center">
<div className="main ">
  <div className="up">
    <div className="loaders">
      <div className="loader"></div>
      <div className="loader"></div>
      <div className="loader"></div>
      <div className="loader"></div>
      <div className="loader"></div>
      <div className="loader"></div>
      <div className="loader"></div>
      <div className="loader"></div>
      <div className="loader"></div>
      <div className="loader"></div>
    </div>
    <div className="loadersB">
      <div className="loaderA">
        <div className="ball0"></div>
      </div>
      <div className="loaderA">
        <div className="ball1"></div>
      </div>
      <div className="loaderA">
        <div className="ball2"></div>
      </div>
      <div className="loaderA">
        <div className="ball3"></div>
      </div>
      <div className="loaderA">
        <div className="ball4"></div>
      </div>
      <div className="loaderA">
        <div className="ball5"></div>
      </div>
      <div className="loaderA">
        <div className="ball6"></div>
      </div>
      <div className="loaderA">
        <div className="ball7"></div>
      </div>
      <div className="loaderA">
        <div className="ball8"></div>
      </div>
    </div>
  </div>
</div>
</div>;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(
          location.pathname + location.search
        )}`}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;

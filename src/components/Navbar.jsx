// File: src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Menu, X, User, LogIn, UserPlus, LogOut, Search, Car } from "lucide-react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // This effect checks the token on mount and also listens for changes.
  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem("token");
      setIsAuthenticated(!!token);
    };

    // Check immediately on mount
    checkAuthStatus();

    // Listen for storage changes (e.g., login/logout in another tab)
    window.addEventListener('storage', checkAuthStatus);

    // This is a custom event to manually trigger a re-check from other components
    window.addEventListener('authChange', checkAuthStatus);

    // Cleanup listeners when component unmounts
    return () => {
      window.removeEventListener('storage', checkAuthStatus);
      window.removeEventListener('authChange', checkAuthStatus);
    };
  }, []);


  const handleLogout = () => {
    navigate("/logout");
  };

  // Use Tailwind classes for active links for consistency
  const getActiveClassName = ({ isActive }) =>
    isActive
      ? "flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 text-blue-600 font-semibold transition"
      : "flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition";

  // Define links based on authentication status
  const authenticatedLinks = (
    <>
      <NavLink to="/profile" className={getActiveClassName}>
        <User size={18} />
        Profile
      </NavLink>
      {/* Use a button for actions like logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition text-red-500"
      >
        <LogOut size={18} />
        Logout
      </button>
    </>
  );

  const publicLinks = (
    <>
      <NavLink to="/vehicle-rc" className={getActiveClassName}>
        <Search size={18} />
        RC Check
      </NavLink>
      <NavLink to="/dashboard/vehicles" className={getActiveClassName}>
        <Car size={18} className="mr-1" />
        Dashboard
      </NavLink>
    </>
  );


  return (
    <header className="w-full fixed top-0 left-0 z-50 bg-slate-200/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo wrapped in a Link for proper navigation and accessibility */}
        <Link to="/" className="flex items-center gap-3">
          {/* Using standard Tailwind size classes and adjusted margin */}
          <img src="/ms.png" alt="Mechanic Setu Logo" className="w-12 h-12" />
          <h1 className="text-2xl font-bold text-gray-900">
            Mechanic Setu
          </h1>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-2">
          {publicLinks}
          {isAuthenticated && authenticatedLinks}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-gray-800 rounded-lg hover:bg-gray-200 transition"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <nav className="md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-lg">
          <div className="flex flex-col gap-1 p-4" onClick={() => setMenuOpen(false)}>
            {publicLinks}
            {isAuthenticated && authenticatedLinks}
          </div>
        </nav>
      )}
    </header>
  );
}
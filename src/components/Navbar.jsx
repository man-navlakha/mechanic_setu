// File: src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  User,
  Car,
  LogOut,
  Search,
  AlertTriangle,
  ChevronDown,
  Wrench,
  FileText,
  UserPlus
} from "lucide-react";
import api from "../utils/api";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // 1. Auth Status Check
  useEffect(() => {
    let cancelled = false;

    const checkAuthStatus = async () => {
      try {
        await api.get("core/me/", { skipAuthRedirect: true });
        if (!cancelled) setIsAuthenticated(true);
      } catch {
        if (!cancelled) setIsAuthenticated(false);
      }
    };

    checkAuthStatus();
    // Listen for login/logout events from other components
    window.addEventListener("storage", checkAuthStatus);
    window.addEventListener("authChange", checkAuthStatus);

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", checkAuthStatus);
      window.removeEventListener("authChange", checkAuthStatus);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("access");
    // Dispatch event to update state immediately
    window.dispatchEvent(new Event("authChange")); 
    setProfileOpen(false);
    navigate("/logout");
  };

  const getActiveClassName = ({ isActive }) =>
    isActive
      ? "flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 font-semibold transition-colors"
      : "flex items-center gap-2 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors";

  return (
    <header className="w-full fixed top-0 left-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">

        {/* LOGO */}
        <Link to="/home" className="flex items-center gap-2">
          <img src="/ms.png" alt="Mechanic Setu" className="w-9 h-9 sm:w-10 sm:h-10" />
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Mechanic Setu</h1>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-1">
          
          {/* Public Features */}
          <NavLink to="/nearby-mechanics" className={getActiveClassName}>
            <Wrench size={18} />
            Find Mechanic
          </NavLink>

          <NavLink to="/vehicle-rc" className={getActiveClassName}>
            <Search size={18} />
            RC Check
          </NavLink>

          {/* Emergency CTA */}
          <Link
            to="/puncture-request" 
            className="ml-2 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition shadow-sm hover:shadow"
          >
            <AlertTriangle size={18} />
            Emergency
          </Link>

          <div className="h-6 w-px bg-gray-300 mx-2"></div>

          {/* AUTHENTICATED USER */}
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 font-medium transition"
              >
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <User size={18} />
                </div>
                <span className="hidden lg:block">Account</span>
                <ChevronDown size={16} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <p className="text-sm font-medium text-gray-900">User Account</p>
                  </div>
                  
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User size={16} /> My Profile
                    </Link>
                    <Link
                      to="/dashboard/vehicles"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      <Car size={16} /> My Vehicles
                    </Link>
                    {/* Placeholder for history if page doesn't exist yet */}
                    <Link
                      to="/dashboard/vehicles" 
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      <FileText size={16} /> Service History
                    </Link>
                  </div>

                  <div className="border-t border-gray-100 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* GUEST USER */
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition"
              >
                Login
              </Link>
              <Link
                to="/mechanic-registration"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
              >
                <UserPlus size={16} />
                Join as Mechanic
              </Link>
            </div>
          )}
        </nav>

        {/* MOBILE MENU BUTTON */}
        <button
          className="md:hidden p-2 text-gray-600 rounded-lg hover:bg-gray-100"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <nav className="md:hidden bg-white border-t border-gray-200 shadow-lg absolute w-full left-0 z-40">
          <div className="flex flex-col p-4 gap-2">
            
            <NavLink
              to="/nearby-mechanics"
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setMenuOpen(false)}
            >
              <Wrench size={20} /> Find Mechanic
            </NavLink>

            <NavLink
              to="/vehicle-rc"
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg ${isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => setMenuOpen(false)}
            >
              <Search size={20} /> RC Check
            </NavLink>

            <Link
              to="/puncture-request"
              className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg font-medium"
              onClick={() => setMenuOpen(false)}
            >
              <AlertTriangle size={20} /> Emergency Request
            </Link>

            <div className="h-px bg-gray-100 my-2"></div>

            {isAuthenticated ? (
              <>
                <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMenuOpen(false)}>
                  <User size={20} /> My Profile
                </Link>
                <Link to="/dashboard/vehicles" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => setMenuOpen(false)}>
                  <Car size={20} /> My Vehicles
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg w-full text-left"
                >
                  <LogOut size={20} /> Logout
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 mt-2">
                <Link
                  to="/login"
                  className="w-full text-center px-4 py-3 border border-gray-200 rounded-lg font-medium hover:bg-gray-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/mechanic-registration"
                  className="w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                  onClick={() => setMenuOpen(false)}
                >
                  Join as Mechanic
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

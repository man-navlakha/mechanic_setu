import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from '../../utils/api';

const readCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const nameEQ = `${name}=`;
  return (
    document.cookie
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith(nameEQ))
      ?.slice(nameEQ.length) || null
  );
};

const getAccessToken = () => {
  if (typeof window === 'undefined') return null;
  const localToken = localStorage.getItem('access');
  const cookieToken = readCookie('access');
  return localToken || cookieToken;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Memoize the redirect path from the query parameters
  const redirectPath = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('redirect') || '/';
  }, [location.search]);

  // Check if the user is already authenticated
  const checkLoginStatus = useCallback(async () => {
    try {
      // This request will either succeed or throw a 401 error
      const token = getAccessToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
      await api.get("core/me/", { headers });
      // If it succeeds, the user is already logged in, so redirect them
      navigate(redirectPath, { replace: true });
    } catch (err) {
      // User is not logged in, which is expected on this page.
      console.log("Not logged in, showing login page.");
    }
  }, [navigate, redirectPath]);

  useEffect(() => {
    checkLoginStatus();
  }, [checkLoginStatus]);


  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/users/Login_SignUp', { email }, { withCredentials: true });
      navigate("/verify", { state: { key: res.data.key, id: res.data.id, status: res.data.status, email: email } });
    } catch (err) {
      console.error("Login failed:", err);
      setError(err.response?.data?.error || 'Login failed. Please check your email or try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setError('');
    if (!credentialResponse?.credential) {
      setError("Google credential was not received. Please try again.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/users/google/", { token: credentialResponse.credential }, { withCredentials: true });

      // After successful Google login, the backend should set the necessary session/token
      // Then we can navigate the user
      if (res.data.status === 'New User') {
        navigate('/form', { state: { status: "Google" } });
      } else {
        navigate(redirectPath, { replace: true });
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError(err.response?.data?.detail || "Google login failed on our server.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-800 via-slate-900 to-blue-900 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white/10 backdrop-blur-md rounded-xl shadow-lg border border-white/20">
        
        <div className="text-center text-white">
          <img src="/ms.png" alt="Mechanic Setu Logo" className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-white/30" />
          <h1 className="text-3xl font-bold tracking-wider">MECHANIC SETU</h1>
          <p className="text-sm text-gray-300 italic">Always at emergency</p>
        </div>

        <form className="space-y-4" onSubmit={handleEmailLogin}>
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 bg-white/20 rounded-lg border border-transparent focus:border-white/50 focus:ring-0 text-white placeholder-gray-300 focus:outline-none transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? 'Please wait...' : 'Continue with Email'}
          </button>
        </form>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <div className="flex items-center justify-center space-x-2">
          <hr className="w-full border-white/20" />
          <span className="text-gray-300 text-sm">OR</span>
          <hr className="w-full border-white/20" />
        </div>
        
        <div className="flex justify-center">
            <GoogleLogin
                onSuccess={handleGoogleLogin}
                onError={() => {
                    setError('Google Login Failed. Please try again.');
                }}
                useOneTap
            />
        </div>

      </div>
    </div>
  );
};

export default LoginPage;

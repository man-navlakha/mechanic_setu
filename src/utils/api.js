import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

// Flags to avoid loops
let isRefreshing = false;
let refreshSubscribers = [];

// Retry queued requests after refresh
function onRefreshed() {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
}

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

// Request interceptor: Attach Bearer token to every request if it exists
api.interceptors.request.use(
  (config) => {
    const accessToken = Cookies.get("access");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loop if refresh request itself fails
    // or if the URL is undefined
    const url = originalRequest.url || "";
    const isRefreshRequest = url.includes("core/token/refresh");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isRefreshRequest
    ) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh(() => resolve(api(originalRequest)));
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = Cookies.get("refresh");
        const csrftoken = Cookies.get("csrftoken"); // Get CSRF token

        // Correct Django endpoint for Render backend
        const res = await axios.post("api/core/token/refresh/",
          { refresh: refreshToken },
          {
            withCredentials: true,
            headers: {
              'X-CSRFToken': csrftoken
            }
          }
        );

        console.log("Refresh successful, updating cookies...");

        // Sync tokens manually into cookies if the backend returned them in the body
        if (res.data?.access) {
          Cookies.set("access", res.data.access);
          // Also set Authorization header for subsequent requests
          api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`;
        }
        if (res.data?.refresh) {
          Cookies.set("refresh", res.data.refresh);
        }

        isRefreshing = false;
        onRefreshed();
        Cookies.set("Logged", true);

        // Update the header for the retried request specifically
        if (res.data?.access) {
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        console.error("Refresh failed, logging out:", refreshError);
        isRefreshing = false;
        Cookies.set("Logged", false);
        Cookies.remove("access");
        Cookies.remove("refresh");

        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

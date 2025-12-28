import axios from "axios";

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 🔐 Attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔄 Refresh token logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem("refreshToken");
          if (!refreshToken) {
            isRefreshing = false;
            return Promise.reject(error);
          }

          // ⬇️ YOUR CORRECT URL (NO CAMBIADA)
          const res = await axios.post(
            "http://localhost:8000/api/auth/token/refresh/",
            { refresh: refreshToken }
          );

          const newAccess = res.data.access;
          localStorage.setItem("accessToken", newAccess);

          isRefreshing = false;
          onRefreshed(newAccess);

        } catch (err) {
          isRefreshing = false;
          return Promise.reject(err);
        }
      }

      return new Promise((resolve) => {
        addRefreshSubscriber((newToken) => {
          originalRequest.headers.Authorization = "Bearer " + newToken;
          resolve(api(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

// 📌 Wrapper similar a fetch, usado por chatService
export async function authFetch(url: string, options: any = {}) {
  return api({
    url,
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  }).then((res) => res.data);
}

export default api;
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const startupListeners = new Set<(isStarting: boolean) => void>();
let pendingRequests = 0;
let startupTimer: ReturnType<typeof setTimeout> | undefined;
let isServerStarting = false;

const notifyStartupListeners = (isStarting: boolean) => {
  isServerStarting = isStarting;
  startupListeners.forEach((listener) => listener(isStarting));
};

const startTrackingRequest = () => {
  pendingRequests += 1;
  if (pendingRequests === 1) {
    startupTimer = setTimeout(() => {
      if (pendingRequests > 0) {
        notifyStartupListeners(true);
      }
    }, 5000);
  }
};

const finishTrackingRequest = () => {
  pendingRequests = Math.max(0, pendingRequests - 1);
  if (pendingRequests === 0) {
    if (startupTimer) {
      clearTimeout(startupTimer);
      startupTimer = undefined;
    }
    if (isServerStarting) {
      notifyStartupListeners(false);
    }
  }
};

export const subscribeToServerStartup = (listener: (isStarting: boolean) => void) => {
  startupListeners.add(listener);
  listener(isServerStarting);
  return () => {
    startupListeners.delete(listener);
  };
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    startTrackingRequest();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    finishTrackingRequest();
    return response;
  },
  (error: AxiosError) => {
    finishTrackingRequest();
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
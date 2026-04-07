import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const ACCESS_TOKEN_KEY = 'byld_access_token';
const REFRESH_TOKEN_KEY = 'byld_refresh_token';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

const client = axios.create({ baseURL: BASE_URL });

// Attach access token to every request
client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Track whether a token refresh is already in flight to avoid loops
let refreshing = false;

client.interceptors.response.use(
  (response) => {
    // Unwrap the { success, data } envelope
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  async (error: AxiosError<{ success: false; error: { code: string; message: string } }>) => {
    const original = error.config;

    if (error.response?.status === 401 && original && !refreshing) {
      refreshing = true;
      const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (storedRefresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
            refresh_token: storedRefresh,
          });
          const newAccess: string = data?.data?.access_token ?? data?.access_token;
          localStorage.setItem(ACCESS_TOKEN_KEY, newAccess);
          original.headers.Authorization = `Bearer ${newAccess}`;
          return client(original);
        } catch {
          // Refresh failed — clear session and redirect
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          window.location.href = '/login';
        } finally {
          refreshing = false;
        }
      } else {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        window.location.href = '/login';
      }
    }

    // Surface the error envelope message if present
    const message = error.response?.data?.error?.message ?? error.message;
    return Promise.reject(new Error(message));
  }
);

export default client;
export { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY };

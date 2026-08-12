import axios from 'axios';
import { useAuthStore } from './stores/auth';
import router from './router';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080'
});

// Interceptor para añadir el token automáticamente a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores globales, especialmente el 401 (Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const authStore = useAuthStore();
      console.warn("Sesión expirada o no autorizada. Redirigiendo a login...");
      
      authStore.logout();
      
      if (router.currentRoute.value.name !== 'Login') {
        router.push('/login').then(() => {
          window.location.reload();
        });
      }
    }
    return Promise.reject(error);
  }
);

export default api;

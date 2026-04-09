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
      
      // Solo redirigir si no estamos ya en la página de login
      if (router.currentRoute.value.name !== 'Login') {
        authStore.logout();
        router.push('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

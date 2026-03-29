import { defineStore } from 'pinia';
import api from '../api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    role: localStorage.getItem('role') || null,
    username: localStorage.getItem('username') || null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.role === 'ADMIN',
  },
  actions: {
    async login(username, password) {
      try {
        const response = await api.post('/api/v1/auth/authenticate', {
          username,
          password,
        });
        this.token = response.data.token;
        this.role = response.data.role;
        this.username = username;
        localStorage.setItem('token', this.token);
        localStorage.setItem('role', this.role);
        localStorage.setItem('username', this.username);
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        return true;
      } catch (error) {
        console.error('Login error:', error);
        return false;
      }
    },
    logout() {
      this.token = null;
      this.role = null;
      this.username = null;
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      delete api.defaults.headers.common['Authorization'];
    },
  },
});

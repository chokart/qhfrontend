import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Login from '../views/Login.vue';
import AdminPanel from '../views/AdminPanel.vue';
import UserDashboard from '../views/UserDashboard.vue';

const routes = [
  { path: '/login', component: Login, name: 'Login' },
  { 
    path: '/admin', 
    component: AdminPanel,
    name: 'Admin',
    beforeEnter: (to, from, next) => {
      const authStore = useAuthStore();
      if (authStore.isAuthenticated && authStore.isAdmin) {
        next();
      } else {
        next('/login');
      }
    }
  },
  { 
    path: '/', 
    component: UserDashboard,
    name: 'User',
    beforeEnter: (to, from, next) => {
      const authStore = useAuthStore();
      if (authStore.isAuthenticated) {
        // Si es admin, lo mandamos al panel de admin
        if (authStore.isAdmin) {
          next('/admin');
        } else {
          next();
        }
      } else {
        next('/login');
      }
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

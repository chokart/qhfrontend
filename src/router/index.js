import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Login from '../views/Login.vue';
import AdminPanel from '../views/AdminPanel.vue';
import UserDashboard from '../views/UserDashboard.vue';

const routes = [
  { 
    path: '/login', 
    component: Login, 
    name: 'Login',
    meta: { requiresAuth: false }
  },
  { 
    path: '/admin', 
    component: AdminPanel,
    name: 'Admin',
    meta: { requiresAuth: true, role: 'ADMIN' }
  },
  { 
    path: '/', 
    component: UserDashboard,
    name: 'User',
    meta: { requiresAuth: true, role: 'USER' }
  },
  // Redirección para rutas no encontradas
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// GUARD GLOBAL: Revisa la sesión antes de cada navegación
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;
  const userRole = authStore.role;

  // 1. Si la ruta requiere autenticación y no está logueado -> Al Login
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'Login' });
  }

  // 2. Si ya está logueado e intenta ir al Login -> Redirigir según su rol
  if (to.name === 'Login' && isAuthenticated) {
    return next(userRole === 'ADMIN' ? { name: 'Admin' } : { name: 'User' });
  }

  // 3. Protección de rutas por Rol (Admin solo a Admin, User no a Admin)
  if (to.meta.role === 'ADMIN' && userRole !== 'ADMIN') {
    return next({ name: 'User' });
  }

  // 4. Si un ADMIN intenta entrar a la vista de USER (Dashboard simple), 
  // decidimos si dejarlo pasar o mandarlo a su panel pro.
  if (to.name === 'User' && userRole === 'ADMIN') {
    return next({ name: 'Admin' });
  }

  next();
});

export default router;

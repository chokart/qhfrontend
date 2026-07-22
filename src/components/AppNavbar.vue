<template>
  <nav class="app-navbar">
    <div class="navbar-brand" @click="navigateToHome">
      <div class="brand-icon">🚜</div>
      <div class="brand-text">
        <span class="brand-title">QH RELAVERA</span>
        <span class="brand-subtitle">Gestión Operacional</span>
      </div>
    </div>

    <div class="navbar-links">
      <router-link :to="homePath" class="nav-item" :class="{ active: isHomeActive }">
        <span class="nav-icon">🗺️</span>
        <span class="nav-label">Mapa Equipos</span>
      </router-link>

      <router-link to="/canchas" class="nav-item" active-class="active">
        <span class="nav-icon">📊</span>
        <span class="nav-label">Control Canchas</span>
      </router-link>

      <router-link to="/personal" class="nav-item" active-class="active">
        <span class="nav-icon">👥</span>
        <span class="nav-label">Personal</span>
      </router-link>
    </div>

    <div class="navbar-user">
      <div class="user-badge">
        <span class="user-avatar">👤</span>
        <div class="user-details">
          <span class="user-name">{{ authStore.username || 'Usuario' }}</span>
          <span class="role-chip" :class="authStore.role ? authStore.role.toLowerCase() : 'user'">
            {{ authStore.role || 'USER' }}
          </span>
        </div>
      </div>

      <button @click="handleLogout" class="btn-logout" title="Cerrar Sesión">
        <span class="logout-icon">🚪</span>
        <span class="logout-text">Salir</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter, useRoute } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();

const homePath = computed(() => {
  return authStore.isAdmin ? '/admin' : '/';
});

const isHomeActive = computed(() => {
  return route.path === '/' || route.path === '/admin';
});

const navigateToHome = () => {
  router.push(homePath.value);
};

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.app-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  padding: 0.75rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  position: sticky;
  top: 0;
  z-index: 1000;
  margin-bottom: 1.5rem;
}

.navbar-brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  user-select: none;
}

.brand-icon {
  font-size: 1.75rem;
  background: #f1f5f9;
  padding: 0.35rem 0.5rem;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.brand-subtitle {
  font-size: 0.72rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.navbar-links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 0.35rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 600;
  color: #475569;
  transition: all 0.2s ease;
}

.nav-item:hover {
  color: #1e293b;
  background: #ffffff;
}

.nav-item.active {
  background: #4f46e5;
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
}

.nav-icon {
  font-size: 1rem;
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-badge {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: #f8fafc;
  padding: 0.35rem 0.85rem;
  border-radius: 30px;
  border: 1px solid #e2e8f0;
}

.user-avatar {
  font-size: 1rem;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.1;
}

.role-chip {
  font-size: 0.65rem;
  font-weight: 800;
  text-transform: uppercase;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  letter-spacing: 0.04em;
}

.role-chip.admin {
  background: #e0e7ff;
  color: #4338ca;
}

.role-chip.user {
  background: #e2e8f0;
  color: #475569;
}

.btn-logout {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-logout:hover {
  background: #dc2626;
  color: #ffffff;
  border-color: #dc2626;
}

@media (max-width: 768px) {
  .app-navbar {
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }

  .navbar-links {
    width: 100%;
    justify-content: space-around;
  }

  .nav-item {
    padding: 0.45rem 0.65rem;
    font-size: 0.82rem;
  }

  .logout-text {
    display: none;
  }
}
</style>

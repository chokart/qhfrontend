<template>
  <div class="auth-container">
    <h2>Iniciar Sesión</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label>Usuario:</label>
        <input type="text" v-model="username" required />
      </div>
      <div class="form-group">
        <label>Contraseña:</label>
        <input type="password" v-model="password" required />
      </div>
      <button type="submit">Entrar</button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const error = ref('');
const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async () => {
  const success = await authStore.login(username.value, password.value);
  if (success) {
    if (authStore.isAdmin) {
      router.push('/admin');
    } else {
      router.push('/');
    }
  } else {
    error.value = 'Usuario o contraseña incorrectos';
  }
};
</script>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #2c2c2c;
  color: white;
}
.form-group {
  margin-bottom: 15px;
  text-align: left;
}
input {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
  box-sizing: border-box;
  background: #444;
  border: 1px solid #666;
  color: white;
}
button {
  width: 100%;
  padding: 10px;
  background-color: #aa3bff;
  color: white;
  border: none;
  cursor: pointer;
  font-weight: bold;
}
button:hover {
  background-color: #8a2be2;
}
.error {
  color: #ff6b6b;
  margin-top: 10px;
}
</style>

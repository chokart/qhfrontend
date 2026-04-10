<template>
  <div class="area-list-card">
    <h2>Zonas de Trabajo Registradas</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Nombre de la Zona</th>
            <th>Tipo</th>
            <th>Puntos de Control</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="area in areas" :key="area.id">
            <td>
              <span class="area-icon">⬚</span>
              <b>{{ area.name }}</b>
            </td>
            <td><span class="badge">Rectángulo</span></td>
            <td class="coords-count">{{ getCoordCount(area.coordinatesJson) }} puntos</td>
            <td>
              <button @click="$emit('delete', area.id)" class="btn-delete-small">Eliminar</button>
            </td>
          </tr>
          <tr v-if="areas.length === 0">
            <td colspan="4" class="empty">No hay zonas dibujadas aún</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  areas: { type: Array, required: true }
});

const getCoordCount = (json) => {
  try {
    return JSON.parse(json).length;
  } catch (e) { return 0; }
};
</script>

<style scoped>
.area-list-card { 
  background: var(--card-light); 
  padding: 1.5rem; 
  border-radius: 20px; 
  box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
  color: var(--text-main); 
  border: 1px solid var(--card-border);
}
h2 { margin-top: 0; margin-bottom: 1.5rem; font-size: 1.25rem; font-weight: 700; color: var(--text-main); }
.table-container { overflow-x: auto; max-height: 500px; border-radius: 12px; border: 1px solid var(--card-border); }
table { width: 100%; border-collapse: separate; border-spacing: 0; text-align: left; }
th { 
  padding: 1rem; 
  background: #f8fafc;
  border-bottom: 1px solid var(--card-border); 
  color: var(--text-muted); 
  text-transform: uppercase; 
  font-size: 0.7rem; 
  letter-spacing: 0.05em;
  font-weight: 700;
}
td { padding: 1rem; border-bottom: 1px solid var(--card-border); font-size: 0.9rem; color: #334155; }
tr:last-child td { border-bottom: none; }
tr:hover td { background: #f1f5f9; }

.area-icon { margin-right: 12px; color: var(--primary); font-size: 1.1rem; vertical-align: middle; }
.badge { background: #f1f5f9; color: #475569; padding: 0.25rem 0.6rem; border-radius: 4px; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; border: 1px solid #e2e8f0; }
.coords-count { color: var(--text-muted); font-size: 0.8rem; font-weight: 500; }

.btn-delete-small { 
  background: #fff; 
  color: #ef4444; 
  border: 1px solid #fecaca; 
  padding: 0.4rem 0.8rem; 
  border-radius: 8px; 
  cursor: pointer; 
  font-size: 0.75rem; 
  font-weight: 700;
  transition: all 0.2s;
}
.btn-delete-small:hover { background: #ef4444; color: white; border-color: #ef4444; }
.empty { text-align: center; padding: 4rem; color: var(--text-muted); font-style: italic; }
</style>

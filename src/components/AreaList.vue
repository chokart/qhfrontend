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
.area-list-card { background: #2f2f2f; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); color: #eee; margin-top: 20px; }
h2 { margin-top: 0; border-bottom: 1px solid #aa3bff; padding-bottom: 10px; font-size: 18px; color: #aa3bff; }
.table-container { overflow-x: auto; max-height: 300px; }
table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
th { padding: 12px; border-bottom: 2px solid #444; color: #aaa; font-size: 12px; }
td { padding: 12px; border-bottom: 1px solid #333; }
.area-icon { margin-right: 10px; color: #aa3bff; font-size: 18px; }
.badge { background: #444; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
.coords-count { color: #777; font-style: italic; }
.btn-delete-small { background: #ff4757; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px; }
.btn-delete-small:hover { background: #ff6b81; }
.empty { text-align: center; padding: 20px; color: #777; }
</style>

<template>
  <div class="summary-container">
    <div class="summary-card">
      <h2>Resumen por Categoría</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Categoría</th>
              <th class="text-center">OP</th>
              <th class="text-center">SB</th>
              <th class="text-center">IN</th>
              <th class="text-center">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cat in categorySummary" :key="cat.name">
              <td><b>{{ cat.name }}</b></td>
              <td class="text-center status-op">{{ cat.operativo }}</td>
              <td class="text-center status-sb">{{ cat.standby }}</td>
              <td class="text-center status-in">{{ cat.inoperativo }}</td>
              <td class="text-center"><b>{{ cat.total }}</b></td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td>TOTAL GENERAL</td>
              <td class="text-center">{{ totals.operativo }}</td>
              <td class="text-center">{{ totals.standby }}</td>
              <td class="text-center">{{ totals.inoperativo }}</td>
              <td class="text-center">{{ totals.total }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div class="summary-card">
      <h2>Equipos por Área</h2>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Nombre de Área</th>
              <th class="text-center">Cantidad</th>
              <th>Equipos</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="area in areaSummary" :key="area.name">
              <td><b>{{ area.name }}</b></td>
              <td class="text-center"><span class="area-count-badge">{{ area.count }}</span></td>
              <td class="area-equipment-list">{{ area.equipmentNames.join(', ') }}</td>
            </tr>
            <tr v-if="areaSummary.length === 0">
              <td colspan="3" class="text-center empty">No hay equipos en áreas registradas</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  equipment: { type: Array, required: true }
});

const categorySummary = computed(() => {
  const categories = [
    { name: 'Tractores D8', check: (n) => n.startsWith('D8') },
    { name: 'Tractores D9', check: (n) => n.startsWith('D9') },
    { name: 'Tractores D10', check: (n) => n.startsWith('D10') },
    { name: 'Excavadoras', check: (n) => n.includes('Exc.') },
    { name: 'Cargadores', check: (n) => n.includes('Cargador') },
    { name: 'Motoniveladoras', check: (n) => n.includes('Motoniveladora') },
    { name: 'Retroexcavadoras', check: (n) => n.includes('Retroexcavadora') },
    { name: 'Rodillos', check: (n) => n.includes('Rodillo') },
    { name: 'Volquetes', check: (n) => n.includes('Volquete') }
  ];

  const stats = categories.map(cat => ({
    name: cat.name,
    operativo: 0,
    standby: 0,
    inoperativo: 0,
    total: 0
  }));

  const others = { name: 'Otros', operativo: 0, standby: 0, inoperativo: 0, total: 0 };

  props.equipment.forEach(eq => {
    const categoryStats = stats.find(s => categories.find(c => c.name === s.name).check(eq.name));
    const target = categoryStats || others;
    
    target.total++;
    if (eq.status === 'OPERATIVO') target.operativo++;
    else if (eq.status === 'STAND_BY') target.standby++;
    else if (eq.status === 'INOPERATIVO') target.inoperativo++;
  });

  const finalSummary = stats.filter(s => s.total > 0);
  if (others.total > 0) finalSummary.push(others);
  
  return finalSummary;
});

const areaSummary = computed(() => {
  const areasMap = {};
  
  props.equipment.forEach(eq => {
    const areaName = eq.currentArea || 'Fuera de zona';
    if (!areasMap[areaName]) {
      areasMap[areaName] = { name: areaName, count: 0, equipmentNames: [] };
    }
    areasMap[areaName].count++;
    areasMap[areaName].equipmentNames.push(eq.name);
  });

  // Ordenar para poner "Fuera de zona" al final si existe
  return Object.values(areasMap).sort((a, b) => {
    if (a.name === 'Fuera de zona') return 1;
    if (b.name === 'Fuera de zona') return -1;
    return b.count - a.count;
  });
});

const totals = computed(() => {
  return categorySummary.value.reduce((acc, curr) => {
    acc.operativo += curr.operativo;
    acc.standby += curr.standby;
    acc.inoperativo += curr.inoperativo;
    acc.total += curr.total;
    return acc;
  }, { operativo: 0, standby: 0, inoperativo: 0, total: 0 });
});
</script>

<style scoped>
.summary-container { display: flex; flex-direction: column; gap: 20px; }
.summary-card { background: #2f2f2f; padding: 20px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); color: #eee; }
h2 { margin-top: 0; border-bottom: 1px solid #444; padding-bottom: 10px; font-size: 18px; color: #ffa502; }
.table-container { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { padding: 8px; border-bottom: 2px solid #444; color: #aaa; text-transform: uppercase; font-size: 10px; }
td { padding: 8px; border-bottom: 1px solid #333; }
.text-center { text-align: center; }
.status-op { color: #2ed573; font-weight: bold; }
.status-sb { color: #ffa502; font-weight: bold; }
.status-in { color: #ff4757; font-weight: bold; }
.total-row { background: #3d3d3d; font-weight: bold; color: white; }
.total-row td { border-top: 2px solid #555; }

.area-count-badge { background: #aa3bff; color: white; padding: 2px 8px; border-radius: 10px; font-weight: bold; }
.area-equipment-list { font-size: 11px; color: #aaa; font-style: italic; }
.empty { padding: 20px; color: #777; }

@media (min-width: 1024px) {
  .summary-container { flex-direction: row; }
  .summary-card { flex: 1; }
}
</style>

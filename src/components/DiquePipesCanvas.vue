<template>
  <div class="dique-pipes-container">
    <!-- Encabezado y Control de Lienzo a Escala -->
    <div class="canvas-header">
      <div class="header-info">
        <div class="title-badge">📐 Plano a Escala 8:1</div>
        <div>
          <h3 class="canvas-title">Lienzo de Tuberías - Dique Principal</h3>
          <p class="canvas-subtitle">Dimensiones Reales: <b>4.0 km (4,000 m) de largo × 0.5 km (500 m) de alto</b></p>
        </div>
      </div>

      <div class="toolbar-actions">
        <!-- Selector de Herramienta -->
        <div class="tool-btn-group">
          <button 
            :class="['btn-tool', { active: currentTool === 'select' }]" 
            @click="currentTool = 'select'"
            title="Seleccionar o mover tuberías"
          >
            👆 Seleccionar
          </button>
          <button 
            :class="['btn-tool btn-draw', { active: currentTool === 'draw' }]" 
            @click="startDrawingTool"
            title="Trazar nueva tubería a escala"
          >
            ✏️ Trazar Tubería
          </button>
        </div>

        <div class="v-divider"></div>

        <!-- Filtro por Estado de Tubería -->
        <select v-model="filterStatus" class="select-pipe-filter">
          <option value="ALL">📋 Todas las Tuberías ({{ pipes.length }})</option>
          <option value="ACTIVA">🟢 Activas</option>
          <option value="MANTENIMIENTO">🟡 En Mantenimiento</option>
          <option value="INACTIVA">🔴 Inactivas</option>
          <option value="PROYECTADA">🔵 Proyectadas</option>
        </select>

        <button @click="showHelpModal = true" class="btn-help-pipes" title="Ayuda sobre la escala y uso">
          ❓ Ayuda Escala
        </button>

        <button @click="resetPipes" class="btn-clear-pipes" title="Restablecer tuberías de ejemplo">
          🔄 Reiniciar
        </button>
      </div>
    </div>

    <!-- RECTÁNGULO PRINCIPAL A ESCALA 8:1 (4.0 KM x 0.5 KM) -->
    <div class="scaled-viewport-wrapper">
      <!-- Regla Superior X (0 a 4000 metros / 4 km) -->
      <div class="ruler-x">
        <div v-for="mark in xRulerMarks" :key="'rx_'+mark.m" class="ruler-x-mark" :style="{ left: mark.pct + '%' }">
          <div class="mark-line-x"></div>
          <span class="mark-text-x">{{ mark.label }}</span>
        </div>
      </div>

      <div class="viewport-main-row">
        <!-- Regla Izquierda Y (0 a 500 metros / 0.5 km) -->
        <div class="ruler-y">
          <div v-for="mark in yRulerMarks" :key="'ry_'+mark.m" class="ruler-y-mark" :style="{ top: mark.pct + '%' }">
            <span class="mark-text-y">{{ mark.label }}</span>
            <div class="mark-line-y"></div>
          </div>
        </div>

        <!-- Lienzo SVG Interactivo -->
        <div 
          ref="svgContainerRef" 
          class="svg-canvas-container"
          @mousemove="handleMouseMove"
          @mouseleave="handleMouseLeave"
          @click="handleCanvasClick"
        >
          <svg 
            class="pipes-svg"
            viewBox="0 0 4000 500" 
            preserveAspectRatio="none"
          >
            <!-- Fondo Grilla a Escala (bloques de 500m x 100m) -->
            <defs>
              <pattern id="gridPattern" width="500" height="100" patternUnits="userSpaceOnUse">
                <path d="M 500 0 L 0 0 0 100" fill="none" stroke="#e2e8f0" stroke-width="2" stroke-dasharray="4,4"/>
              </pattern>
              <!-- Marcador de Flechas para sentido de flujo -->
              <marker id="arrowHead" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#0284c7" />
              </marker>
            </defs>

            <rect width="4000" height="500" fill="#f8fafc" />
            <rect width="4000" height="500" fill="url(#gridPattern)" />

            <!-- Franjas de Canchas Dique Principal repartidas a lo largo de los 4 km -->
            <g class="canchas-regions-group">
              <g 
                v-for="(cancha, idx) in canchasRegionList" 
                :key="'c_reg_'+cancha.id"
                :class="['cancha-region', { active: selectedCanchaId === cancha.id }]"
                @click.stop="selectCanchaRegion(cancha)"
              >
                <rect 
                  :x="cancha.x" 
                  y="10" 
                  :width="cancha.width" 
                  height="480" 
                  :fill="selectedCanchaId === cancha.id ? 'rgba(56, 189, 248, 0.15)' : (idx % 2 === 0 ? 'rgba(241, 245, 249, 0.6)' : 'rgba(255, 255, 255, 0.4)')"
                  :stroke="selectedCanchaId === cancha.id ? '#0284c7' : '#cbd5e1'"
                  stroke-width="2"
                  stroke-dasharray="6,4"
                  rx="6"
                />
                <text 
                  :x="cancha.x + cancha.width / 2" 
                  y="35" 
                  text-anchor="middle" 
                  fill="#475569" 
                  font-size="22" 
                  font-weight="bold"
                >
                  Cancha #{{ cancha.number }}
                </text>
                <text 
                  :x="cancha.x + cancha.width / 2" 
                  y="60" 
                  text-anchor="middle" 
                  fill="#64748b" 
                  font-size="16"
                >
                  ({{ Math.round(cancha.x) }}m - {{ Math.round(cancha.x + cancha.width) }}m)
                </text>
              </g>
            </g>

            <!-- Renderizado de Tuberías Dibujadas -->
            <g class="pipes-layer">
              <g 
                v-for="pipe in visiblePipes" 
                :key="pipe.id"
                :class="['pipe-group', { selected: selectedPipeId === pipe.id }]"
                @click.stop="selectPipe(pipe)"
              >
                <!-- Línea Sombra para Selección / Interacción -->
                <line 
                  :x1="pipe.x1" :y1="pipe.y1" 
                  :x2="pipe.x2" :y2="pipe.y2" 
                  stroke="rgba(2, 132, 199, 0.3)" 
                  :stroke-width="getPipeStrokeWidth(pipe.diameter) + 12" 
                  stroke-linecap="round"
                  v-if="selectedPipeId === pipe.id"
                />

                <!-- Línea Principal de Tubería -->
                <line 
                  :x1="pipe.x1" :y1="pipe.y1" 
                  :x2="pipe.x2" :y2="pipe.y2" 
                  :stroke="getPipeColor(pipe.status)" 
                  :stroke-width="getPipeStrokeWidth(pipe.diameter)" 
                  :stroke-dasharray="pipe.status === 'MANTENIMIENTO' ? '12,8' : (pipe.status === 'PROYECTADA' ? '6,6' : 'none')"
                  stroke-linecap="round"
                  marker-end="url(#arrowHead)"
                />

                <!-- Puntos Terminales (Nodos Origen y Fin) -->
                <circle :cx="pipe.x1" :cy="pipe.y1" r="10" :fill="getPipeColor(pipe.status)" stroke="#ffffff" stroke-width="3" />
                <circle :cx="pipe.x2" :cy="pipe.y2" r="10" :fill="getPipeColor(pipe.status)" stroke="#ffffff" stroke-width="3" />

                <!-- Etiqueta de la Tubería con Longitud Calculada a Escala -->
                <g :transform="`translate(${(pipe.x1 + pipe.x2) / 2}, ${(pipe.y1 + pipe.y2) / 2 - 14})`">
                  <rect 
                    x="-65" y="-18" width="130" height="26" 
                    fill="#ffffff" 
                    stroke="#cbd5e1" 
                    rx="6" 
                    shadow="0 2px 4px rgba(0,0,0,0.1)"
                  />
                  <text 
                    x="0" y="-1" 
                    text-anchor="middle" 
                    fill="#0f172a" 
                    font-size="14" 
                    font-weight="bold"
                  >
                    {{ pipe.name || 'Tubería' }} ({{ formatDistanceKm(getPipeDistance(pipe)) }})
                  </text>
                </g>
              </g>
            </g>

            <!-- Previsualización de Trazo al Dibujar Nueva Tubería -->
            <g v-if="isDrawing && drawStartPoint" class="drawing-preview-group">
              <line 
                :x1="drawStartPoint.x" :y1="drawStartPoint.y" 
                :x2="mouseRealCoords.x" :y2="mouseRealCoords.y" 
                stroke="#0284c7" 
                stroke-width="6" 
                stroke-dasharray="8,6"
                stroke-linecap="round"
              />
              <circle :cx="drawStartPoint.x" :cy="drawStartPoint.y" r="12" fill="#0284c7" stroke="#ffffff" stroke-width="3" />
              <circle :cx="mouseRealCoords.x" :cy="mouseRealCoords.y" r="12" fill="#0284c7" stroke="#ffffff" stroke-width="3" />

              <!-- Tooltip flotante de longitud mientras dibuja -->
              <g :transform="`translate(${(drawStartPoint.x + mouseRealCoords.x) / 2}, ${(drawStartPoint.y + mouseRealCoords.y) / 2 - 20})`">
                <rect x="-80" y="-20" width="160" height="30" fill="#0f172a" rx="8" opacity="0.9" />
                <text x="0" y="0" text-anchor="middle" fill="#ffffff" font-size="15" font-weight="bold">
                  Largo: {{ formatDistanceKm(calculateDistance(drawStartPoint, mouseRealCoords)) }}
                </text>
              </g>
            </g>
          </svg>

          <!-- Tooltip de Coordenadas del Cursor a Escala -->
          <div v-if="mouseHovering" class="cursor-tooltip" :style="{ left: mouseClientPos.x + 15 + 'px', top: mouseClientPos.y - 35 + 'px' }">
            <span class="tooltip-coord">📍 <b>X:</b> {{ (mouseRealCoords.x / 1000).toFixed(2) }} km ({{ Math.round(mouseRealCoords.x) }}m) | <b>Y:</b> {{ (mouseRealCoords.y / 1000).toFixed(2) }} km ({{ Math.round(mouseRealCoords.y) }}m)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- PANEL INFERIOR: FORMULARIO DE PROPIEDADES DE TUBERÍA SELECCIONADA O NUEVA -->
    <div v-if="selectedPipe" class="pipe-editor-card card">
      <div class="card-header-inner">
        <div>
          <h4>✏️ Propiedades de Tubería: {{ selectedPipe.name }}</h4>
          <p class="table-sub-desc">
            Longitud Calculada a Escala: <b>{{ formatDistanceKm(getPipeDistance(selectedPipe)) }}</b> 
            ({{ Math.round(getPipeDistance(selectedPipe)) }} metros)
          </p>
        </div>
        <button class="btn-delete-pipe" @click="deleteSelectedPipe">🗑️ Eliminar Tubería</button>
      </div>

      <div class="pipe-form-grid">
        <div class="form-group">
          <label class="form-label">Nombre / Código:</label>
          <input type="text" v-model="selectedPipe.name" class="form-input" placeholder="Ej. Línea Principal Arenas" />
        </div>

        <div class="form-group">
          <label class="form-label">Material / Especificación:</label>
          <select v-model="selectedPipe.material" class="form-select">
            <option value="HDPE PE100">HDPE PE100 High Density</option>
            <option value="Acero Carbono">Acero al Carbono</option>
            <option value="PVC Schedule 80">PVC Schedule 80</option>
            <option value="FIBRA DE VIDRIO">Fibra de Vidrio (GRP)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Diámetro:</label>
          <select v-model="selectedPipe.diameter" class="form-select">
            <option value="8">8 Pulgadas (200 mm)</option>
            <option value="12">12 Pulgadas (300 mm)</option>
            <option value="16">16 Pulgadas (400 mm)</option>
            <option value="20">20 Pulgadas (500 mm)</option>
            <option value="24">24 Pulgadas (600 mm)</option>
            <option value="30">30 Pulgadas (750 mm)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Estado Operativo:</label>
          <select v-model="selectedPipe.status" class="form-select">
            <option value="ACTIVA">🟢 Activa (Operativa)</option>
            <option value="MANTENIMIENTO">🟡 En Mantenimiento</option>
            <option value="INACTIVA">🔴 Inactiva / Fuera de servicio</option>
            <option value="PROYECTADA">🔵 Proyectada / En construcción</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Cancha Asociada:</label>
          <select v-model="selectedPipe.canchaId" class="form-select">
            <option :value="null">-- Ninguna / Transversal --</option>
            <option v-for="c in canchasRegionList" :key="'opt_c_'+c.id" :value="c.id">
              Cancha #{{ c.number }} ({{ Math.round(c.x) }}m - {{ Math.round(c.x + c.width) }}m)
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- MODAL DE AYUDA Y ESCALA -->
    <div v-if="showHelpModal" class="modal-backdrop" @click.self="showHelpModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>📐 Escala Reales del Dique Principal</h3>
          <button class="btn-close-modal" @click="showHelpModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p>Este lienzo interactivo representa las dimensiones reales del <b>Dique Principal</b> en escala proporcional <b>8:1</b>:</p>
          <ul class="help-list">
            <li><b>Largo Horizontal (X):</b> 4,000 metros (4.0 kilómetros).</li>
            <li><b>Alto / Profundidad Vertical (Y):</b> 500 metros (0.5 kilómetros).</li>
            <li><b>Trazo de Tuberías:</b> Haz clic en <b>"✏️ Trazar Tubería"</b>, luego haz clic en el punto de origen en el lienzo y un segundo clic en el punto de destino. La longitud real en metros y kilómetros se calcula automáticamente a escala.</li>
            <li><b>Canchas Asignadas:</b> Cada cancha de Dique Principal está representada en su franja correspondiente de 0 a 4.0 km.</li>
          </ul>
        </div>
        <div class="modal-footer">
          <button class="btn-save-edit" @click="showHelpModal = false">Entendido</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';

const props = defineProps({
  canchasNiveles: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['selectCancha']);

const currentTool = ref('select'); // 'select' | 'draw'
const filterStatus = ref('ALL');
const selectedPipeId = ref(null);
const selectedCanchaId = ref(null);
const showHelpModal = ref(false);

const svgContainerRef = ref(null);
const mouseHovering = ref(false);
const mouseClientPos = reactive({ x: 0, y: 0 });
const mouseRealCoords = reactive({ x: 0, y: 0 });

const isDrawing = ref(false);
const drawStartPoint = ref(null);

// Reglas graduadas
const xRulerMarks = [
  { m: 0, label: '0.0 km (0m)', pct: 0 },
  { m: 500, label: '0.5 km', pct: 12.5 },
  { m: 1000, label: '1.0 km (1000m)', pct: 25 },
  { m: 1500, label: '1.5 km', pct: 37.5 },
  { m: 2000, label: '2.0 km (2000m)', pct: 50 },
  { m: 2500, label: '2.5 km', pct: 62.5 },
  { m: 3000, label: '3.0 km (3000m)', pct: 75 },
  { m: 3500, label: '3.5 km', pct: 87.5 },
  { m: 4000, label: '4.0 km (4000m)', pct: 100 }
];

const yRulerMarks = [
  { m: 0, label: '0 m', pct: 0 },
  { m: 100, label: '100 m', pct: 20 },
  { m: 250, label: '250 m (0.25 km)', pct: 50 },
  { m: 400, label: '400 m', pct: 80 },
  { m: 500, label: '500 m (0.5 km)', pct: 100 }
];

// Canchas mapeadas a lo largo de los 4,000 metros del Dique Principal
const canchasRegionList = computed(() => {
  const list = props.canchasNiveles && props.canchasNiveles.length > 0
    ? props.canchasNiveles
    : [
        { id: 101, number: 1 }, { id: 102, number: 2 }, { id: 103, number: 3 }, { id: 104, number: 4 },
        { id: 105, number: 5 }, { id: 106, number: 6 }, { id: 107, number: 7 }, { id: 108, number: 8 }
      ];

  const total = list.length;
  const regionWidth = 4000 / total;

  return list.map((c, idx) => ({
    id: c.id,
    number: c.number,
    x: idx * regionWidth,
    width: regionWidth
  }));
});

// Tuberías guardadas
const pipes = ref([
  {
    id: 1,
    name: 'Línea de Arenas A-01',
    material: 'HDPE PE100',
    diameter: '16',
    status: 'ACTIVA',
    canchaId: null,
    x1: 200,
    y1: 80,
    x2: 2400,
    y2: 120
  },
  {
    id: 2,
    name: 'Alimentación Secundaria Cancha #3',
    material: 'HDPE PE100',
    diameter: '12',
    status: 'MANTENIMIENTO',
    canchaId: 103,
    x1: 1200,
    y1: 140,
    x2: 1800,
    y2: 380
  },
  {
    id: 3,
    name: 'Línea de Rebose Dique Principal',
    material: 'Acero Carbono',
    diameter: '24',
    status: 'PROYECTADA',
    canchaId: null,
    x1: 2500,
    y1: 220,
    x2: 3900,
    y2: 250
  }
]);

// Cargar y guardar en LocalStorage
const loadPipesFromStorage = () => {
  try {
    const saved = localStorage.getItem('dique_principal_pipes_v1');
    if (saved) {
      pipes.value = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Error al cargar tuberías:", e);
  }
};

const savePipesToStorage = () => {
  try {
    localStorage.setItem('dique_principal_pipes_v1', JSON.stringify(pipes.value));
  } catch (e) {
    console.error("Error al guardar tuberías:", e);
  }
};

watch(pipes, () => {
  savePipesToStorage();
}, { deep: true });

const visiblePipes = computed(() => {
  if (filterStatus.value === 'ALL') return pipes.value;
  return pipes.value.filter(p => p.status === filterStatus.value);
});

const selectedPipe = computed(() => {
  return pipes.value.find(p => p.id === selectedPipeId.value) || null;
});

const startDrawingTool = () => {
  currentTool.value = 'draw';
  isDrawing.value = false;
  drawStartPoint.value = null;
  selectedPipeId.value = null;
};

const handleMouseMove = (e) => {
  if (!svgContainerRef.value) return;
  const rect = svgContainerRef.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  mouseHovering.value = true;
  mouseClientPos.x = mouseX;
  mouseClientPos.y = mouseY;

  // Convertir a coordenadas reales a escala (4000m x 500m)
  mouseRealCoords.x = Math.max(0, Math.min(4000, (mouseX / rect.width) * 4000));
  mouseRealCoords.y = Math.max(0, Math.min(500, (mouseY / rect.height) * 500));
};

const handleMouseLeave = () => {
  mouseHovering.value = false;
};

const handleCanvasClick = (e) => {
  if (currentTool.value === 'draw') {
    if (!isDrawing.value) {
      // Iniciar punto de origen
      isDrawing.value = true;
      drawStartPoint.value = { x: mouseRealCoords.x, y: mouseRealCoords.y };
    } else {
      // Punto final: Crear nueva tubería
      const newPipe = {
        id: Date.now(),
        name: `Tubería #${pipes.value.length + 1}`,
        material: 'HDPE PE100',
        diameter: '16',
        status: 'ACTIVA',
        canchaId: null,
        x1: Math.round(drawStartPoint.value.x),
        y1: Math.round(drawStartPoint.value.y),
        x2: Math.round(mouseRealCoords.x),
        y2: Math.round(mouseRealCoords.y)
      };

      pipes.value.push(newPipe);
      selectedPipeId.value = newPipe.id;
      isDrawing.value = false;
      drawStartPoint.value = null;
      currentTool.value = 'select';
    }
  }
};

const selectPipe = (pipe) => {
  if (currentTool.value === 'select') {
    selectedPipeId.value = pipe.id;
  }
};

const selectCanchaRegion = (cancha) => {
  selectedCanchaId.value = cancha.id;
  emit('selectCancha', cancha.id);
};

const deleteSelectedPipe = () => {
  if (!selectedPipeId.value) return;
  pipes.value = pipes.value.filter(p => p.id !== selectedPipeId.value);
  selectedPipeId.value = null;
};

const resetPipes = () => {
  if (confirm("¿Deseas restablecer las tuberías de ejemplo?")) {
    pipes.value = [
      { id: 1, name: 'Línea de Arenas A-01', material: 'HDPE PE100', diameter: '16', status: 'ACTIVA', canchaId: null, x1: 200, y1: 80, x2: 2400, y2: 120 },
      { id: 2, name: 'Alimentación Cancha #3', material: 'HDPE PE100', diameter: '12', status: 'MANTENIMIENTO', canchaId: 103, x1: 1200, y1: 140, x2: 1800, y2: 380 },
      { id: 3, name: 'Línea de Rebose Dique Principal', material: 'Acero Carbono', diameter: '24', status: 'PROYECTADA', canchaId: null, x1: 2500, y1: 220, x2: 3900, y2: 250 }
    ];
    selectedPipeId.value = null;
  }
};

// Utilidades de cálculo geométrico a escala
const calculateDistance = (p1, p2) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const getPipeDistance = (pipe) => {
  if (!pipe) return 0;
  return calculateDistance({ x: pipe.x1, y: pipe.y1 }, { x: pipe.x2, y: pipe.y2 });
};

const formatDistanceKm = (meters) => {
  if (!meters) return '0 m';
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(meters)} m`;
};

const getPipeColor = (status) => {
  switch (status) {
    case 'ACTIVA': return '#10b981'; // Verde
    case 'MANTENIMIENTO': return '#f59e0b'; // Amarillo / Naranja
    case 'INACTIVA': return '#ef4444'; // Rojo
    case 'PROYECTADA': return '#0284c7'; // Azul
    default: return '#0284c7';
  }
};

const getPipeStrokeWidth = (diameter) => {
  const d = parseInt(diameter) || 16;
  if (d <= 8) return 4;
  if (d <= 12) return 6;
  if (d <= 16) return 8;
  if (d <= 24) return 11;
  return 14;
};

onMounted(() => {
  loadPipesFromStorage();
});
</script>

<style scoped>
.dique-pipes-container {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  margin-bottom: 1.5rem;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.title-badge {
  background: #0284c7;
  color: #ffffff;
  font-weight: 800;
  font-size: 0.8rem;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  letter-spacing: 0.5px;
}

.canvas-title {
  margin: 0 0 0.2rem 0;
  font-size: 1.2rem;
  font-weight: 800;
  color: #0f172a;
}

.canvas-subtitle {
  margin: 0;
  font-size: 0.82rem;
  color: #64748b;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.tool-btn-group {
  display: flex;
  background: #f1f5f9;
  padding: 0.25rem;
  border-radius: 10px;
  gap: 0.25rem;
}

.btn-tool {
  background: transparent;
  border: none;
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-tool.active {
  background: #ffffff;
  color: #0284c7;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

.btn-draw.active {
  background: #0284c7;
  color: #ffffff;
}

.v-divider {
  width: 1px;
  height: 24px;
  background: #cbd5e1;
}

.select-pipe-filter {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.45rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  outline: none;
}

.btn-help-pipes, .btn-clear-pipes {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 0.45rem 0.8rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-help-pipes:hover, .btn-clear-pipes:hover {
  background: #e2e8f0;
}

/* VIEWPORT Y REGLAS GRADUADAS EN METROS Y KM */
.scaled-viewport-wrapper {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 1rem 1rem 1rem 2.5rem;
  position: relative;
  overflow: hidden;
}

.ruler-x {
  position: relative;
  height: 24px;
  margin-bottom: 4px;
  width: 100%;
}

.ruler-x-mark {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mark-line-x {
  width: 1px;
  height: 8px;
  background: #94a3b8;
}

.mark-text-x {
  font-size: 0.7rem;
  font-weight: 700;
  color: #64748b;
  margin-top: 2px;
  white-space: nowrap;
}

.viewport-main-row {
  display: flex;
  position: relative;
  width: 100%;
}

.ruler-y {
  position: absolute;
  left: -32px;
  top: 0;
  height: 100%;
  width: 30px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.ruler-y-mark {
  position: absolute;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
}

.mark-text-y {
  font-size: 0.65rem;
  font-weight: 700;
  color: #64748b;
  white-space: nowrap;
}

.mark-line-y {
  height: 1px;
  width: 6px;
  background: #94a3b8;
}

/* LIENZO SVG PROPORCIÓN 8:1 */
.svg-canvas-container {
  width: 100%;
  aspect-ratio: 8 / 1;
  background: #f8fafc;
  border: 2px solid #94a3b8;
  border-radius: 8px;
  position: relative;
  cursor: crosshair;
  overflow: hidden;
}

.pipes-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.pipe-group {
  cursor: pointer;
  transition: opacity 0.2s;
}

.pipe-group:hover line {
  stroke-width: 12px;
}

.cancha-region {
  cursor: pointer;
  transition: all 0.2s;
}

.cancha-region:hover rect {
  fill: rgba(2, 132, 199, 0.1);
}

.cursor-tooltip {
  position: absolute;
  pointer-events: none;
  background: #0f172a;
  color: #ffffff;
  font-size: 0.75rem;
  padding: 0.3rem 0.6rem;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 50;
  white-space: nowrap;
}

/* FORMULARIO INFERIOR */
.pipe-editor-card {
  margin-top: 1.25rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
}

.btn-delete-pipe {
  background: #fef2f2;
  border: 1px solid #fca5a5;
  color: #dc2626;
  font-weight: 700;
  font-size: 0.82rem;
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  cursor: pointer;
}

.btn-delete-pipe:hover {
  background: #fee2e2;
}

.pipe-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.form-label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #475569;
}

.form-input, .form-select {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #0f172a;
  outline: none;
}

.form-input:focus, .form-select:focus {
  border-color: #0284c7;
}

/* Modal Help */
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}

.modal-card {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-header h3 { margin: 0; font-size: 1.1rem; color: #0f172a; font-weight: 700; }
.btn-close-modal { background: none; border: none; color: #64748b; font-size: 1.2rem; cursor: pointer; }

.modal-body { padding: 1.5rem; font-size: 0.9rem; color: #334155; line-height: 1.5; }
.help-list { margin-top: 0.75rem; padding-left: 1.25rem; }
.help-list li { margin-bottom: 0.5rem; }

.modal-footer {
  display: flex; justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.btn-save-edit { background: #0284c7; border: none; color: #ffffff; font-weight: 700; padding: 0.6rem 1.25rem; border-radius: 8px; cursor: pointer; }
</style>

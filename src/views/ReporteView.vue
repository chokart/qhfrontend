<template>
  <div class="reporte-view">
    <AppNavbar />

    <div class="page-container">
      <!-- Encabezado de la página -->
      <div class="page-header">
        <div class="header-left">
          <div class="header-icon-wrap">📊</div>
          <div>
            <h1>Reporte de Producción de Arenas</h1>
            <p class="subtitle">Producción en Dique Principal (DP) y Dique Lateral (DL) por Turno A (Día) y Turno B (Noche)</p>
          </div>
        </div>

        <div class="header-actions">
          <!-- Selector de Mes/Año -->
          <div v-if="availableMonths.length > 0" class="month-selector-wrap">
            <span class="selector-icon">📅</span>
            <select v-model="selectedMonthKey" @change="onMonthChange" class="month-select">
              <option v-for="m in availableMonths" :key="`${m.year}-${m.month}`" :value="`${m.year}-${m.month}`">
                {{ getMonthName(m.month) }} {{ m.year }}
              </option>
            </select>
          </div>

          <!-- Botón Eliminar Mes -->
          <button v-if="selectedMonthKey" class="btn-delete-month" @click="deleteSelectedMonthReport" title="Eliminar reporte del mes seleccionado">
            <span>🗑️ Eliminar Mes</span>
          </button>

          <!-- Botón Pegar Producción -->
          <button class="btn-paste-header" @click="activeTab = 'paste'">
            <span>📋 Pegar Producción</span>
          </button>
        </div>
      </div>

      <!-- Alerta / Estado de carga -->
      <transition name="fade">
        <div v-if="uploadStatus.message" :class="['status-banner', uploadStatus.isSuccess ? 'success' : 'error']">
          <span class="status-icon">{{ uploadStatus.isSuccess ? '✅' : '❌' }}</span>
          <span>{{ uploadStatus.message }}</span>
        </div>
      </transition>

      <!-- Overlay Spinner durante el procesamiento -->
      <div v-if="isUploading" class="uploading-overlay">
        <div class="spinner-card">
          <div class="spinner-large"></div>
          <p>Procesando datos de producción y actualizando la base de datos...</p>
        </div>
      </div>

      <!-- Dashboard de Producción -->
      <div class="dashboard-content">

        <!-- TARJETAS DE KPIS PRINCIPALES DE PRODUCCIÓN (si existen datos) -->
        <div v-if="dashboardData" class="kpi-grid">
          <!-- 1. Dique Principal -->
          <div class="kpi-card primary">
            <div class="kpi-icon">🏗️</div>
            <div class="kpi-info">
              <span class="kpi-label">Dique Principal (DP)</span>
              <span class="kpi-value">{{ formatNumber(dashboardData.totalDpArenas) }} <small>TM</small></span>
              <span class="kpi-sub">
                ☀️ <b>A:</b> {{ formatNumber(dashboardData.totalDpArenasA) }} | 🌙 <b>B:</b> {{ formatNumber(dashboardData.totalDpArenasB) }} TM
              </span>
            </div>
          </div>

          <!-- 2. Dique Lateral -->
          <div class="kpi-card info">
            <div class="kpi-icon">📐</div>
            <div class="kpi-info">
              <span class="kpi-label">Dique Lateral (DL)</span>
              <span class="kpi-value">{{ formatNumber(dashboardData.totalDlArenas) }} <small>TM</small></span>
              <span class="kpi-sub">
                ☀️ <b>A:</b> {{ formatNumber(dashboardData.totalDlArenasA) }} | 🌙 <b>B:</b> {{ formatNumber(dashboardData.totalDlArenasB) }} TM
              </span>
            </div>
          </div>

          <!-- 3. Total Turno A -->
          <div class="kpi-card warning">
            <div class="kpi-icon">☀️</div>
            <div class="kpi-info">
              <span class="kpi-label">Total Turno A (Día)</span>
              <span class="kpi-value">{{ formatNumber(dashboardData.totalArenasA) }} <small>TM</small></span>
              <span class="kpi-sub">DP: {{ formatNumber(dashboardData.totalDpArenasA) }} | DL: {{ formatNumber(dashboardData.totalDlArenasA) }}</span>
            </div>
          </div>

          <!-- 4. Total Turno B -->
          <div class="kpi-card night">
            <div class="kpi-icon">🌙</div>
            <div class="kpi-info">
              <span class="kpi-label">Total Turno B (Noche)</span>
              <span class="kpi-value">{{ formatNumber(dashboardData.totalArenasB) }} <small>TM</small></span>
              <span class="kpi-sub">DP: {{ formatNumber(dashboardData.totalDpArenasB) }} | DL: {{ formatNumber(dashboardData.totalDlArenasB) }}</span>
            </div>
          </div>

          <!-- 5. Producción Total Mes -->
          <div class="kpi-card success-card">
            <div class="kpi-icon">📦</div>
            <div class="kpi-info">
              <span class="kpi-label">Producción Total Mes</span>
              <span class="kpi-value">{{ formatNumber(dashboardData.totalArenasMes) }} <small>TM Secas</small></span>
              <span class="kpi-sub">Acumulado combinado DP + DL</span>
            </div>
          </div>
        </div>

        <!-- NAVEGACIÓN ENTRE VISTAS DEL DASHBOARD -->
        <div class="view-tabs">
          <button 
            :class="['tab-btn', { active: activeTab === 'paste' }]" 
            @click="activeTab = 'paste'"
          >
            📋 Pegar Producción (Copiar de Excel)
          </button>
          <button 
            v-if="dashboardData"
            :class="['tab-btn', { active: activeTab === 'matrix' }]" 
            @click="activeTab = 'matrix'"
          >
            📊 Matriz Mensual (Día 01 - 31)
          </button>
          <button 
            v-if="dashboardData"
            :class="['tab-btn', { active: activeTab === 'chart' }]" 
            @click="activeTab = 'chart'"
          >
            📈 Comparativo Visual (Turno A vs B)
          </button>
          <button 
            :class="['tab-btn', { active: activeTab === 'annual' }]" 
            @click="openAnnualTab"
          >
            📅 Resumen Anual (Mes por Mes)
          </button>
        </div>

        <!-- TAB PASTE: PEGAR DATOS DIRECTAMENTE DESDE EXCEL -->
        <div v-if="activeTab === 'paste'" class="tab-pane">
          <div class="card paste-card">
            <div class="card-header-inner">
              <div>
                <h3>📋 Ingresar Producción Pegando de Excel / Google Sheets</h3>
                <p class="table-sub-desc">Copia la tabla directamente desde tu hoja de cálculo e ingrésala en el recuadro de abajo.</p>
              </div>
            </div>

            <div class="paste-body">
              <!-- Formato Guía de Columnas -->
              <div class="paste-instruction-box">
                <div class="instruction-header">
                  <span>💡 <b>Formato de Columnas (Separadas por tabuladores desde Excel):</b></span>
                </div>
                <div class="instruction-format">
                  <code><b>DIA</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>TURNO</b> &nbsp;&nbsp;&nbsp; <b>DP</b> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <b>DL</b></code><br>
                  <code>1-Jan-26 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; A &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 20,962 &nbsp;&nbsp;&nbsp;&nbsp; 3,550</code><br>
                  <code>1-Jan-26 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; B &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 22,198 &nbsp;&nbsp;&nbsp;&nbsp; 2,989</code><br>
                  <code>2-Jan-26 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; A &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 20,961 &nbsp;&nbsp;&nbsp;&nbsp; 1,495</code>
                </div>
              </div>

              <!-- Textarea para Pegar -->
              <div class="textarea-wrap">
                <label class="textarea-label">Pega aquí los datos copiados desde Excel (Ctrl + V):</label>
                <textarea
                  v-model="rawPastedText"
                  @input="parsePastedTextPreview"
                  placeholder="DIA	TURNO	DP	DL&#10;1-Jan-26	A	20,962	3,550&#10;1-Jan-26	B	22,198	2,989..."
                  rows="9"
                  class="paste-textarea"
                ></textarea>
              </div>

              <!-- Sección Vista Previa en Tiempo Real -->
              <div v-if="parsedPreviewRows.length > 0" class="preview-section">
                <div class="preview-header">
                  <div>
                    <h4>🔍 Vista Previa en Tiempo Real</h4>
                    <span class="badge-preview">{{ parsedPreviewRows.length }} registros detectados correctamente</span>
                  </div>
                  <button class="btn-save-paste" @click="submitPastedReport" :disabled="isUploading">
                    <span v-if="!isUploading">🚀 Guardar Producción en el Sistema</span>
                    <span v-else>⏳ Guardando...</span>
                  </button>
                </div>

                <div class="table-wrapper-responsive preview-table-wrap">
                  <table class="preview-table">
                    <thead>
                      <tr>
                        <th>FECHA DETECTADA</th>
                        <th>TURNO</th>
                        <th>DIQUE PRINCIPAL (DP)</th>
                        <th>DIQUE LATERAL (DL)</th>
                        <th>TOTAL DÍA (TM)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(r, idx) in parsedPreviewRows" :key="idx" :class="idx % 2 === 0 ? 'even-row' : ''">
                        <td class="cell-date"><b>{{ r.dateStr }}</b></td>
                        <td>
                          <span :class="['turno-badge', r.turno === 'A' ? 'day-badge' : 'night-badge']">
                            {{ r.turno === 'A' ? '☀️ Turno A' : '🌙 Turno B' }}
                          </span>
                        </td>
                        <td class="cell-dp">{{ formatNumber(r.dp) }} TM</td>
                        <td class="cell-dl">{{ formatNumber(r.dl) }} TM</td>
                        <td class="cell-tot"><b>{{ formatNumber(r.dp + r.dl) }} TM</b></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 1: MATRIZ MENSUAL COMPLETA DE PRODUCCIÓN -->
        <div v-if="activeTab === 'matrix' && dashboardData" class="tab-pane">
          <div class="card table-card">
            <div class="card-header-inner">
              <div>
                <h3>📋 Tabla Mensual de Producción de Arenas</h3>
                <p class="table-sub-desc">Desglose en TM Secas para Dique Principal (DP) y Dique Lateral (DL) en Turnos A (Día) y B (Noche)</p>
              </div>
              <span class="badge-days-count">{{ dashboardData.dailyReports ? dashboardData.dailyReports.length : 0 }} Días del Mes Registrados</span>
            </div>

            <div class="table-wrapper-responsive">
              <table class="prod-matrix-table">
                <thead>
                  <tr class="header-group-row">
                    <th colspan="2" class="hdr-group date-hdr">FECHA DE OPERACIÓN</th>
                    <th colspan="3" class="hdr-group dp-hdr">DIQUE PRINCIPAL (DP)</th>
                    <th colspan="3" class="hdr-group dl-hdr">DIQUE LATERAL (DL)</th>
                    <th colspan="3" class="hdr-group tot-hdr">TOTAL PRODUCCIÓN ARENAS</th>
                    <th class="hdr-group act-hdr">ACCIÓN</th>
                  </tr>
                  <tr class="header-sub-row">
                    <th class="col-num">Nº</th>
                    <th class="col-date">FECHA</th>
                    <th class="col-val dp-col">TURNO A (TM)</th>
                    <th class="col-val dp-col">TURNO B (TM)</th>
                    <th class="col-val dp-tot-col">TOTAL DP (TM)</th>
                    <th class="col-val dl-col">TURNO A (TM)</th>
                    <th class="col-val dl-col">TURNO B (TM)</th>
                    <th class="col-val dl-tot-col">TOTAL DL (TM)</th>
                    <th class="col-val tot-a-col">TOTAL TURNO A</th>
                    <th class="col-val tot-b-col">TOTAL TURNO B</th>
                    <th class="col-val grand-tot-col">TOTAL DÍA (TM)</th>
                    <th class="col-act">EDITAR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="d in dashboardData.dailyReports" :key="d.id" :class="['row-daily', { 'row-empty-warning': isRowEmpty(d) }]">
                    <td class="cell-num"><b>{{ d.dayNumber < 10 ? '0' + d.dayNumber : d.dayNumber }}</b></td>
                    <td class="cell-date">
                      {{ d.reportDate }}
                      <span v-if="isRowEmpty(d)" class="empty-badge" title="Día sin datos de producción">⚠️ Sin Registro</span>
                    </td>
                    
                    <!-- DP -->
                    <td class="cell-val dp-a">{{ formatNumber(d.dpArenasGuardiaA) }}</td>
                    <td class="cell-val dp-b">{{ formatNumber(d.dpArenasGuardiaB) }}</td>
                    <td class="cell-val dp-tot"><b>{{ formatNumber(d.dpArenasTotalDia) }}</b></td>
                    
                    <!-- DL -->
                    <td class="cell-val dl-a">{{ formatNumber(d.dlArenasGuardiaA) }}</td>
                    <td class="cell-val dl-b">{{ formatNumber(d.dlArenasGuardiaB) }}</td>
                    <td class="cell-val dl-tot"><b>{{ formatNumber(d.dlArenasTotalDia) }}</b></td>
                    
                    <!-- Totales Combinados por Turno y Día -->
                    <td class="cell-val tot-a"><b>{{ formatNumber((d.dpArenasGuardiaA || 0) + (d.dlArenasGuardiaA || 0)) }}</b></td>
                    <td class="cell-val tot-b"><b>{{ formatNumber((d.dpArenasGuardiaB || 0) + (d.dlArenasGuardiaB || 0)) }}</b></td>
                    <td class="cell-val grand-tot"><b>{{ formatNumber(d.totalArenasDia) }}</b></td>
                    
                    <!-- Botón Editar -->
                    <td class="cell-act">
                      <button class="btn-edit-row" @click="openEditModal(d)" title="Modificar manualmente valores del día">
                        ✏️
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="summary-foot-row total-row">
                    <td colspan="2" class="foot-label"><b>TOTAL ACUMULADO MES</b></td>
                    <td class="cell-val dp-a"><b>{{ formatNumber(dashboardData.totalDpArenasA) }}</b></td>
                    <td class="cell-val dp-b"><b>{{ formatNumber(dashboardData.totalDpArenasB) }}</b></td>
                    <td class="cell-val dp-tot"><b>{{ formatNumber(dashboardData.totalDpArenas) }}</b></td>
                    <td class="cell-val dl-a"><b>{{ formatNumber(dashboardData.totalDlArenasA) }}</b></td>
                    <td class="cell-val dl-b"><b>{{ formatNumber(dashboardData.totalDlArenasB) }}</b></td>
                    <td class="cell-val dl-tot"><b>{{ formatNumber(dashboardData.totalDlArenas) }}</b></td>
                    <td class="cell-val tot-a"><b>{{ formatNumber(dashboardData.totalArenasA) }}</b></td>
                    <td class="cell-val tot-b"><b>{{ formatNumber(dashboardData.totalArenasB) }}</b></td>
                    <td class="cell-val grand-tot"><b>{{ formatNumber(dashboardData.totalArenasMes) }}</b></td>
                    <td></td>
                  </tr>
                  <tr class="summary-foot-row avg-row">
                    <td colspan="2" class="foot-label"><b>PROMEDIO DIARIO</b></td>
                    <td class="cell-val dp-a">{{ formatAvg(dashboardData.totalDpArenasA) }}</td>
                    <td class="cell-val dp-b">{{ formatAvg(dashboardData.totalDpArenasB) }}</td>
                    <td class="cell-val dp-tot">{{ formatAvg(dashboardData.totalDpArenas) }}</td>
                    <td class="cell-val dl-a">{{ formatAvg(dashboardData.totalDlArenasA) }}</td>
                    <td class="cell-val dl-b">{{ formatAvg(dashboardData.totalDlArenasB) }}</td>
                    <td class="cell-val dl-tot">{{ formatAvg(dashboardData.totalDlArenas) }}</td>
                    <td class="cell-val tot-a">{{ formatAvg(dashboardData.totalArenasA) }}</td>
                    <td class="cell-val tot-b">{{ formatAvg(dashboardData.totalArenasB) }}</td>
                    <td class="cell-val grand-tot">{{ formatAvg(dashboardData.totalArenasMes) }}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <!-- TAB 2: COMPARATIVO VISUAL (BARRAS A VS B) -->
        <div v-if="activeTab === 'chart' && dashboardData" class="tab-pane">
          <div class="card chart-card">
            <div class="card-header-inner">
              <div>
                <h3>📈 Comparativo Diario: Turno A vs Turno B</h3>
                <p class="table-sub-desc">Contribución de producción (TM Secas) por guardia en Dique Principal y Dique Lateral</p>
              </div>
            </div>

            <div class="chart-bars-wrap">
              <div v-for="d in dashboardData.dailyReports" :key="d.id" class="day-bar-column">
                <div class="bar-pair">
                  <!-- Barra Turno A -->
                  <div 
                    class="bar bar-a" 
                    :style="{ height: getBarHeight((d.dpArenasGuardiaA || 0) + (d.dlArenasGuardiaA || 0)) }"
                    :title="`Día ${d.dayNumber} Turno A: ${formatNumber((d.dpArenasGuardiaA || 0) + (d.dlArenasGuardiaA || 0))} TM`"
                  >
                    <span v-if="((d.dpArenasGuardiaA || 0) + (d.dlArenasGuardiaA || 0)) > 0" class="bar-val">
                      {{ formatK((d.dpArenasGuardiaA || 0) + (d.dlArenasGuardiaA || 0)) }}
                    </span>
                  </div>

                  <!-- Barra Turno B -->
                  <div 
                    class="bar bar-b" 
                    :style="{ height: getBarHeight((d.dpArenasGuardiaB || 0) + (d.dlArenasGuardiaB || 0)) }"
                    :title="`Día ${d.dayNumber} Turno B: ${formatNumber((d.dpArenasGuardiaB || 0) + (d.dlArenasGuardiaB || 0))} TM`"
                  >
                    <span v-if="((d.dpArenasGuardiaB || 0) + (d.dlArenasGuardiaB || 0)) > 0" class="bar-val">
                      {{ formatK((d.dpArenasGuardiaB || 0) + (d.dlArenasGuardiaB || 0)) }}
                    </span>
                  </div>
                </div>

                <div class="day-label">{{ d.dayNumber }}</div>
              </div>
            </div>

            <div class="chart-legend">
              <div class="legend-item"><span class="legend-box turn-a"></span> ☀️ Turno A (Día)</div>
              <div class="legend-item"><span class="legend-box turn-b"></span> 🌙 Turno B (Noche)</div>
            </div>
          </div>
        </div>

        <!-- TAB 3: RESUMEN ANUAL (MES POR MES) -->
        <div v-if="activeTab === 'annual'" class="tab-pane">
          <div class="card table-card">
            <div class="card-header-inner">
              <div>
                <h3>📅 Resumen Anual de Producción (Mes por Mes) - Año {{ selectedYear }}</h3>
                <p class="table-sub-desc">Consolidado mensual de producción en TM Secas para Dique Principal (DP) y Dique Lateral (DL)</p>
              </div>
              <span v-if="loadingAnnual" class="badge-days-count">⏳ Cargando Resumen Anual...</span>
            </div>

            <div v-if="annualData" class="table-wrapper-responsive">
              <table class="prod-matrix-table annual-table">
                <thead>
                  <tr class="header-group-row">
                    <th colspan="2" class="hdr-group date-hdr">PERÍODO</th>
                    <th colspan="3" class="hdr-group dp-hdr">DIQUE PRINCIPAL (DP)</th>
                    <th colspan="3" class="hdr-group dl-hdr">DIQUE LATERAL (DL)</th>
                    <th colspan="3" class="hdr-group tot-hdr">TOTAL PRODUCCIÓN ARENAS</th>
                  </tr>
                  <tr class="header-sub-row">
                    <th class="col-num">Nº</th>
                    <th class="col-date">MES</th>
                    <th class="col-val dp-col">TURNO A (TM)</th>
                    <th class="col-val dp-col">TURNO B (TM)</th>
                    <th class="col-val dp-tot-col">TOTAL DP (TM)</th>
                    <th class="col-val dl-col">TURNO A (TM)</th>
                    <th class="col-val dl-col">TURNO B (TM)</th>
                    <th class="col-val dl-tot-col">TOTAL DL (TM)</th>
                    <th class="col-val tot-a-col">TOTAL TURNO A</th>
                    <th class="col-val tot-b-col">TOTAL TURNO B</th>
                    <th class="col-val grand-tot-col">TOTAL MES (TM)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="m in annualData.months" :key="m.monthNumber" class="row-daily">
                    <td class="cell-num"><b>{{ m.monthNumber < 10 ? '0' + m.monthNumber : m.monthNumber }}</b></td>
                    <td class="cell-date"><b>{{ m.monthName }}</b></td>
                    <td class="cell-val dp-a">{{ formatNumber(m.dpA) }}</td>
                    <td class="cell-val dp-b">{{ formatNumber(m.dpB) }}</td>
                    <td class="cell-val dp-tot"><b>{{ formatNumber(m.dpTotal) }}</b></td>
                    <td class="cell-val dl-a">{{ formatNumber(m.dlA) }}</td>
                    <td class="cell-val dl-b">{{ formatNumber(m.dlB) }}</td>
                    <td class="cell-val dl-tot"><b>{{ formatNumber(m.dlTotal) }}</b></td>
                    <td class="cell-val tot-a"><b>{{ formatNumber(m.totalA) }}</b></td>
                    <td class="cell-val tot-b"><b>{{ formatNumber(m.totalB) }}</b></td>
                    <td class="cell-val grand-tot"><b>{{ formatNumber(m.grandTotal) }}</b></td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="summary-foot-row total-row">
                    <td colspan="2" class="foot-label"><b>TOTAL ANUAL ACUMULADO</b></td>
                    <td class="cell-val dp-a"><b>{{ formatNumber(annualData.annualDpA) }}</b></td>
                    <td class="cell-val dp-b"><b>{{ formatNumber(annualData.annualDpB) }}</b></td>
                    <td class="cell-val dp-tot"><b>{{ formatNumber(annualData.annualDpTotal) }}</b></td>
                    <td class="cell-val dl-a"><b>{{ formatNumber(annualData.annualDlA) }}</b></td>
                    <td class="cell-val dl-b"><b>{{ formatNumber(annualData.annualDlB) }}</b></td>
                    <td class="cell-val dl-tot"><b>{{ formatNumber(annualData.annualDlTotal) }}</b></td>
                    <td class="cell-val tot-a"><b>{{ formatNumber(annualData.annualTotalA) }}</b></td>
                    <td class="cell-val tot-b"><b>{{ formatNumber(annualData.annualTotalB) }}</b></td>
                    <td class="cell-val grand-tot"><b>{{ formatNumber(annualData.annualGrandTotal) }}</b></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- MODAL PARA EDITAR PARTE DIARIO MANULAMENTE -->
    <div v-if="showEditModal" class="modal-backdrop" @click.self="showEditModal = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>✏️ Modificar Producción del Día {{ editForm.dayNumber }} ({{ editForm.reportDate }})</h3>
          <button class="btn-close-modal" @click="showEditModal = false">✕</button>
        </div>
        <div class="modal-body">
          <p class="modal-desc">Ingresa o corrige los valores de producción en TM Secas para cada guardia:</p>

          <!-- Sección DP -->
          <div class="edit-section-box blue">
            <h4>🏗️ Dique Principal (DP)</h4>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">☀️ Turno A (Día) - TM:</label>
                <input type="number" v-model.number="editForm.dpArenasGuardiaA" class="form-input" min="0" step="any" placeholder="0" />
              </div>
              <div class="form-group">
                <label class="form-label">🌙 Turno B (Noche) - TM:</label>
                <input type="number" v-model.number="editForm.dpArenasGuardiaB" class="form-input" min="0" step="any" placeholder="0" />
              </div>
            </div>
            <div class="sub-total-row">
              <span>Total DP Día: <b>{{ formatNumber((editForm.dpArenasGuardiaA || 0) + (editForm.dpArenasGuardiaB || 0)) }} TM</b></span>
            </div>
          </div>

          <!-- Sección DL -->
          <div class="edit-section-box green">
            <h4>📐 Dique Lateral (DL)</h4>
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label">☀️ Turno A (Día) - TM:</label>
                <input type="number" v-model.number="editForm.dlArenasGuardiaA" class="form-input" min="0" step="any" placeholder="0" />
              </div>
              <div class="form-group">
                <label class="form-label">🌙 Turno B (Noche) - TM:</label>
                <input type="number" v-model.number="editForm.dlArenasGuardiaB" class="form-input" min="0" step="any" placeholder="0" />
              </div>
            </div>
            <div class="sub-total-row">
              <span>Total DL Día: <b>{{ formatNumber((editForm.dlArenasGuardiaA || 0) + (editForm.dlArenasGuardiaB || 0)) }} TM</b></span>
            </div>
          </div>

          <!-- Resumen Gran Total -->
          <div class="grand-total-summary-card">
            <div class="gt-title">📦 Gran Total Producción Día (DP + DL)</div>
            <div class="gt-value">{{ formatNumber((editForm.dpArenasGuardiaA || 0) + (editForm.dpArenasGuardiaB || 0) + (editForm.dlArenasGuardiaA || 0) + (editForm.dlArenasGuardiaB || 0)) }} <small>TM Secas</small></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showEditModal = false">Cancelar</button>
          <button class="btn-save-edit" :disabled="savingEdit" @click="saveDailyReportEdit">
            <span v-if="savingEdit">Guardando...</span>
            <span v-else>💾 Guardar Producción</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import api from '../api';
import AppNavbar from '../components/AppNavbar.vue';

const isUploading = ref(false);
const availableMonths = ref([]);
const selectedMonthKey = ref('');
const dashboardData = ref(null);
const activeTab = ref('paste');

// Variables para datos pegados desde Excel
const rawPastedText = ref('');
const parsedPreviewRows = ref([]);

// Resumen Anual
const annualData = ref(null);
const loadingAnnual = ref(false);
const selectedYear = computed(() => {
  if (selectedMonthKey.value) {
    return parseInt(selectedMonthKey.value.split('-')[0]);
  }
  return new Date().getFullYear();
});

// Modal de edición
const showEditModal = ref(false);
const savingEdit = ref(false);
const editForm = reactive({
  id: null,
  reportDate: '',
  dayNumber: 0,
  dpArenasGuardiaA: 0,
  dpArenasGuardiaB: 0,
  dlArenasGuardiaA: 0,
  dlArenasGuardiaB: 0
});

const uploadStatus = reactive({
  message: '',
  isSuccess: false
});

const getMonthName = (m) => {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return months[m - 1] || m;
};

const formatNumber = (val) => {
  if (val === null || val === undefined) return '0';
  return Math.round(val).toLocaleString('es-PE');
};

const formatAvg = (totalVal) => {
  if (!dashboardData.value || !dashboardData.value.dailyReports || dashboardData.value.dailyReports.length === 0) return '0';
  const count = dashboardData.value.dailyReports.length;
  return Math.round((totalVal || 0) / count).toLocaleString('es-PE');
};

const isRowEmpty = (d) => {
  if (!d) return true;
  const tot = (d.dpArenasGuardiaA || 0) + (d.dpArenasGuardiaB || 0) + (d.dlArenasGuardiaA || 0) + (d.dlArenasGuardiaB || 0);
  return tot === 0;
};

const loadAvailableMonths = async () => {
  try {
    const res = await api.get('/api/v1/reports/months');
    availableMonths.value = res.data;
    if (availableMonths.value.length > 0 && !selectedMonthKey.value) {
      const first = availableMonths.value[0];
      selectedMonthKey.value = `${first.year}-${first.month}`;
      await loadDashboardData(first.year, first.month);
      activeTab.value = 'matrix';
    }
  } catch (err) {
    console.error("Error al cargar meses disponibles:", err);
  }
};

const loadDashboardData = async (year, month) => {
  try {
    const res = await api.get(`/api/v1/reports/dashboard?year=${year}&month=${month}`);
    dashboardData.value = res.data;
  } catch (err) {
    console.error("Error al cargar dashboard data:", err);
  }
};

const openAnnualTab = () => {
  activeTab.value = 'annual';
  loadAnnualSummary(selectedYear.value);
};

const loadAnnualSummary = async (year) => {
  loadingAnnual.value = true;
  try {
    const res = await api.get(`/api/v1/reports/annual?year=${year}`);
    annualData.value = res.data;
  } catch (err) {
    console.error("Error al cargar resumen anual:", err);
  } finally {
    loadingAnnual.value = false;
  }
};

const onMonthChange = () => {
  if (!selectedMonthKey.value) return;
  const [year, month] = selectedMonthKey.value.split('-');
  loadDashboardData(year, month);
  if (activeTab.value === 'annual') {
    loadAnnualSummary(year);
  }
};

const deleteSelectedMonthReport = async () => {
  if (!selectedMonthKey.value) return;
  const [year, month] = selectedMonthKey.value.split('-');
  const monthName = getMonthName(parseInt(month));

  if (!confirm(`¿Estás seguro de eliminar todo el reporte cargado de ${monthName} ${year}?\n\nEsta acción borrará las partes diarias de producción de dicho mes.`)) {
    return;
  }

  try {
    const res = await api.delete(`/api/v1/reports?year=${year}&month=${month}`);
    uploadStatus.message = res.data.message || `Reporte de ${monthName} ${year} eliminado.`;
    uploadStatus.isSuccess = true;
    dashboardData.value = null;
    selectedMonthKey.value = '';
    await loadAvailableMonths();
  } catch (err) {
    console.error("Error al eliminar reporte:", err);
    uploadStatus.message = err.response?.data?.message || 'Error al eliminar el reporte del mes.';
    uploadStatus.isSuccess = false;
  }
};

const openEditModal = (d) => {
  editForm.id = d.id;
  editForm.reportDate = d.reportDate;
  editForm.dayNumber = d.dayNumber;
  editForm.dpArenasGuardiaA = d.dpArenasGuardiaA || 0;
  editForm.dpArenasGuardiaB = d.dpArenasGuardiaB || 0;
  editForm.dlArenasGuardiaA = d.dlArenasGuardiaA || 0;
  editForm.dlArenasGuardiaB = d.dlArenasGuardiaB || 0;
  showEditModal.value = true;
};

const saveDailyReportEdit = async () => {
  if (!editForm.id) return;
  savingEdit.value = true;
  try {
    await api.put(`/api/v1/reports/daily/${editForm.id}`, {
      dpArenasGuardiaA: editForm.dpArenasGuardiaA || 0,
      dpArenasGuardiaB: editForm.dpArenasGuardiaB || 0,
      dlArenasGuardiaA: editForm.dlArenasGuardiaA || 0,
      dlArenasGuardiaB: editForm.dlArenasGuardiaB || 0
    });

    uploadStatus.message = `Producción del día ${editForm.dayNumber} (${editForm.reportDate}) actualizada correctamente.`;
    uploadStatus.isSuccess = true;
    showEditModal.value = false;

    if (selectedMonthKey.value) {
      const [year, month] = selectedMonthKey.value.split('-');
      await loadDashboardData(year, month);
    }
  } catch (err) {
    console.error("Error al actualizar producción del día:", err);
    uploadStatus.message = err.response?.data?.message || 'Error al guardar cambios de producción.';
    uploadStatus.isSuccess = false;
  } finally {
    savingEdit.value = false;
  }
};

// --- LOGICA DE PROCESAMIENTO DE TEXTO PEGADO DESDE EXCEL ---
const parsePastedTextPreview = () => {
  if (!rawPastedText.value || !rawPastedText.value.trim()) {
    parsedPreviewRows.value = [];
    return;
  }

  const lines = rawPastedText.value.split(/\r?\n/);
  const list = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || isHeaderLine(trimmed)) continue;

    const tokens = splitLineTokens(trimmed);
    if (tokens.length < 4) continue;

    const dateStr = tokens[0].trim();
    const turno = tokens[1].trim().toUpperCase();
    const dpVal = parsePastedNumber(tokens[2]);
    const dlVal = parsePastedNumber(tokens[3]);

    if (turno === 'A' || turno === 'B') {
      list.push({
        dateStr,
        turno,
        dp: dpVal,
        dl: dlVal
      });
    }
  }

  parsedPreviewRows.value = list;
};

const isHeaderLine = (line) => {
  const upper = line.toUpperCase();
  return upper.includes('DIA') || upper.includes('FECHA') || upper.includes('TURNO') || upper.includes('DP') || upper.includes('DL');
};

const splitLineTokens = (line) => {
  if (line.includes('\t')) return line.split('\t');
  if (line.includes(';')) return line.split(';');
  return line.split(/\s{2,}/);
};

const parsePastedNumber = (raw) => {
  if (!raw) return 0;
  try {
    let cleaned = String(raw).trim().replace(/\s+/g, '');
    if (cleaned.includes('.') && cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(/,/g, '');
    }
    return parseFloat(cleaned) || 0;
  } catch (e) {
    return 0;
  }
};

const submitPastedReport = async () => {
  if (!rawPastedText.value || !rawPastedText.value.trim()) {
    uploadStatus.message = "Por favor pega primero los datos de producción en el recuadro.";
    uploadStatus.isSuccess = false;
    return;
  }

  isUploading.value = true;
  uploadStatus.message = "";

  try {
    const res = await api.post('/api/v1/reports/import-pasted', {
      rawText: rawPastedText.value
    });

    uploadStatus.message = res.data.message || "Datos pegados procesados exitosamente.";
    uploadStatus.isSuccess = true;

    rawPastedText.value = '';
    parsedPreviewRows.value = [];

    await loadAvailableMonths();
    if (res.data.year && res.data.month) {
      selectedMonthKey.value = `${res.data.year}-${res.data.month}`;
      await loadDashboardData(res.data.year, res.data.month);
    }
    activeTab.value = 'matrix';
  } catch (err) {
    console.error("Error al procesar datos pegados:", err);
    uploadStatus.message = err.response?.data?.message || "Error al procesar y guardar los datos pegados.";
    uploadStatus.isSuccess = false;
  } finally {
    isUploading.value = false;
  }
};

const maxDailyProd = computed(() => {
  if (!dashboardData.value || !dashboardData.value.dailyReports) return 1;
  let max = 0;
  dashboardData.value.dailyReports.forEach(d => {
    const totA = (d.dpArenasGuardiaA || 0) + (d.dlArenasGuardiaA || 0);
    const totB = (d.dpArenasGuardiaB || 0) + (d.dlArenasGuardiaB || 0);
    if (totA > max) max = totA;
    if (totB > max) max = totB;
  });
  return max > 0 ? max : 1;
});

const getBarHeight = (val) => {
  if (!val || val <= 0) return '0%';
  const pct = Math.round((val / maxDailyProd.value) * 100);
  return `${Math.max(pct, 6)}%`;
};

const formatK = (val) => {
  if (!val || val <= 0) return '';
  return Math.round(val / 1000) + 'k';
};

onMounted(() => {
  loadAvailableMonths();
});
</script>

<style scoped>
.reporte-view {
  min-height: 100vh;
  background-color: #0b1120;
  color: #f1f5f9;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  padding-bottom: 3rem;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1.5rem;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.5rem 2rem;
  backdrop-filter: blur(12px);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.header-icon-wrap {
  font-size: 2.2rem;
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 0.75rem;
  border-radius: 14px;
}

.page-header h1 {
  font-size: 1.65rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.3rem 0;
}

.subtitle {
  color: #94a3b8;
  font-size: 0.9rem;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.month-selector-wrap {
  display: flex;
  align-items: center;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 0.4rem 0.8rem;
}

.month-select {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-weight: 600;
  font-size: 0.95rem;
  outline: none;
  cursor: pointer;
}

.btn-paste-header {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  font-weight: 600;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
  transition: all 0.2s ease;
}

.btn-paste-header:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.6);
}

.btn-delete-month {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  font-weight: 600;
  padding: 0.65rem 1rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete-month:hover {
  background: rgba(239, 68, 68, 0.25);
}

/* Status Banner */
.status-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  font-weight: 500;
}

.status-banner.success {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
}

.status-banner.error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
}

/* Loading Overlay */
.uploading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(11, 17, 32, 0.85);
  backdrop-filter: blur(8px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner-card {
  background: #1e293b;
  border: 1px solid #334155;
  padding: 2.5rem 3rem;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.spinner-large {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(56, 189, 248, 0.2);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 1s infinite linear;
  margin: 0 auto 1.5rem auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* KPIs Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.kpi-card {
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;

}

.kpi-card.primary { border-left: 4px solid #3b82f6; }
.kpi-card.info { border-left: 4px solid #10b981; }
.kpi-card.warning { border-left: 4px solid #f59e0b; }
.kpi-card.night { border-left: 4px solid #8b5cf6; }
.kpi-card.success-card { border-left: 4px solid #06b6d4; background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(30, 41, 59, 0.8)); }

.kpi-icon {
  font-size: 2rem;
}

.kpi-info {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 0.8rem;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.kpi-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #ffffff;
}

.kpi-value small {
  font-size: 0.85rem;
  color: #cbd5e1;
}

.kpi-sub {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.2rem;
}

/* Tabs Navigation */
.view-tabs {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #334155;
  padding-bottom: 0.5rem;
  overflow-x: auto;
}

.tab-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-weight: 600;
  font-size: 0.95rem;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.05);
}

.tab-btn.active {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border-bottom: 2px solid #38bdf8;
}

/* Card General */
.card {
  background: #1e293b;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.card-header-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.card-header-inner h3 {
  font-size: 1.25rem;
  margin: 0 0 0.3rem 0;
  color: #ffffff;
}

.table-sub-desc {
  font-size: 0.85rem;
  color: #94a3b8;
  margin: 0;
}

.badge-days-count {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
}

/* ESTILOS DE LA PESTAÑA PASTE */
.paste-card {
  background: #1e293b;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.paste-instruction-box {
  background: rgba(15, 23, 42, 0.8);
  border: 1px dashed rgba(56, 189, 248, 0.4);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
}

.instruction-header {
  color: #38bdf8;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.instruction-format {
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.85rem;
  color: #cbd5e1;
  background: #0f172a;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  line-height: 1.5;
}

.textarea-wrap {
  margin-bottom: 1.5rem;
}

.textarea-label {
  display: block;
  font-weight: 600;
  font-size: 0.9rem;
  color: #f1f5f9;
  margin-bottom: 0.5rem;
}

.paste-textarea {
  width: 100%;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 12px;
  color: #38bdf8;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.9rem;
  padding: 1rem;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
}

.paste-textarea:focus {
  border-color: #38bdf8;
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
}

.preview-section {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 14px;
  padding: 1.25rem;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.preview-header h4 {
  margin: 0 0 0.2rem 0;
  color: #ffffff;
  font-size: 1.1rem;
}

.badge-preview {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.btn-save-paste {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
  transition: all 0.2s ease;
}

.btn-save-paste:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.6);
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.preview-table th {
  background: #1e293b;
  color: #94a3b8;
  font-weight: 700;
  text-align: left;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #334155;
}

.preview-table td {
  padding: 0.65rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.even-row {
  background: rgba(255, 255, 255, 0.02);
}

.turno-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 10px;
  font-size: 0.78rem;
  font-weight: 700;
}

.day-badge {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.night-badge {
  background: rgba(139, 92, 246, 0.2);
  color: #c084fc;
}

.cell-dp { color: #60a5fa; font-weight: 600; }
.cell-dl { color: #34d399; font-weight: 600; }
.cell-tot { color: #f59e0b; font-weight: 700; }

/* Tabla Matriz */
.table-wrapper-responsive {
  overflow-x: auto;
}

.prod-matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.header-group-row th {
  padding: 0.6rem;
  font-weight: 800;
  text-align: center;
  font-size: 0.78rem;
  letter-spacing: 0.5px;
}

.date-hdr { background: #334155; color: #f1f5f9; }
.dp-hdr { background: #1e3a8a; color: #93c5fd; }
.dl-hdr { background: #064e3b; color: #6ee7b7; }
.tot-hdr { background: #78350f; color: #fde68a; }
.act-hdr { background: #1e293b; color: #94a3b8; }

.header-sub-row th {
  background: #0f172a;
  color: #94a3b8;
  padding: 0.75rem 0.5rem;
  border-bottom: 2px solid #334155;
  font-size: 0.75rem;
  font-weight: 700;
}

.row-daily {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.15s;
}

.row-daily:hover {
  background: rgba(59, 130, 246, 0.05);
}

.row-empty-warning {
  background: rgba(239, 68, 68, 0.05);
}

.cell-num { text-align: center; color: #94a3b8; }
.cell-date { white-space: nowrap; font-weight: 500; }
.empty-badge {
  font-size: 0.7rem;
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  padding: 0.15rem 0.4rem;
  border-radius: 6px;
  margin-left: 0.4rem;
}

.cell-val { text-align: right; padding: 0.6rem 0.75rem; }
.dp-a, .dp-b { color: #93c5fd; }
.dp-tot { color: #3b82f6; background: rgba(59, 130, 246, 0.08); }
.dl-a, .dl-b { color: #6ee7b7; }
.dl-tot { color: #10b981; background: rgba(16, 185, 129, 0.08); }
.tot-a { color: #fbbf24; }
.tot-b { color: #c084fc; }
.grand-tot { color: #f59e0b; background: rgba(245, 158, 11, 0.12); font-size: 0.9rem; }

.cell-act { text-align: center; }
.btn-edit-row {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #60a5fa;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-edit-row:hover {
  background: rgba(59, 130, 246, 0.3);
  transform: scale(1.1);
}

.summary-foot-row {
  background: #0f172a;
  border-top: 2px solid #334155;
}

.foot-label { text-align: left; padding: 0.75rem 1rem; color: #f1f5f9; }

/* Gráfico Comparativo Bars */
.chart-bars-wrap {
  display: flex;
  align-items: flex-end;
  gap: 0.4rem;
  height: 280px;
  padding: 1.5rem 0 1rem 0;
  border-bottom: 1px solid #334155;
  overflow-x: auto;
}

.day-bar-column {
  flex: 1;
  min-width: 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.bar-pair {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  width: 100%;
  height: 90%;
}

.bar {
  flex: 1;
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: height 0.3s ease;
}

.bar-a { background: linear-gradient(180deg, #f59e0b, #d97706); }
.bar-b { background: linear-gradient(180deg, #8b5cf6, #6d28d9); }

.bar-val {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.65rem;
  font-weight: 700;
  color: #cbd5e1;
}

.day-label {
  font-size: 0.7rem;
  color: #94a3b8;
  margin-top: 0.4rem;
  font-weight: 600;
}

.chart-legend {
  display: flex;
  gap: 1.5rem;
  margin-top: 1rem;
  justify-content: center;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #cbd5e1;
}

.legend-box {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

.legend-box.turn-a { background: #f59e0b; }
.legend-box.turn-b { background: #8b5cf6; }

/* Modal Edit */
.modal-backdrop {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(11, 17, 32, 0.8);
  backdrop-filter: blur(6px);
  z-index: 1000;
  display: flex; align-items: center; justify-content: center;
  padding: 1rem;
}

.modal-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  overflow: hidden;
}

.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #334155;
}

.modal-header h3 { margin: 0; font-size: 1.1rem; color: #ffffff; }
.btn-close-modal { background: none; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; }

.modal-body { padding: 1.5rem; }
.modal-desc { font-size: 0.85rem; color: #94a3b8; margin: 0 0 1.25rem 0; }

.edit-section-box {
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.edit-section-box.blue { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2); }
.edit-section-box.green { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); }

.edit-section-box h4 { margin: 0 0 0.75rem 0; font-size: 0.95rem; color: #ffffff; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-group { display: flex; flex-direction: column; gap: 0.3rem; }
.form-label { font-size: 0.78rem; color: #cbd5e1; font-weight: 600; }
.form-input {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #38bdf8;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  outline: none;
}
.form-input:focus { border-color: #38bdf8; }

.sub-total-row {
  margin-top: 0.6rem;
  text-align: right;
  font-size: 0.8rem;
  color: #94a3b8;
}

.grand-total-summary-card {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(30, 41, 59, 0.9));
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
}

.gt-title { font-size: 0.8rem; color: #fbbf24; font-weight: 700; text-transform: uppercase; }
.gt-value { font-size: 1.4rem; font-weight: 800; color: #ffffff; }
.gt-value small { font-size: 0.8rem; color: #cbd5e1; }

.modal-footer {
  display: flex; justify-content: flex-end; gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #334155;
  background: #0f172a;
}

.btn-cancel { background: transparent; border: 1px solid #334155; color: #94a3b8; padding: 0.6rem 1.25rem; border-radius: 8px; cursor: pointer; }
.btn-save-edit { background: #3b82f6; border: none; color: #ffffff; font-weight: 600; padding: 0.6rem 1.25rem; border-radius: 8px; cursor: pointer; }
.btn-save-edit:hover { background: #2563eb; }
</style>

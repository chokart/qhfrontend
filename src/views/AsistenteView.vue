<template>
  <div class="asistente-container">
    <!-- Header Hero -->
    <header class="hero-header">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-icon">🤖</span>
          <span>ASISTENTE RAG ISO 45001</span>
        </div>
        <h1 class="hero-title">Consultor de Seguridad y Procedimientos QH</h1>
        <p class="hero-subtitle">
          Inteligencia artificial basada en la norma ISO 45001, PETS, IPERC y Estándares de Operación (D:\ISO 45001).
        </p>
      </div>

      <!-- LLM Status Banner -->
      <div class="status-card" :class="{ 'llm-active': status.llmAvailable, 'llm-inactive': !status.llmAvailable }">
        <div class="status-indicator">
          <span class="pulse-dot"></span>
          <span class="status-text" v-if="status.llmAvailable">
            Gemini LLM Activo & Contextualizado
          </span>
          <span class="status-text" v-else>
            Servicio de Generación LLM No Disponible
          </span>
        </div>
        <div class="status-sub">
          <span v-if="status.llmAvailable">Responde con síntesis por IA y citas oficiales</span>
          <span v-else>Recuperando fuentes y documentos de D:\ISO 45001 (Configure GEMINI_API_KEY)</span>
        </div>
        <button v-if="authStore.isAdmin" @click="handleReindex" :disabled="indexing" class="btn-reindex">
          <span v-if="indexing">⏳ Indexando...</span>
          <span v-else>🔄 Sincronizar ISO 45001</span>
        </button>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="chat-wrapper">
      <!-- Quick Prompts Chips -->
      <div class="quick-prompts">
        <span class="prompts-label">Preguntas rápidas:</span>
        <button 
          v-for="(prompt, idx) in samplePrompts" 
          :key="idx" 
          @click="useSamplePrompt(prompt.text)" 
          class="prompt-chip"
        >
          <span class="chip-icon">{{ prompt.icon }}</span>
          <span>{{ prompt.label }}</span>
        </button>
      </div>

      <!-- Filter Controls -->
      <div class="filters-bar">
        <div class="filter-group">
          <label class="filter-label">Filtrar por documento:</label>
          <div class="filter-pills">
            <button 
              v-for="cat in categories" 
              :key="cat.id"
              @click="selectedCategory = cat.id"
              :class="['pill-btn', { active: selectedCategory === cat.id }]"
            >
              <span>{{ cat.icon }}</span>
              <span>{{ cat.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Chat History Box -->
      <div class="chat-box" ref="chatBoxRef">
        <div v-if="messages.length === 0" class="welcome-card">
          <div class="welcome-icon">📄🔍</div>
          <h3>¿En qué procedimiento o norma ISO 45001 necesitas asistencia?</h3>
          <p>Puedes preguntar sobre EPPs, PETS de llenado de canchas, IPERC de equipos, termofusión HDPE, trabajos en altura, etc.</p>
        </div>

        <div 
          v-for="(msg, index) in messages" 
          :key="index" 
          :class="['chat-bubble-row', msg.sender]"
        >
          <div class="avatar">
            {{ msg.sender === 'user' ? '👤' : '🤖' }}
          </div>

          <div class="bubble-content">
            <div class="sender-name">
              {{ msg.sender === 'user' ? 'Tú' : 'Asistente ISO 45001' }}
              <span class="timestamp">{{ msg.timestamp }}</span>
            </div>

            <!-- Formatted Message Body -->
            <div class="message-text" v-html="formatMarkdown(msg.text)"></div>

            <!-- Unconfigured LLM Notice inside bubble if applicable -->
            <div v-if="msg.sender === 'assistant' && !msg.llmAvailable" class="unconfigured-warning">
              <span class="warning-icon">⚠️</span>
              <span><strong>Servicio de Generación No Disponible:</strong> La clave de API de Gemini no está configurada en el servidor backend. Se muestran las fuentes extraídas de <code>D:\ISO 45001</code>.</span>
            </div>

            <!-- Sources Collapsible Section -->
            <div v-if="msg.sources && msg.sources.length > 0" class="sources-container">
              <button @click="msg.showSources = !msg.showSources" class="toggle-sources-btn">
                <span>📚 Fuentes Citadas de ISO 45001 ({{ msg.sources.length }})</span>
                <span class="arrow">{{ msg.showSources ? '▲' : '▼' }}</span>
              </button>

              <div v-if="msg.showSources" class="sources-list">
                <div v-for="(src, sIdx) in msg.sources" :key="sIdx" class="source-card">
                  <div class="source-header">
                    <span class="doc-code">{{ src.documentCode || 'ISO Doc' }}</span>
                    <span class="doc-name">{{ src.documentName }}</span>
                    <span class="score-badge" v-if="src.score">
                      {{ Math.round(src.score * 100) }}% Relevancia
                    </span>
                  </div>
                  <div class="source-meta">
                    <span class="meta-tag">Categoría: {{ src.category }}</span>
                    <span class="meta-tag" v-if="src.pageNumber">Pág. {{ src.pageNumber }}</span>
                  </div>
                  <p class="source-excerpt">"{{ src.excerpt }}"</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Typing Loader -->
        <div v-if="loading" class="chat-bubble-row assistant loading-row">
          <div class="avatar">🤖</div>
          <div class="bubble-content">
            <div class="typing-indicator">
              <span></span><span></span><span></span>
              <span class="typing-text">Consultando base de conocimientos ISO 45001...</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Bar -->
      <form @submit.prevent="sendMessage" class="input-form">
        <input 
          v-model="userQuery" 
          type="text" 
          placeholder="Escribe tu consulta sobre PETS, IPERC o normas de seguridad..." 
          :disabled="loading"
          class="chat-input"
          ref="inputRef"
        />
        <button type="submit" :disabled="loading || !userQuery.trim()" class="btn-send">
          <span>Enviar</span>
          <span class="send-icon">🚀</span>
        </button>
      </form>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import api from '../api';
import { useAuthStore } from '../stores/auth';

const authStore = useAuthStore();

const userQuery = ref('');
const loading = ref(false);
const indexing = ref(false);
const chatBoxRef = ref(null);
const inputRef = ref(null);

const selectedCategory = ref('ALL');

const status = ref({
  llmAvailable: false,
  llmProvider: 'Google Gemini',
  totalChunksIndexed: 0,
  chunksByCategory: {}
});

const categories = [
  { id: 'ALL', label: 'Todos los documentos', icon: '📂' },
  { id: 'PETS', label: 'PETS (Procedimientos)', icon: '📋' },
  { id: 'IPERC', label: 'IPERC (Riesgos)', icon: '🛡️' },
  { id: 'ESTANDAR_OPERATIVO', label: 'Estándares Operativos', icon: '⚙️' },
  { id: 'ESTANDAR_SEGURIDAD', label: 'Estándares de Seguridad', icon: '🦺' }
];

const samplePrompts = [
  { label: 'PETS Preparación de Canchas', icon: '🚧', text: '¿Cuáles son las indicaciones del PETS.021 para preparación de canchas en diques?' },
  { label: 'Pega de Tubería HDPE', icon: '🔧', text: '¿Qué EPP y procedimiento se requiere para el corte y pega de tuberías HDPE?' },
  { label: 'IPERC de Equipos Livianos', icon: '🛻', text: '¿Qué peligros y controles establece el IPERC-004 para conducción de equipos livianos?' },
  { label: 'Estándar LOTO & Altura', icon: '🔒', text: '¿Cuáles son los requisitos de Bloqueo y Etiquetado (LOTO) y Trabajos en Altura?' }
];

const messages = ref([]);

const fetchStatus = async () => {
  try {
    const res = await api.get('/api/v1/assistant/status');
    status.value = res.data;
  } catch (err) {
    console.error('Error al obtener estado del asistente:', err);
  }
};

const handleReindex = async () => {
  if (indexing.value) return;
  indexing.value = true;
  try {
    const res = await api.post('/api/v1/assistant/index');
    alert(`Sincronización completada: ${res.data.totalChunksIndexed} fragmentos indexados en la base de datos.`);
    await fetchStatus();
  } catch (err) {
    console.error('Error al reindexar:', err);
    alert('Ocurrió un error al indexar los documentos.');
  } finally {
    indexing.value = false;
  }
};

const useSamplePrompt = (text) => {
  userQuery.value = text;
  sendMessage();
};

const sendMessage = async () => {
  const queryText = userQuery.value.trim();
  if (!queryText || loading.value) return;

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  messages.value.push({
    sender: 'user',
    text: queryText,
    timestamp: now
  });

  userQuery.value = '';
  loading.value = true;
  await scrollToBottom();

  try {
    const res = await api.post('/api/v1/assistant/chat', {
      message: queryText,
      categoryFilter: selectedCategory.value
    });

    const data = res.data;

    messages.value.push({
      sender: 'assistant',
      text: data.answer,
      llmAvailable: data.llmAvailable,
      sources: data.sources || [],
      showSources: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

  } catch (err) {
    console.error('Error enviando mensaje:', err);
    messages.value.push({
      sender: 'assistant',
      text: '❌ Ocurrió un error al consultar el servicio del Asistente. Por favor intenta de nuevo.',
      llmAvailable: false,
      sources: [],
      showSources: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } finally {
    loading.value = false;
    await scrollToBottom();
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (chatBoxRef.value) {
    chatBoxRef.value.scrollTop = chatBoxRef.value.scrollHeight;
  }
};

const formatMarkdown = (text) => {
  if (!text) return '';
  let formatted = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
  return formatted;
};

onMounted(() => {
  fetchStatus();
  if (inputRef.value) inputRef.value.focus();
});
</script>

<style scoped>
.asistente-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Hero Header */
.hero-header {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
  color: #ffffff;
  padding: 1.75rem 2rem;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(49, 46, 129, 0.25);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  padding: 0.4rem 0.85rem;
  border-radius: 30px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin-bottom: 0.75rem;
}

.hero-title {
  font-size: 1.75rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 0.5rem 0;
}

.hero-subtitle {
  font-size: 0.95rem;
  color: #c7d2fe;
  max-width: 650px;
  margin: 0;
  line-height: 1.4;
}

/* Status Card */
.status-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  padding: 1rem 1.25rem;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 280px;
}

.status-card.llm-active {
  border-color: #34d399;
}

.status-card.llm-inactive {
  border-color: #fbbf24;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.pulse-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 10px #34d399;
}

.llm-inactive .pulse-dot {
  background: #fbbf24;
  box-shadow: 0 0 10px #fbbf24;
}

.status-text {
  font-size: 0.9rem;
  font-weight: 700;
}

.status-sub {
  font-size: 0.75rem;
  color: #94a3b8;
}

.btn-reindex {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  margin-top: 0.25rem;
  transition: all 0.2s ease;
}

.btn-reindex:hover {
  background: #6366f1;
}

/* Quick Prompts */
.quick-prompts {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.prompts-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
  white-space: nowrap;
}

.prompt-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  padding: 0.45rem 0.85rem;
  border-radius: 30px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.prompt-chip:hover {
  background: #eeeffe;
  border-color: #6366f1;
  color: #4338ca;
}

/* Filter Bar */
.filters-bar {
  background: #ffffff;
  padding: 0.85rem 1.25rem;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.filter-label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
}

.filter-pills {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow-x: auto;
}

.pill-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pill-btn.active {
  background: #4338ca;
  color: white;
  border-color: #4338ca;
}

/* Chat Wrapper */
.chat-wrapper {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 1.25rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chat-box {
  min-height: 420px;
  max-height: 520px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem;
}

.welcome-card {
  text-align: center;
  margin: auto;
  padding: 2.5rem 1.5rem;
  max-width: 500px;
}

.welcome-icon {
  font-size: 3rem;
  margin-bottom: 0.75rem;
}

.welcome-card h3 {
  font-size: 1.15rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.welcome-card p {
  font-size: 0.88rem;
  color: #64748b;
  line-height: 1.5;
}

/* Chat Bubbles */
.chat-bubble-row {
  display: flex;
  gap: 0.85rem;
  max-width: 88%;
}

.chat-bubble-row.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.chat-bubble-row.assistant {
  align-self: flex-start;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  border: 1px solid #cbd5e1;
  flex-shrink: 0;
}

.bubble-content {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 1rem 1.25rem;
  border-radius: 16px;
  color: #1e293b;
  font-size: 0.92rem;
  line-height: 1.55;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
}

.user .bubble-content {
  background: #4338ca;
  color: #ffffff;
  border-color: #4338ca;
}

.sender-name {
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 0.35rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.user .sender-name {
  color: #c7d2fe;
}

.timestamp {
  font-size: 0.68rem;
  font-weight: 400;
  opacity: 0.8;
}

.unconfigured-warning {
  margin-top: 0.75rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #b45309;
  padding: 0.6rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Sources */
.sources-container {
  margin-top: 0.85rem;
  border-top: 1px dashed #cbd5e1;
  padding-top: 0.6rem;
}

.toggle-sources-btn {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.sources-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.6rem;
}

.source-card {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  padding: 0.6rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
}

.source-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  margin-bottom: 0.25rem;
}

.doc-code {
  background: #4338ca;
  color: white;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-weight: 800;
  font-size: 0.7rem;
}

.doc-name {
  font-weight: 700;
  color: #0f172a;
}

.score-badge {
  margin-left: auto;
  background: #dcfce7;
  color: #166534;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
}

.source-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.72rem;
  color: #64748b;
  margin-bottom: 0.35rem;
}

.source-excerpt {
  margin: 0;
  font-style: italic;
  color: #475569;
  background: #f8fafc;
  padding: 0.4rem;
  border-radius: 4px;
}

/* Typing indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  background: #6366f1;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1.0); }
}

.typing-text {
  font-size: 0.82rem;
  color: #64748b;
  margin-left: 0.5rem;
}

/* Input Form */
.input-form {
  display: flex;
  gap: 0.75rem;
  background: #f8fafc;
  padding: 0.5rem;
  border-radius: 14px;
  border: 1px solid #cbd5e1;
}

.chat-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.75rem 1rem;
  font-size: 0.95rem;
  outline: none;
  color: #0f172a;
}

.btn-send {
  background: #4338ca;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.btn-send:hover:not(:disabled) {
  background: #3730a3;
  transform: translateY(-1px);
}

.btn-send:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .hero-header {
    flex-direction: column;
    align-items: stretch;
  }
  .chat-bubble-row {
    max-width: 95%;
  }
}
</style>

<template>
  <div class="layout">
    <div id="map-container" class="map-container"></div>
    
    <div class="controls-panel">
      <div class="panel-header">
        <h3>Easy Map <span class="version">v1.0</span></h3>
        <p class="subtitle">Unified MapLibre Adapter</p>
      </div>

      <div class="section-title">Providers</div>
      <div class="map-switcher">
        <button 
          v-for="type in ['amap', 'baidu', 'google', 'cesium', 'tianditu']" 
          :key="type"
          @click="switchMap(type as any)" 
          :class="{ active: currentMap === type }"
          :title="type.toUpperCase()"
        >
          {{ type.charAt(0).toUpperCase() + type.slice(1) }}
        </button>
      </div>

      <div class="section-title">API Configuration</div>
      <div class="config-grid">
        <div class="input-field">
          <label>Amap Key</label>
          <input v-model="tokens.amap" placeholder="JS API Key" />
        </div>
        <div class="input-field">
          <label>Baidu AK</label>
          <input v-model="tokens.baidu" placeholder="Browser AK" />
        </div>
        <div class="input-field">
          <label>Google Maps</label>
          <div class="dual-input">
             <input v-model="tokens.google" placeholder="API Key" />
             <input v-model="tokens.googleMapId" placeholder="Map ID (Vector)" />
          </div>
        </div>
        <div class="input-field">
          <label>Cesium Token</label>
          <input v-model="tokens.cesium" placeholder="Ion Token" />
        </div>
        <div class="input-field">
           <label>Tianditu Token</label>
           <input v-model="tokens.tianditu" placeholder="Browser TK" />
        </div>
      </div>

      <button class="action-btn primary" @click="reInitMap">
        <span class="icon">↻</span> Reload Environment
      </button>

      <!-- 
      <div class="divider"></div>
      
      <div class="section-title" @click="showCalibration = !showCalibration" style="cursor:pointer; display:flex; justify-content:space-between;">
        <span>Calibration</span>
        <span>{{ showCalibration ? '▼' : '▶' }}</span>
      </div>
      
      <div v-if="showCalibration" class="config-grid">
         <div class="input-field">
            <label>Map Opacity: {{ opacity }}</label>
            <input type="range" min="0" max="1" step="0.1" v-model.number="opacity" />
         </div>
         <div class="input-field">
            <label>Zoom Offset: {{ zoomOffset }}</label>
            <input type="range" min="-2" max="2" step="0.1" v-model.number="zoomOffset" />
         </div>
         <div class="input-field" v-if="currentMap === 'cesium'">
            <label>Cesium Scale: {{ cesiumScale }}</label>
            <input type="range" min="0.5" max="3" step="0.05" v-model.number="cesiumScale" />
         </div>
      </div>

      <div class="divider"></div> 
      -->

      <div class="status-bar">
        <div class="status-item">
          <span class="label">Projection</span>
          <span class="value badge">{{ projectionType.toUpperCase() }}</span>
        </div>
        <div class="status-item">
           <span class="label">Zoom</span>
           <span class="value">{{ mapState.zoom.toFixed(1) }}</span>
        </div>
        <div class="status-item">
           <span class="label">Pitch</span>
           <span class="value">{{ mapState.pitch.toFixed(0) }}°</span>
        </div>
        <div class="status-item">
           <span class="label">Bearing</span>
           <span class="value">{{ mapState.bearing.toFixed(0) }}°</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, reactive, watch } from 'vue';
import { createFusionMap, FusionMap } from 'fusion-map';

const storedMap = 'tianditu'; // Force start with Tianditu
const currentMap = ref<'amap' | 'baidu' | 'cesium' | 'tianditu' | 'google'>(storedMap);
const projectionType = ref<'globe' | 'mercator'>('globe');

const opacity = ref(1);
const zoomOffset = ref(0);
const cesiumScale = ref(1.9);
const showCalibration = ref(false);

const mapState = reactive({
  zoom: 14,
  pitch: 0,
  bearing: 0,
  center: [118.7969, 32.0603]
});

let fusionMapInstance: FusionMap | null = null;

const tokens = reactive({
  amap: localStorage.getItem('fm_amap_key') || '',
  baidu: localStorage.getItem('fm_baidu_key') || '',
  cesium: localStorage.getItem('fm_cesium_key') || '',
  tianditu: localStorage.getItem('fm_tianditu_key') || '',
  google: localStorage.getItem('fm_google_key') || '',
  googleMapId: localStorage.getItem('fm_google_map_id') || ''
});

// Watchers removed for Opacity and Cesium Factor -> Restored
watch(opacity, (val) => {
  const container = document.getElementById('map-container-maplibre');
  if (container) {
    container.style.opacity = val.toString();
  }
});

watch(zoomOffset, (val) => {
  if (fusionMapInstance) {
    fusionMapInstance.setZoomOffset(val);
  }
});

watch(cesiumScale, (val) => {
  if (fusionMapInstance) {
    fusionMapInstance.setCesiumScaleFactor(val);
  }
});

const saveTokens = () => {
  localStorage.setItem('fm_amap_key', tokens.amap);
  localStorage.setItem('fm_baidu_key', tokens.baidu);
  localStorage.setItem('fm_cesium_key', tokens.cesium);
  localStorage.setItem('fm_tianditu_key', tokens.tianditu);
  localStorage.setItem('fm_google_key', tokens.google);
  localStorage.setItem('fm_google_map_id', tokens.googleMapId);
};

const initMap = () => {
  if (fusionMapInstance) {
    const container = document.getElementById('map-container');
    if (container) container.innerHTML = ''; 
    fusionMapInstance = null;
  }

  // 初始化 SDK
  fusionMapInstance = createFusionMap('map-container', {
    tokens: { ...tokens },
    mapOptions: {
      center: [118.7969, 32.0603],
      zoom: 10
    }
  });

  // Bind Events for UI
  const updateState = () => {
    if (!fusionMapInstance) return;
    // We need access to underlying map or just trust events?
    // Accessing private map is hard from here without exposing getters on FusionMap.
    // Better to use the event target or expose getters.
    // For now, let's use the event object or assume we can get it.
    // Actually FusionMap doesn't expose getters yet. 
    // Let's add getters to FusionMap in next step if needed, OR just access via "any" for demo speed.
    // Or better: FusionMap.on callback provides the event which has 'target'.
    
    // Actually, let's just use the event.
  };

  fusionMapInstance.on('move', (e: any) => {
    mapState.zoom = e.target.getZoom();
    mapState.pitch = e.target.getPitch();
    mapState.bearing = e.target.getBearing();
    const c = e.target.getCenter();
    mapState.center = [c.lng, c.lat];
  });
  
  fusionMapInstance.on('zoom', (e: any) => {
     mapState.zoom = e.target.getZoom();
  });
  
  fusionMapInstance.on('pitch', (e: any) => {
     mapState.pitch = e.target.getPitch();
  });
  
  fusionMapInstance.on('rotate', (e: any) => {
     mapState.bearing = e.target.getBearing();
  });

  // Auto-init state based on stored map
  if (currentMap.value) {
    // Small delay to ensure init
    setTimeout(() => {
        switchMap(currentMap.value);
    }, 100);
  }
};

const reInitMap = () => {
  saveTokens();
  window.location.reload();
};

onMounted(() => {
  initMap();
});

const switchMap = (type: 'amap' | 'baidu' | 'cesium' | 'tianditu' | 'google') => {
  currentMap.value = type;
  localStorage.setItem('fm_current_map', type); // Save state
  
  // Update state to reflect auto-switching
  if (type === 'cesium') {
    projectionType.value = 'globe';
  } else {
    projectionType.value = 'mercator';
  }
  fusionMapInstance?.switchBaseMap(type);
};
</script>

<style>
/* Global Reset */
body, html {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  overflow: hidden;
  background: #111;
}
</style>

<style scoped>
.layout {
  position: relative;
  width: 100vw;
  height: 100vh;
}

.map-container {
  width: 100%;
  height: 100%;
  background: #1a1a1a;
  z-index: 0;
}

/* Floating Panel */
.controls-panel {
  position: absolute;
  top: 24px;
  left: 24px;
  width: 340px;
  background: rgba(20, 20, 20, 0.75);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 24px;
  color: #fff;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  gap: 20px;
  z-index: 100;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

/* Scrollbar styling */
.controls-panel::-webkit-scrollbar {
  width: 4px;
}
.controls-panel::-webkit-scrollbar-track {
  background: transparent;
}
.controls-panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.version {
  font-size: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 400;
  color: #aaa;
}

.subtitle {
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  color: #888;
}

.section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #666;
  font-weight: 600;
  margin-bottom: -8px;
}

/* Map Switcher (Segmented Style) */
.map-switcher {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.map-switcher button {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid transparent;
  padding: 10px;
  border-radius: 8px;
  color: #aaa;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.map-switcher button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.map-switcher button.active {
  background: rgba(66, 185, 131, 0.2);
  border-color: rgba(66, 185, 131, 0.5);
  color: #42b983;
  box-shadow: 0 0 15px rgba(66, 185, 131, 0.1);
}

/* Config Grid */
.config-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-field label {
  font-size: 0.8rem;
  color: #888;
}

.input-field input {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 8px 12px;
  color: #eee;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.input-field input:focus {
  border-color: #42b983;
}

.dual-input {
    display: flex;
    gap: 8px;
}
.dual-input input {
    width: 50%;
}

/* Action Button */
.action-btn {
  background: linear-gradient(135deg, #42b983 0%, #35495e 100%);
  border: none;
  border-radius: 8px;
  padding: 12px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: transform 0.1s;
}

.action-btn:active {
  transform: scale(0.98);
}

/* Divider */
.divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0;
}

/* Status Bar */
.status-bar {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.status-item .label {
  font-size: 0.7rem;
  color: #666;
  text-transform: uppercase;
}

.status-item .value {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9rem;
  color: #eee;
}

.value.badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75rem;
  width: fit-content;
}
</style>

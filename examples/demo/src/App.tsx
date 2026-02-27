import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Alert,
  Snackbar,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import MapIcon from '@mui/icons-material/Map';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DownloadIcon from '@mui/icons-material/Download';
import { createFusionMap, FusionMap, extendFusionMapWithOverlays } from 'fusion-map';
const MonacoEditor = React.lazy(() => import('@monaco-editor/react'));

extendFusionMapWithOverlays();

const MAP_CONTAINER_ID = 'fusion-map-host';

type BaseMap = 'amap' | 'baidu' | 'cesium' | 'tianditu' | 'google';

type ActiveApi = {
  group: string;
  item: string;
};

type MapState = {
  zoom: number;
  pitch: number;
  bearing: number;
  center: [number, number];
};

type ThirdPartyCameraState = {
  type: BaseMap;
  pitch: number | null;
  heading: number | null;
};

const apiGroups = [
  { title: '地图', items: ['初始化', '生命周期', '事件监听', '坐标转换', '工具栏', '个性化样式'] },
  { title: '坐标系转换', items: ['WGS84 \u003C-\u003E GCJ02', 'WGS84 \u003C-\u003E BD09', '像素坐标', '墨卡托转换'] },
  { title: '轨迹/动画', items: ['飞行漫游', '路径动画', '定位跟踪', '视角复位'] },
  { title: '覆盖物', items: ['点', '线', '面', '海量点', '信息窗体', '热力图', '聚合'] },
  { title: '三维', items: ['倾斜摄影', 'Cesium 矢量', '视角联动', '地形开关'] },
  { title: '工具', items: ['测距测面', '截图导出', '离线瓦片', '数据调试'] }
];

const defaultCenter: [number, number] = [118.7969, 32.0603];

const cameraPresets: Array<{ label: string; center: [number, number]; zoom: number }> = [
  { label: '南京-新街口', center: [118.7784, 32.0419], zoom: 12.5 },
  { label: '南京-河西', center: [118.7167, 32.0430], zoom: 12.5 },
  { label: '南京-玄武湖', center: [118.8126, 32.0794], zoom: 12.5 }
];

type ApiStatus = 'ready' | 'partial' | 'todo';

const apiStatusMap: Record<string, ApiStatus> = {
  '地图:初始化': 'ready',
  // 覆盖物
  '覆盖物:点': 'ready',
  '覆盖物:线': 'ready',
  '覆盖物:面': 'ready',
  '覆盖物:热力图': 'partial',
  '覆盖物:聚合': 'partial',
  '覆盖物:海量点': 'todo',
  '覆盖物:信息窗体': 'todo',
  // 工具
  '工具:数据调试': 'todo'
};

const getApiStatus = (group: string, item: string): ApiStatus => {
  const key = `${group}:${item}`;
  return apiStatusMap[key] || 'todo';
};

const almostEqual = (a: number, b: number, epsilon = 0.0001) => Math.abs(a - b) < epsilon;

const isSameMapState = (a: MapState, b: MapState) => (
  almostEqual(a.zoom, b.zoom) &&
  almostEqual(a.pitch, b.pitch) &&
  almostEqual(a.bearing, b.bearing) &&
  almostEqual(a.center[0], b.center[0], 0.000001) &&
  almostEqual(a.center[1], b.center[1], 0.000001)
);

const MapStage = React.memo(() => (
  <Box className="map-stage">
    <Box id={MAP_CONTAINER_ID} className="map-canvas" />
  </Box>
));

const readToken = (key: string) => (typeof window === 'undefined' ? '' : localStorage.getItem(key) || '');

export default function App() {
  const mapRef = useRef<(FusionMap & { getOverlays?: () => any }) | null>(null);
  const [baseMap, setBaseMap] = useState<BaseMap>(() => {
    const cached = typeof window !== 'undefined' ? localStorage.getItem('fm_current_map') : null;
    return (cached as BaseMap) || 'tianditu';
  });
  const [mapState, setMapState] = useState<MapState>({ zoom: 12, pitch: 0, bearing: 0, center: defaultCenter });
  const [projection, setProjection] = useState<'globe' | 'mercator'>(baseMap === 'cesium' ? 'globe' : 'mercator');
  const [session, setSession] = useState(0);
  const [zoomOffset, setZoomOffset] = useState(0);
  const [cesiumScale, setCesiumScale] = useState(1.9);
  const [referenceOpacity, setReferenceOpacity] = useState(0.5);
  const [thirdPartyCamera, setThirdPartyCamera] = useState<ThirdPartyCameraState | null>(null);
  const [tokens, setTokens] = useState({
    amap: readToken('fm_amap_key'),
    baidu: readToken('fm_baidu_key'),
    cesium: readToken('fm_cesium_key'),
    tianditu: readToken('fm_tianditu_key'),
    google: readToken('fm_google_key'),
    googleMapId: readToken('fm_google_map_id')
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [apiQuery, setApiQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    return apiGroups.reduce((acc, group) => {
      acc[group.title] = false;
      return acc;
    }, {} as Record<string, boolean>);
  });
const slugMap: Record<string, string> = {
    '地图:初始化': 'map/init',
    '地图:生命周期': 'map/lifecycle',
    '地图:事件监听': 'map/events',
    '地图:坐标转换': 'map/coordinates',
    '地图:工具栏': 'map/controls',
    '地图:个性化样式': 'map/style',
    '坐标系转换:WGS84 <-> GCJ02': 'coords/wgs84-gcj02',
    '坐标系转换:WGS84 <-> BD09': 'coords/wgs84-bd09',
    '坐标系转换:像素坐标': 'coords/pixels',
    '坐标系转换:墨卡托转换': 'coords/mercator',
    '轨迹/动画:飞行漫游': 'motion/fly',
    '轨迹/动画:路径动画': 'motion/path',
    '轨迹/动画:定位跟踪': 'motion/tracking',
    '轨迹/动画:视角复位': 'motion/reset',
    '覆盖物:点': 'overlays/points',
    '覆盖物:线': 'overlays/lines',
    '覆盖物:面': 'overlays/polygons',
    '覆盖物:海量点': 'overlays/mass-points',
    '覆盖物:信息窗体': 'overlays/info-window',
    '覆盖物:热力图': 'overlays/heatmap',
    '覆盖物:聚合': 'overlays/clusters',
    '三维:倾斜摄影': '3d/oblique',
    '三维:Cesium 矢量': '3d/cesium-vector',
    '三维:视角联动': '3d/camera-sync',
    '三维:地形开关': '3d/terrain',
    '工具:测距测面': 'tools/measure',
    '工具:截图导出': 'tools/snapshot',
    '工具:离线瓦片': 'tools/offline-tiles',
    '工具:数据调试': 'tools/debug'
  };

  const reverseSlugMap = Object.entries(slugMap).reduce<Record<string, ActiveApi>>((acc, [key, slug]) => {
    const [group, item] = key.split(':');
    acc[slug] = { group, item };
    return acc;
  }, {});

  const buildSlug = (group: string, item: string) => {
    const key = `${group}:${item}`;
    return slugMap[key] || 'map/lifecycle';
  };

  const resolveFromSlug = (slug: string) => reverseSlugMap[slug] || null;

  const getInitialActiveApi = (): ActiveApi => {
    const fallback = { group: apiGroups[0].title, item: apiGroups[0].items[0] };
    try {
      const hash = window.location.hash || '';
      if (hash.startsWith('#/')) {
        const slug = hash.slice(2);
        const resolved = resolveFromSlug(slug);
        if (resolved) return resolved;
      }
    } catch {
      // ignore hash parse errors
    }

    return fallback;
  };

  const [activeApi, setActiveApi] = useState<ActiveApi>(() => getInitialActiveApi());

  const [overlays, setOverlays] = useState<Array<{ id: string; type: string; name: string; visible: boolean }>>([]);
  const [showAll, setShowAll] = useState(true);
  const [exportData, setExportData] = useState('');
  const [debugCommand, setDebugCommand] = useState('list');
  const [debugOutput, setDebugOutput] = useState<string[]>([]);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [qualityMode, setQualityMode] = useState('balanced');
  const [overlayOpacity, setOverlayOpacity] = useState(0.85);
  const [pointScript, setPointScript] = useState(() => {
    return `// JS Sandbox: api / overlays / manager / map / console
const points = map.points();
const marker = points.add({
  position: [118.7784, 32.0419],
  title: '点-示例',
  properties: { name: '点-示例' }
});

console.log(marker.getId());
console.log(points.list());
`;
  });
  const [lineScript, setLineScript] = useState(() => {
    return `// JS Sandbox: api / overlays / manager / map / console
const lines = map.lines();
const polyline = lines.add({
  path: [
    [118.7706, 32.0619],
    [118.7837, 32.0664],
    [118.7985, 32.0718]
  ],
  color: '#3388ff',
  width: 3
});

console.log(polyline.getId());
console.log(lines.list());
`;
  });
  const [polygonScript, setPolygonScript] = useState(() => {
    return `// JS Sandbox: api / overlays / manager / map / console
const polygons = map.polygons();
const polygon = polygons.add({
  path: [
    [118.7902, 32.0509],
    [118.8033, 32.0509],
    [118.8064, 32.0608],
    [118.7962, 32.0660]
  ],
  fillColor: '#4f46e5',
  fillOpacity: 0.35,
  strokeColor: '#1f2937',
  strokeWidth: 2,
  properties: { name: '面-示例' }
});

console.log(polygon.getId());
console.log(polygons.list());
`;
  });
  const [pointOutput, setPointOutput] = useState<string[]>([]);
  const [lineOutput, setLineOutput] = useState<string[]>([]);
  const [polygonOutput, setPolygonOutput] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem('fm_current_map', baseMap);
    mapRef.current?.switchBaseMap(baseMap);
  }, [baseMap]);

  useEffect(() => {
    const entries = [
      ['fm_amap_key', tokens.amap],
      ['fm_baidu_key', tokens.baidu],
      ['fm_cesium_key', tokens.cesium],
      ['fm_tianditu_key', tokens.tianditu],
      ['fm_google_key', tokens.google],
      ['fm_google_map_id', tokens.googleMapId]
    ];
    try {
      entries.forEach(([key, value]) => localStorage.setItem(key, value || ''));
    } catch {
      // ignore localStorage write failures in private mode
    }
  }, [tokens]);

  const getOverlayManager = () => {
    const map = mapRef.current;
    if (!map || typeof map.getOverlays !== 'function') {
      return null;
    }
    return map.getOverlays().getManager();
  };

  const updateOverlayList = () => {
    const manager = getOverlayManager();
    if (!manager) return;
    const allOverlays = manager.getAll();

    const overlayList = allOverlays.map((overlay: any) => ({
      id: overlay.getId(),
      type: overlay.getType(),
      name: overlay.getProperty('name') || overlay.getId(),
      visible: overlay.isVisible()
    }));

    setOverlays(overlayList);
  };

  useEffect(() => {
    const container = document.getElementById(MAP_CONTAINER_ID);
    if (container) container.innerHTML = '';

    const instance = createFusionMap(MAP_CONTAINER_ID, {
      tokens,
      mapOptions: {
        center: defaultCenter,
        zoom: 13,
        pitch: 45,
        bearing: 0
      }
    });

    let rafId = 0;
    let pendingState: MapState | null = null;
    let lastState: MapState = mapState;

    const flushState = () => {
      rafId = 0;
      if (!pendingState || isSameMapState(pendingState, lastState)) {
        pendingState = null;
        return;
      }
      lastState = pendingState;
      setMapState(pendingState);
      pendingState = null;
    };

    const updateState = (target: any) => {
      if (!target) return;
      const center = target.getCenter();
      pendingState = {
        zoom: target.getZoom(),
        pitch: target.getPitch(),
        bearing: target.getBearing(),
        center: [center.lng, center.lat]
      };

      if (!rafId) {
        rafId = window.requestAnimationFrame(flushState);
      }
    };

    const attach = (type: string) => {
      instance.on(type, (ev: any) => {
        const maybeTarget = ev?.target;
        if (maybeTarget && typeof maybeTarget.getCenter === 'function') {
          updateState(maybeTarget);
          return;
        }

        // Fallback: if instance exposes getMapInstance use it, otherwise
        // if instance itself looks like a MapLibre map use it directly.
        if (typeof (instance as any).getMapInstance === 'function') {
          updateState((instance as any).getMapInstance());
        } else if (typeof (instance as any).getCenter === 'function') {
          updateState(instance as any);
        } else {
          // nothing we can do
        }
      });
    };

    ['move', 'zoom', 'pitch', 'rotate'].forEach(attach);

    const syncThirdPartyCamera = () => {
      const state = (instance as any).getThirdPartyCameraState?.();
      if (state) {
        setThirdPartyCamera(state);
      }
    };

    syncThirdPartyCamera();
    const thirdPartyTimer = window.setInterval(() => {
      if (document.visibilityState === 'hidden') {
        return;
      }
      syncThirdPartyCamera();
    }, 350);

    mapRef.current = instance;
    updateOverlayList();

    // Keep Cesium calibration aligned
    if (typeof (instance as any).setZoomOffset === 'function') {
      (instance as any).setZoomOffset(zoomOffset);
    }
    if (typeof (instance as any).setCesiumScaleFactor === 'function') {
      (instance as any).setCesiumScaleFactor(cesiumScale);
    }
    if (typeof (instance as any).setReferenceOpacity === 'function') {
      (instance as any).setReferenceOpacity(referenceOpacity);
    }
    if (typeof (instance as any).setProjection === 'function') {
      (instance as any).setProjection(projection);
    }

    // Ensure initial base map
    const initialSwitchTimer = window.setTimeout(() => {
      try {
        if (typeof (instance as any).switchBaseMap === 'function') {
          (instance as any).switchBaseMap(baseMap);
        }
      } catch (e) {
        console.warn('switchBaseMap failed', e);
      }
    }, 60);

    return () => {
      window.clearTimeout(initialSwitchTimer);
      window.clearInterval(thirdPartyTimer);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }

      try {
        if (typeof (instance as any).destroy === 'function') {
          (instance as any).destroy();
        } else if (typeof (instance as any).remove === 'function') {
          (instance as any).remove();
        }
      } catch (e) {
        console.warn('Error while destroying map instance', e);
      }

      const host = document.getElementById(MAP_CONTAINER_ID);
      if (host) host.innerHTML = '';
      mapRef.current = null;
    };
  }, [session]);

  useEffect(() => {
    mapRef.current?.setZoomOffset(zoomOffset);
  }, [zoomOffset]);

  useEffect(() => {
    mapRef.current?.setCesiumScaleFactor(cesiumScale);
  }, [cesiumScale]);

  useEffect(() => {
    (mapRef.current as any)?.setReferenceOpacity?.(referenceOpacity);
  }, [referenceOpacity]);

  useEffect(() => {
    mapRef.current?.setProjection(projection);
  }, [projection]);

  const handleMapSwitch = (_: any, value: BaseMap | null) => {
    if (!value) return;
    // Validate tokens required for certain providers
    const needTokenMap: Record<BaseMap, string | null> = {
      amap: tokens.amap || null,
      baidu: tokens.baidu || null,
      google: tokens.google || null,
      tianditu: tokens.tianditu || null,
      cesium: tokens.cesium || null
    };

    const provided = needTokenMap[value];
    if (!provided) {
      setSnackbar({ open: true, message: `请先在凭据中填写 ${value} 的 Key/Token` });
      return;
    }

    if (value === 'google' && !tokens.googleMapId) {
      setSnackbar({ open: true, message: 'Google Map ID 未填写：将以基础模式运行，部分 3D/矢量能力可能不可用' });
    }

    setBaseMap(value);
  };


  const handleDeleteOverlay = (id: string) => {
    const manager = getOverlayManager();
    if (!manager) return;

    const overlay = manager.getById(id);
    if (overlay) {
      manager.remove(overlay);
      updateOverlayList();
      setSnackbar({ open: true, message: '覆盖物已删除' });
    }
  };

  const handleToggleVisibility = (id: string) => {
    const manager = getOverlayManager();
    if (!manager) return;

    const overlay = manager.getById(id);
    if (overlay) {
      overlay.setVisible(!overlay.isVisible());
      updateOverlayList();
    }
  };

  const handleShowAll = () => {
    const manager = getOverlayManager();
    if (!manager) return;
    manager.showAll();
    updateOverlayList();
    setShowAll(true);
  };

  const handleHideAll = () => {
    const manager = getOverlayManager();
    if (!manager) return;
    manager.hideAll();
    updateOverlayList();
    setShowAll(false);
  };

  const handleClearAll = () => {
    const manager = getOverlayManager();
    if (!manager) return;
    manager.clear();
    updateOverlayList();
    setSnackbar({ open: true, message: '所有覆盖物已清空' });
  };

  const handleExportGeoJSON = () => {
    const overlaysApi = mapRef.current?.getOverlays?.();
    if (!overlaysApi) return;
    const geojson = overlaysApi.exportToGeoJSON();
    const jsonStr = JSON.stringify(geojson, null, 2);
    setExportData(jsonStr);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'overlays.geojson';
    a.click();
    URL.revokeObjectURL(url);

    setSnackbar({ open: true, message: 'GeoJSON已导出' });
  };

  const handleRunDebug = () => {
    const manager = getOverlayManager();
    if (!manager) return;
    const command = debugCommand.trim().toLowerCase();
    let result = '';

    if (command === 'list') {
      const items = manager.getAll().map((overlay: any) => `${overlay.getType()}#${overlay.getId()}`);
      result = items.length ? items.join(', ') : 'no overlays';
    } else if (command === 'stats') {
      const stats = (manager as any).getTypeStats?.() || {};
      result = JSON.stringify(stats);
    } else if (command === 'clear') {
      manager.clear();
      updateOverlayList();
      result = 'overlays cleared';
    } else {
      result = `unknown command: ${command}`;
    }

    setDebugOutput(prev => [`> ${debugCommand}`, result, ...prev].slice(0, 12));
  };

  const handleClearDebug = () => {
    setDebugOutput([]);
  };

  const runOverlayScript = (script: string, setOutput: React.Dispatch<React.SetStateAction<string[]>>) => {
    const overlaysApi = mapRef.current?.getOverlays?.();
    if (!overlaysApi) return;

    const manager = overlaysApi.getManager();
    const mapWithModules = mapRef.current as any;

    const outputLines: string[] = [];
    const formatArg = (arg: any) => {
      if (typeof arg === 'string') return arg;
      if (arg === null || arg === undefined) return String(arg);
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return Object.prototype.toString.call(arg);
        }
      }
      return String(arg);
    };
    const sandboxConsole = {
      log: (...args: any[]) => outputLines.push(args.map(formatArg).join(' ')),
      warn: (...args: any[]) => outputLines.push(`warn: ${args.map(formatArg).join(' ')}`),
      error: (...args: any[]) => outputLines.push(`error: ${args.map(formatArg).join(' ')}`)
    };

    const api = {
      createMarker: (options: any) => overlaysApi.createMarker(options),
      createPolyline: (options: any) => overlaysApi.createPolyline(options),
      createPolygon: (options: any) => overlaysApi.createPolygon(options),
      clear: () => overlaysApi.clearOverlays(),
      list: () => manager.getAll().map((overlay: any) => `${overlay.getType()}#${overlay.getId()}`),
      stats: () => (manager as any).getTypeStats?.() || {},
      getManager: () => manager,
      getOverlays: () => overlaysApi
    };

    try {
      const runner = new Function('api', 'overlays', 'manager', 'map', 'console', `"use strict";\n${script}`);
      runner(api, overlaysApi, manager, mapWithModules, sandboxConsole);
      if (!outputLines.length) {
        outputLines.push('script executed');
      }
    } catch (error) {
      outputLines.push(`runtime error: ${String(error)}`);
    }

    updateOverlayList();
    setOutput(prev => [...outputLines, ...prev].slice(0, 10));
  };

  const projectionLabel = projection === 'globe' ? 'Globe' : 'Mercator';
  const centerLng = mapState.center[0].toFixed(6);
  const centerLat = mapState.center[1].toFixed(6);
  const thirdPartyPitchLabel = thirdPartyCamera?.pitch == null ? '--' : `${thirdPartyCamera.pitch.toFixed(1)}°`;
  const thirdPartyHeadingLabel = thirdPartyCamera?.heading == null ? '--' : `${thirdPartyCamera.heading.toFixed(1)}°`;
  const lensMetric = (label: string, value: string, emphasize = false) => (
    <Box
      sx={{
        px: 1,
        py: 0.75,
        borderRadius: 1,
        border: theme => `1px solid ${theme.palette.divider}`,
        backgroundColor: emphasize ? 'action.selected' : 'background.paper'
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.1 }}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ mt: 0.25, lineHeight: 1.2 }}>
        {value}
      </Typography>
    </Box>
  );

  const flyToPreset = (center: [number, number], zoom: number) => {
    const map = (mapRef.current as any)?.getMapInstance?.();
    if (!map || typeof map.flyTo !== 'function') {
      return;
    }
    map.flyTo({ center, zoom, essential: true });
  };

  const getOverlayStats = () => {
    const manager = getOverlayManager();
    if (!manager) return { total: 0, marker: 0, polyline: 0, polygon: 0, visible: 0 };
    const stats = (manager as any).getTypeStats?.() || {};
    const visible = (manager as any).getVisibleCount?.() ?? manager.getAll().filter((item: any) => item.isVisible()).length;
    return {
      total: manager.getCount(),
      marker: stats.marker || 0,
      polyline: stats.polyline || 0,
      polygon: stats.polygon || 0,
      visible
    };
  };

  const renderOverlayPanel = () => {
    const stats = getOverlayStats();
    const renderSandbox = (
      title: string,
      script: string,
      setScript: React.Dispatch<React.SetStateAction<string>>,
      output: string[],
      setOutput: React.Dispatch<React.SetStateAction<string[]>>
    ) => (
      <Box>
        <Typography variant="caption" color="text.secondary">{title}</Typography>
        <Stack spacing={1} mt={1}>
          <Box className="code-editor">
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              JS Sandbox
            </Typography>
            <React.Suspense fallback={<Box sx={{ px: 1, py: 2, color: 'text.secondary' }}>Loading editor...</Box>}>
              <MonacoEditor
                height="260px"
                language="javascript"
                theme="vs-light"
                value={script}
                onChange={(value) => setScript(value ?? '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on'
                }}
              />
            </React.Suspense>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => runOverlayScript(script, setOutput)} fullWidth>
              Run
            </Button>
          </Stack>
          <TextField
            size="small"
            label="Output"
            value={output.join('\n')}
            multiline
            rows={4}
          />
        </Stack>
      </Box>
    );

    if (activeApi.item === '点') {
      return (
        <Stack spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">覆盖物统计</Typography>
            <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
              <Chip label={`总数: ${stats.total}`} size="small" variant="outlined" />
              <Chip label={`标记: ${stats.marker}`} size="small" variant="outlined" />
              <Chip label={`折线: ${stats.polyline}`} size="small" variant="outlined" />
              <Chip label={`多边形: ${stats.polygon}`} size="small" variant="outlined" />
              <Chip label={`可见: ${stats.visible}`} size="small" variant="outlined" />
            </Stack>
          </Box>

          <Divider flexItem />
          {renderSandbox('点模块调试', pointScript, setPointScript, pointOutput, setPointOutput)}
        </Stack>
      );
    }

    if (activeApi.item === '线') {
      return (
        <Stack spacing={2}>
          {renderSandbox('线模块调试', lineScript, setLineScript, lineOutput, setLineOutput)}
        </Stack>
      );
    }

    if (activeApi.item === '面') {
      return (
        <Stack spacing={2}>
          {renderSandbox('面模块调试', polygonScript, setPolygonScript, polygonOutput, setPolygonOutput)}
        </Stack>
      );
    }

    if (activeApi.item === '热力图') {
      return (
        <Stack spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">热力图显示</Typography>
            <ToggleButtonGroup
              size="small"
              value={heatmapEnabled ? 'heatmap' : 'markers'}
              exclusive
              onChange={(_, value) => {
                if (value) setHeatmapEnabled(value === 'heatmap');
              }}
              sx={{ mt: 1 }}
            >
              <ToggleButton value="markers">Markers</ToggleButton>
              <ToggleButton value="heatmap">Heatmap</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">渲染质量</Typography>
            <FormControl fullWidth size="small" sx={{ mt: 1 }}>
              <InputLabel>Quality</InputLabel>
              <Select
                value={qualityMode}
                label="Quality"
                onChange={e => setQualityMode(e.target.value)}
              >
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="balanced">Balanced</MenuItem>
                <MenuItem value="quality">Quality</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">覆盖物透明度</Typography>
            <Slider
              size="small"
              value={overlayOpacity}
              min={0.2}
              max={1}
              step={0.05}
              onChange={(_, value) => setOverlayOpacity(value as number)}
            />
          </Box>
        </Stack>
      );
    }

    if (activeApi.item === '聚合') {
      return (
        <Stack spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">覆盖物管理</Typography>
            <Stack spacing={1} mt={1}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  onClick={handleShowAll}
                  fullWidth
                  disabled={showAll}
                >
                  显示所有
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<VisibilityOffIcon />}
                  onClick={handleHideAll}
                  fullWidth
                  disabled={!showAll}
                >
                  隐藏所有
                </Button>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleClearAll}
                  fullWidth
                >
                  清空所有
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportGeoJSON}
                  fullWidth
                >
                  导出GeoJSON
                </Button>
              </Stack>
            </Stack>
          </Box>
          <Divider flexItem />
          <Box>
            <Typography variant="caption" color="text.secondary">覆盖物列表 ({overlays.length})</Typography>
            <Stack spacing={1} mt={1} sx={{ maxHeight: 240, overflowY: 'auto' }}>
              {overlays.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  暂无覆盖物
                </Typography>
              ) : (
                overlays.map(overlay => (
                  <Paper key={overlay.id} elevation={1} sx={{ p: 1 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack>
                        <Typography variant="body2" fontWeight={600}>
                          {overlay.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {overlay.type} • {overlay.id}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleVisibility(overlay.id)}
                          color={overlay.visible ? 'primary' : 'default'}
                        >
                          {overlay.visible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteOverlay(overlay.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>
          </Box>
        </Stack>
      );
    }

    if (activeApi.item === '信息窗体' || activeApi.item === '海量点') {
      return (
        <Alert severity="info">
          该能力尚未实现，优先完成覆盖物基础能力后再补齐。
        </Alert>
      );
    }

    return null;
  };

  const normalizedQuery = apiQuery.trim().toLowerCase();
  const visibleApiGroups = apiGroups
    .map((group) => {
      if (!normalizedQuery) {
        return group;
      }

      const groupMatched = group.title.toLowerCase().includes(normalizedQuery);
      const items = groupMatched
        ? group.items
        : group.items.filter((item) => item.toLowerCase().includes(normalizedQuery));

      return { ...group, items };
    })
    .filter((group) => group.items.length > 0);

  const toggleGroup = (title: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const toggleAllGroups = () => {
    const hasExpanded = apiGroups.some((group) => !collapsedGroups[group.title]);
    setCollapsedGroups(
      apiGroups.reduce((acc, group) => {
        acc[group.title] = hasExpanded;
        return acc;
      }, {} as Record<string, boolean>)
    );
  };

  const handleSelectApi = (group: string, item: string) => {
    setActiveApi({ group, item });
    try {
      window.location.hash = `#/${buildSlug(group, item)}`;
    } catch {
      // ignore hash update errors
    }
  };

  React.useEffect(() => {
    const onHashChange = () => {
      const next = getInitialActiveApi();
      setActiveApi(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const renderActiveGuide = () => {
    if (activeApi.group === '覆盖物') {
      return (
        <Alert severity="info" sx={{ mb: 1 }}>
          覆盖物调试已集成到右侧面板，请在左侧选择具体能力。
        </Alert>
      );
    }

    if (activeApi.group === '地图' && activeApi.item === '初始化') {
      return (
        <Alert severity="info" sx={{ mb: 1 }}>
          初始化模块用于配置底图、投影、凭据与调试工具。
        </Alert>
      );
    }

    if (activeApi.group === '坐标系转换') {
      return (
        <Alert severity="info" sx={{ mb: 1 }}>
          当前选择的能力为坐标转换，请关注经纬度与投影面板的变化。
        </Alert>
      );
    }

    if (activeApi.group === '三维') {
      return (
        <Alert severity="info" sx={{ mb: 1 }}>
          三维能力需要切换 Cesium 底图以观察调试效果。
        </Alert>
      );
    }

    return (
      <Alert severity="info" sx={{ mb: 1 }}>
        当前调试项：{activeApi.item}
      </Alert>
    );
  };

  return (
    <Box className="app-shell">
      <Paper elevation={1} className="panel nav-panel">
        <Stack direction="row" alignItems="center" gap={1} className="panel-header">
          <MapIcon fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700}>FusionMap API</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          左侧按 API 分类，选择你要调试的能力。
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          <TextField
            size="small"
            placeholder="搜索 API / 能力"
            value={apiQuery}
            onChange={(e) => setApiQuery(e.target.value)}
            fullWidth
          />
          <Button size="small" variant="outlined" onClick={toggleAllGroups} disabled={Boolean(normalizedQuery)}>
            {apiGroups.some((group) => !collapsedGroups[group.title]) ? '全部收起' : '全部展开'}
          </Button>
        </Stack>
        <Divider sx={{ mb: 1 }} />
        <List dense sx={{ overflowY: 'auto', flex: 1 }}>
          {visibleApiGroups.map(group => {
            const collapsed = normalizedQuery ? false : Boolean(collapsedGroups[group.title]);
            return (
              <Box key={group.title} sx={{ mb: 1.5 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ pl: 1, pr: 0.5 }}
                >
                  <Typography variant="caption" color="text.secondary">{group.title}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => toggleGroup(group.title)}
                    disabled={Boolean(normalizedQuery)}
                  >
                    {collapsed ? <KeyboardArrowRightIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                  </IconButton>
                </Stack>
                {!collapsed && group.items.map(item => (
                  <ListItemButton
                    key={item}
                    className="nav-item"
                    dense
                    selected={activeApi.group === group.title && activeApi.item === item}
                    onClick={() => handleSelectApi(group.title, item)}
                  >
                    <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary={item} />
                    {getApiStatus(group.title, item) === 'todo' && (
                      <Chip label="未实现" size="small" variant="outlined" color="warning" />
                    )}
                    {getApiStatus(group.title, item) === 'partial' && (
                      <Chip label="部分" size="small" variant="outlined" color="info" />
                    )}
                  </ListItemButton>
                ))}
              </Box>
            );
          })}
          {visibleApiGroups.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
              未找到匹配项
            </Typography>
          )}
        </List>
      </Paper>

      <MapStage />

        <Paper elevation={2} className="panel inspector-panel">
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Stack>
              <Typography variant="subtitle1" fontWeight={700}>调试面板 · {activeApi.item}</Typography>
              <Typography variant="caption" color="text.secondary">当前分类：{activeApi.group}</Typography>
            </Stack>
            <Tooltip title="重建环境">
              <IconButton onClick={() => setSession(v => v + 1)} size="small" color="primary">
                <RestartAltIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {renderActiveGuide()}

          {activeApi.group === '覆盖物' ? (
            renderOverlayPanel()
          ) : activeApi.group === '地图' && activeApi.item === '初始化' ? (
            <>
              <Box className="badge-row" sx={{ mb: 1, p: 1.25 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>镜头信息</Typography>
                  <Chip label="实时" size="small" color="success" variant="outlined" />
                </Stack>

                <Stack spacing={1}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      border: theme => `1px solid ${theme.palette.divider}`,
                      backgroundColor: 'action.hover'
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                      <Typography variant="caption" color="text.secondary">MapLibre</Typography>
                      <Typography variant="caption" color="text.secondary">WGS84 (EPSG:4326)</Typography>
                    </Stack>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.75 }}>
                      {lensMetric('Projection', projectionLabel, true)}
                      {lensMetric('Zoom', mapState.zoom.toFixed(1))}
                      {lensMetric('Pitch', `${mapState.pitch.toFixed(1)}°`)}
                      {lensMetric('Bearing', `${mapState.bearing.toFixed(1)}°`)}
                      {lensMetric('Lng', centerLng)}
                      {lensMetric('Lat', centerLat)}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      border: theme => `1px solid ${theme.palette.divider}`,
                      backgroundColor: 'action.hover'
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                      <Typography variant="caption" color="text.secondary">第三方底图</Typography>
                      <Typography variant="caption" color="text.secondary">{(thirdPartyCamera?.type || baseMap).toUpperCase()}</Typography>
                    </Stack>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 0.75 }}>
                      {lensMetric('Source', thirdPartyCamera?.type || baseMap, true)}
                      {lensMetric('Pitch', thirdPartyPitchLabel)}
                      {lensMetric('Heading', thirdPartyHeadingLabel)}
                    </Box>
                  </Box>
                </Stack>
              </Box>

              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">底图类型</Typography>
                  <ToggleButtonGroup
                    value={baseMap}
                    exclusive
                    fullWidth
                    size="small"
                    onChange={handleMapSwitch}
                    sx={{ mt: 0.5 }}
                  >
                    <ToggleButton value="amap">高德</ToggleButton>
                    <ToggleButton value="baidu">百度</ToggleButton>
                    <ToggleButton value="google">谷歌</ToggleButton>
                    <ToggleButton value="tianditu">天地图</ToggleButton>
                    <ToggleButton value="cesium">Cesium</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Divider flexItem />

                <Box>
                  <Typography variant="caption" color="text.secondary">快速定位</Typography>
                  <Stack direction="row" spacing={1} mt={1}>
                    {cameraPresets.map((preset) => (
                      <Button
                        key={preset.label}
                        variant="outlined"
                        size="small"
                        onClick={() => flyToPreset(preset.center, preset.zoom)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </Stack>
                </Box>

                <Divider flexItem />

                <Box>
                  <Typography variant="caption" color="text.secondary">调试</Typography>
                  <Stack spacing={1} mt={1}>
                    <TextField
                      size="small"
                      label="Command (list | stats | clear)"
                      value={debugCommand}
                      onChange={e => setDebugCommand(e.target.value)}
                    />
                    <Stack direction="row" spacing={1}>
                      <Button variant="outlined" onClick={handleRunDebug} fullWidth>
                        Run
                      </Button>
                      <Button variant="text" onClick={handleClearDebug} fullWidth>
                        Clear
                      </Button>
                    </Stack>
                    <TextField
                      size="small"
                      label="Debug Output"
                      value={debugOutput.join('\n')}
                      multiline
                      rows={6}
                    />
                  </Stack>
                </Box>

                <Divider flexItem />

                <Box>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">联动校准</Typography>
                    <Typography variant="caption" color="text.secondary">Zoom Offset: {zoomOffset.toFixed(1)}</Typography>
                  </Stack>
                  <Slider
                    min={-2}
                    max={2}
                    step={0.1}
                    value={zoomOffset}
                    onChange={(_, v) => setZoomOffset(v as number)}
                    size="small"
                  />
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Cesium Scale: {cesiumScale.toFixed(2)}</Typography>
                    <Typography variant="caption" color="text.secondary">仅在 3D 有效</Typography>
                  </Stack>
                  <Slider
                    min={0.5}
                    max={3}
                    step={0.05}
                    value={cesiumScale}
                    onChange={(_, v) => setCesiumScale(v as number)}
                    size="small"
                  />
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">参考底图透明度</Typography>
                    <Typography variant="caption" color="text.secondary">{Math.round(referenceOpacity * 100)}%</Typography>
                  </Stack>
                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    value={referenceOpacity}
                    onChange={(_, v) => setReferenceOpacity(v as number)}
                    size="small"
                  />
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">MapLibre 投影</Typography>
                  <ToggleButtonGroup
                    value={projection}
                    exclusive
                    fullWidth
                    size="small"
                    onChange={(_, value: 'globe' | 'mercator' | null) => {
                      if (!value) return;
                      setProjection(value);
                    }}
                    sx={{ mt: 0.5 }}
                  >
                    <ToggleButton value="globe">球面 Globe</ToggleButton>
                    <ToggleButton value="mercator">墨卡托 Mercator</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Divider flexItem />

                <Box>
                  <Typography variant="caption" color="text.secondary">凭据</Typography>
                  <Stack direction="row" gap={0.5} sx={{ flexWrap: 'wrap', mt: 1 }}>
                    <Chip size="small" variant={tokens.amap ? 'filled' : 'outlined'} color={tokens.amap ? 'success' : 'default'} label="Amap" />
                    <Chip size="small" variant={tokens.baidu ? 'filled' : 'outlined'} color={tokens.baidu ? 'success' : 'default'} label="Baidu" />
                    <Chip size="small" variant={tokens.google ? 'filled' : 'outlined'} color={tokens.google ? 'success' : 'default'} label="Google" />
                    <Chip size="small" variant={tokens.tianditu ? 'filled' : 'outlined'} color={tokens.tianditu ? 'success' : 'default'} label="Tianditu" />
                    <Chip size="small" variant={tokens.cesium ? 'filled' : 'outlined'} color={tokens.cesium ? 'success' : 'default'} label="Cesium" />
                  </Stack>
                  <Stack spacing={1} mt={1}>
                    <TextField size="small" label="Amap Key" value={tokens.amap} onChange={e => setTokens(t => ({ ...t, amap: e.target.value }))} />
                    <TextField size="small" label="Baidu AK" value={tokens.baidu} onChange={e => setTokens(t => ({ ...t, baidu: e.target.value }))} />
                    <TextField size="small" label="Cesium Token" value={tokens.cesium} onChange={e => setTokens(t => ({ ...t, cesium: e.target.value }))} />
                    <TextField size="small" label="Tianditu TK" value={tokens.tianditu} onChange={e => setTokens(t => ({ ...t, tianditu: e.target.value }))} />
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        label="Google Key"
                        value={tokens.google}
                        onChange={e => setTokens(t => ({ ...t, google: e.target.value }))}
                        fullWidth
                      />
                      <TextField
                        size="small"
                        label="Map ID"
                        value={tokens.googleMapId}
                        onChange={e => setTokens(t => ({ ...t, googleMapId: e.target.value }))}
                        fullWidth
                      />
                    </Stack>
                    <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => setSession(v => v + 1)}>
                      应用凭据并重载
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </>
          ) : getApiStatus(activeApi.group, activeApi.item) === 'todo' ? (
            <Box />
          ) : (
            <>
              <Box className="badge-row" sx={{ mb: 1, p: 1.25 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>镜头信息</Typography>
                  <Chip label="实时" size="small" color="success" variant="outlined" />
                </Stack>

                <Stack spacing={1}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      border: theme => `1px solid ${theme.palette.divider}`,
                      backgroundColor: 'action.hover'
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                      <Typography variant="caption" color="text.secondary">MapLibre</Typography>
                      <Typography variant="caption" color="text.secondary">WGS84 (EPSG:4326)</Typography>
                    </Stack>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 0.75 }}>
                      {lensMetric('Projection', projectionLabel, true)}
                      {lensMetric('Zoom', mapState.zoom.toFixed(1))}
                      {lensMetric('Pitch', `${mapState.pitch.toFixed(1)}°`)}
                      {lensMetric('Bearing', `${mapState.bearing.toFixed(1)}°`)}
                      {lensMetric('Lng', centerLng)}
                      {lensMetric('Lat', centerLat)}
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      border: theme => `1px solid ${theme.palette.divider}`,
                      backgroundColor: 'action.hover'
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                      <Typography variant="caption" color="text.secondary">第三方底图</Typography>
                      <Typography variant="caption" color="text.secondary">{(thirdPartyCamera?.type || baseMap).toUpperCase()}</Typography>
                    </Stack>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 0.75 }}>
                      {lensMetric('Source', thirdPartyCamera?.type || baseMap, true)}
                      {lensMetric('Pitch', thirdPartyPitchLabel)}
                      {lensMetric('Heading', thirdPartyHeadingLabel)}
                    </Box>
                  </Box>
                </Stack>
              </Box>

              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">底图类型</Typography>
                  <ToggleButtonGroup
                    value={baseMap}
                    exclusive
                    fullWidth
                    size="small"
                    onChange={handleMapSwitch}
                    sx={{ mt: 0.5 }}
                  >
                    <ToggleButton value="amap">高德</ToggleButton>
                    <ToggleButton value="baidu">百度</ToggleButton>
                    <ToggleButton value="google">谷歌</ToggleButton>
                    <ToggleButton value="tianditu">天地图</ToggleButton>
                    <ToggleButton value="cesium">Cesium</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">MapLibre 投影</Typography>
                  <ToggleButtonGroup
                    value={projection}
                    exclusive
                    fullWidth
                    size="small"
                    onChange={(_, value: 'globe' | 'mercator' | null) => {
                      if (!value) return;
                      setProjection(value);
                    }}
                    sx={{ mt: 0.5 }}
                  >
                    <ToggleButton value="globe">球面 Globe</ToggleButton>
                    <ToggleButton value="mercator">墨卡托 Mercator</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Divider flexItem />

                <Box>
                  <Typography variant="caption" color="text.secondary">凭据</Typography>
                  <Stack direction="row" gap={0.5} sx={{ flexWrap: 'wrap', mt: 1 }}>
                    <Chip size="small" variant={tokens.amap ? 'filled' : 'outlined'} color={tokens.amap ? 'success' : 'default'} label="Amap" />
                    <Chip size="small" variant={tokens.baidu ? 'filled' : 'outlined'} color={tokens.baidu ? 'success' : 'default'} label="Baidu" />
                    <Chip size="small" variant={tokens.google ? 'filled' : 'outlined'} color={tokens.google ? 'success' : 'default'} label="Google" />
                    <Chip size="small" variant={tokens.tianditu ? 'filled' : 'outlined'} color={tokens.tianditu ? 'success' : 'default'} label="Tianditu" />
                    <Chip size="small" variant={tokens.cesium ? 'filled' : 'outlined'} color={tokens.cesium ? 'success' : 'default'} label="Cesium" />
                  </Stack>
                  <Stack spacing={1} mt={1}>
                    <TextField size="small" label="Amap Key" value={tokens.amap} onChange={e => setTokens(t => ({ ...t, amap: e.target.value }))} />
                    <TextField size="small" label="Baidu AK" value={tokens.baidu} onChange={e => setTokens(t => ({ ...t, baidu: e.target.value }))} />
                    <TextField size="small" label="Cesium Token" value={tokens.cesium} onChange={e => setTokens(t => ({ ...t, cesium: e.target.value }))} />
                    <TextField size="small" label="Tianditu TK" value={tokens.tianditu} onChange={e => setTokens(t => ({ ...t, tianditu: e.target.value }))} />
                    <Stack direction="row" spacing={1}>
                      <TextField
                        size="small"
                        label="Google Key"
                        value={tokens.google}
                        onChange={e => setTokens(t => ({ ...t, google: e.target.value }))}
                        fullWidth
                      />
                      <TextField
                        size="small"
                        label="Map ID"
                        value={tokens.googleMapId}
                        onChange={e => setTokens(t => ({ ...t, googleMapId: e.target.value }))}
                        fullWidth
                      />
                    </Stack>
                    <Button variant="contained" startIcon={<RefreshIcon />} onClick={() => setSession(v => v + 1)}>
                      应用凭据并重载
                    </Button>
                  </Stack>
                </Box>

                <Divider flexItem />
              </Stack>
            </>
          )}
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity="warning" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

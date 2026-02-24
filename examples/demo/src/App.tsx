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
  Typography
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import RefreshIcon from '@mui/icons-material/Refresh';
import MapIcon from '@mui/icons-material/Map';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { createFusionMap, FusionMap } from 'fusion-map';

const MAP_CONTAINER_ID = 'fusion-map-host';

type BaseMap = 'amap' | 'baidu' | 'cesium' | 'tianditu' | 'google';

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
  { title: '地图', items: ['生命周期', '事件监听', '坐标转换', '工具栏', '个性化样式'] },
  { title: '坐标系转换', items: ['WGS84 \u003C-\u003E GCJ02', 'WGS84 \u003C-\u003E BD09', '像素坐标', '墨卡托转换'] },
  { title: '轨迹/动画', items: ['飞行漫游', '路径动画', '定位跟踪', '视角复位'] },
  { title: '覆盖物', items: ['点/线/面', '海量点', '信息窗体', '热力图', '聚合'] },
  { title: '三维', items: ['倾斜摄影', 'Cesium 矢量', '视角联动', '地形开关'] },
  { title: '工具', items: ['测距测面', '截图导出', '离线瓦片', '数据调试'] }
];

const defaultCenter: [number, number] = [116.512492, 39.870734];

const cameraPresets: Array<{ label: string; center: [number, number]; zoom: number }> = [
  { label: '北京', center: [116.3974, 39.9093], zoom: 11.5 },
  { label: '上海', center: [121.4737, 31.2304], zoom: 11.5 },
  { label: '深圳', center: [114.0579, 22.5431], zoom: 11.5 }
];

const almostEqual = (a: number, b: number, epsilon = 0.0001) => Math.abs(a - b) < epsilon;

const isSameMapState = (a: MapState, b: MapState) => (
  almostEqual(a.zoom, b.zoom) &&
  almostEqual(a.pitch, b.pitch) &&
  almostEqual(a.bearing, b.bearing) &&
  almostEqual(a.center[0], b.center[0], 0.000001) &&
  almostEqual(a.center[1], b.center[1], 0.000001)
);

const readToken = (key: string) => (typeof window === 'undefined' ? '' : localStorage.getItem(key) || '');

export default function App() {
  const mapRef = useRef<FusionMap | null>(null);
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
                  <ListItemButton key={item} className="nav-item" dense>
                    <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary={item} />
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

      <Box className="map-stage">
        <Box id={MAP_CONTAINER_ID} className="map-canvas" />
      </Box>

      <Paper elevation={2} className="panel inspector-panel">
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Stack>
            <Typography variant="subtitle1" fontWeight={700}>调试面板</Typography>
            <Typography variant="caption" color="text.secondary">右侧用于凭据、投影、联动调试</Typography>
          </Stack>
          <Tooltip title="重建环境">
            <IconButton onClick={() => setSession(v => v + 1)} size="small" color="primary">
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

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
        </Stack>
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity="warning" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

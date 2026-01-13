import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import ExploreIcon from '@mui/icons-material/Explore';
import PlaceIcon from '@mui/icons-material/Place';
import RefreshIcon from '@mui/icons-material/Refresh';
import MapIcon from '@mui/icons-material/Map';
import { createFusionMap, FusionMap } from 'fusion-map';

const MAP_CONTAINER_ID = 'fusion-map-host';

type BaseMap = 'amap' | 'baidu' | 'cesium' | 'tianditu' | 'google';

type MapState = {
  zoom: number;
  pitch: number;
  bearing: number;
  center: [number, number];
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
  const [coords, setCoords] = useState({ lng: defaultCenter[0], lat: defaultCenter[1] });
  const [pixel, setPixel] = useState({ x: 0, y: 0 });
  const [tokens, setTokens] = useState({
    amap: readToken('fm_amap_key'),
    baidu: readToken('fm_baidu_key'),
    cesium: readToken('fm_cesium_key'),
    tianditu: readToken('fm_tianditu_key'),
    google: readToken('fm_google_key'),
    googleMapId: readToken('fm_google_map_id')
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  useEffect(() => {
    localStorage.setItem('fm_current_map', baseMap);
    setProjection(baseMap === 'cesium' ? 'globe' : 'mercator');
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
    entries.forEach(([key, value]) => localStorage.setItem(key, value || ''));
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

    const updateState = (target: any) => {
      if (!target) return;
      const center = target.getCenter();
      setMapState({
        zoom: target.getZoom(),
        pitch: target.getPitch(),
        bearing: target.getBearing(),
        center: [center.lng, center.lat]
      });
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

    mapRef.current = instance;

    // Keep Cesium calibration aligned
    if (typeof (instance as any).setZoomOffset === 'function') {
      (instance as any).setZoomOffset(zoomOffset);
    }
    if (typeof (instance as any).setCesiumScaleFactor === 'function') {
      (instance as any).setCesiumScaleFactor(cesiumScale);
    }

    // Ensure initial base map
    setTimeout(() => {
      try {
        if (typeof (instance as any).switchBaseMap === 'function') {
          (instance as any).switchBaseMap(baseMap);
        }
      } catch (e) {
        console.warn('switchBaseMap failed', e);
      }
    }, 60);

    return () => {
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

    setBaseMap(value);
  };

  const handleLngLatToPixel = () => {
    const map = mapRef.current?.getMapInstance();
    if (!map) return;
    const { x, y } = map.project([coords.lng, coords.lat]);
    setPixel({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
  };

  const handlePixelToLngLat = () => {
    const map = mapRef.current?.getMapInstance();
    if (!map) return;
    const point = map.unproject([pixel.x, pixel.y]);
    setCoords({ lng: Number(point.lng.toFixed(6)), lat: Number(point.lat.toFixed(6)) });
  };

  const handleFlyToDemo = () => {
    const map = mapRef.current?.getMapInstance();
    if (!map) return;
    map.flyTo({ center: defaultCenter, zoom: 15, pitch: 60, bearing: 22, duration: 1200 });
  };

  const projectionLabel = useMemo(() => (projection === 'globe' ? 'Globe' : 'Mercator'), [projection]);

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
        <Divider sx={{ mb: 1 }} />
        <List dense sx={{ overflowY: 'auto', flex: 1 }}>
          {apiGroups.map(group => (
            <Box key={group.title} sx={{ mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>{group.title}</Typography>
              {group.items.map(item => (
                <ListItemButton key={item} className="nav-item" dense>
                  <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary={item} />
                </ListItemButton>
              ))}
            </Box>
          ))}
        </List>
      </Paper>

      <Box className="map-stage">
        <Box id={MAP_CONTAINER_ID} className="map-canvas" />
        <Box className="map-floating">
          <Stack direction="row" spacing={1} alignItems="center" className="badge-row">
            <Chip label={`Projection: ${projectionLabel}`} size="small" color="primary" variant="outlined" />
            <Chip label={`Zoom ${mapState.zoom.toFixed(1)}`} size="small" variant="outlined" />
            <Chip label={`Pitch ${mapState.pitch.toFixed(0)}°`} size="small" variant="outlined" />
            <Chip label={`Bearing ${mapState.bearing.toFixed(0)}°`} size="small" variant="outlined" />
          </Stack>
        </Box>
      </Box>

      <Paper elevation={2} className="panel inspector-panel">
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Stack>
            <Typography variant="subtitle1" fontWeight={700}>调试面板</Typography>
            <Typography variant="caption" color="text.secondary">右侧用于凭据、投影、坐标调试</Typography>
          </Stack>
          <Tooltip title="重建环境">
            <IconButton onClick={() => setSession(v => v + 1)} size="small" color="primary">
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

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
            <Typography variant="caption" color="text.secondary">凭据</Typography>
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
          </Box>

          <Divider flexItem />

          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="caption" color="text.secondary">坐标调试</Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" startIcon={<ExploreIcon />} onClick={handleFlyToDemo}>
                  飞到示例点
                </Button>
                <Button size="small" variant="contained" color="secondary" startIcon={<PlaceIcon />} onClick={handleLngLatToPixel}>
                  {"经纬 -> 像素"}
                </Button>
                <Button size="small" variant="outlined" onClick={handlePixelToLngLat}>
                  {"像素 -> 经纬"}
                </Button>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={1} mb={1}>
              <TextField
                size="small"
                label="Longitude"
                type="number"
                value={coords.lng}
                onChange={e => setCoords({ ...coords, lng: Number(e.target.value) })}
                fullWidth
              />
              <TextField
                size="small"
                label="Latitude"
                type="number"
                value={coords.lat}
                onChange={e => setCoords({ ...coords, lat: Number(e.target.value) })}
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                label="Pixel X"
                type="number"
                value={pixel.x}
                onChange={e => setPixel({ ...pixel, x: Number(e.target.value) })}
                fullWidth
              />
              <TextField
                size="small"
                label="Pixel Y"
                type="number"
                value={pixel.y}
                onChange={e => setPixel({ ...pixel, y: Number(e.target.value) })}
                fullWidth
              />
            </Stack>
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

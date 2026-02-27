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
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  InputAdornment
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PlaceIcon from '@mui/icons-material/Place';
import PolylineIcon from '@mui/icons-material/Timeline';
import PolygonIcon from '@mui/icons-material/ChangeHistory';
import SearchIcon from '@mui/icons-material/Search';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DownloadIcon from '@mui/icons-material/Download';
import { createFusionMap, FusionMap, extendFusionMapWithOverlays } from 'fusion-map';

extendFusionMapWithOverlays();

const MAP_CONTAINER_ID = 'fusion-map-overlays';

type OverlayType = 'marker' | 'polyline' | 'polygon' | 'circle' | 'rectangle';
type PanelSection = 'marker' | 'polyline' | 'polygon' | 'circle' | 'rectangle' | 'manager' | 'events' | 'geojson';

interface OverlayItem {
  id: string;
  type: OverlayType;
  name: string;
  visible: boolean;
  data: any;
}

const defaultCenter: [number, number] = [116.3974, 39.9093];

export default function OverlaysDemo() {
  const mapRef = useRef<(FusionMap & { getOverlays: () => any }) | null>(null);
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [activeSection, setActiveSection] = useState<PanelSection>('marker');
  const [session, setSession] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  // 新标记状态
  const [newMarkerPos, setNewMarkerPos] = useState({ lng: 118.7969, lat: 32.0603 });
  const [newMarkerTitle, setNewMarkerTitle] = useState('新标记');
  const [newMarkerIcon, setNewMarkerIcon] = useState('https://example.com/marker.png');

  // 新折线状态
  const [newPolylinePath, setNewPolylinePath] = useState<[number, number][]>([
    [118.7706, 32.0619],
    [118.7837, 32.0664],
    [118.7985, 32.0718],
  ]);
  const [newPolylineColor, setNewPolylineColor] = useState('#3388ff');
  const [newPolylineWidth, setNewPolylineWidth] = useState(3);

  // 新多边形状态
  const [newPolygonPath, setNewPolygonPath] = useState<[number, number][]>([
    [118.7902, 32.0509],
    [118.8033, 32.0509],
    [118.8064, 32.0608],
    [118.7962, 32.0660],
  ]);
  const [newPolygonFillColor, setNewPolygonFillColor] = useState('#4f46e5');
  const [newPolygonFillOpacity, setNewPolygonFillOpacity] = useState(0.35);
  const [newPolygonStrokeColor, setNewPolygonStrokeColor] = useState('#1f2937');
  const [newPolygonStrokeWidth, setNewPolygonStrokeWidth] = useState(2);

  // UI 控制状态
  const [searchQuery, setSearchQuery] = useState('');
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [qualityMode, setQualityMode] = useState('balanced');
  const [smoothEdges, setSmoothEdges] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.85);
  const [debugCommand, setDebugCommand] = useState('list');
  const [debugOutput, setDebugOutput] = useState<string[]>([]);

  // 覆盖物管理状态
  const [showAll, setShowAll] = useState(true);
  const [exportData, setExportData] = useState('');

  useEffect(() => {
    const container = document.getElementById(MAP_CONTAINER_ID);
    if (container) container.innerHTML = '';

    const instance = createFusionMap(MAP_CONTAINER_ID, {
      mapOptions: {
        center: defaultCenter,
        zoom: 12,
        pitch: 0,
        bearing: 0
      }
    });

    mapRef.current = instance as FusionMap & { getOverlays: () => any };

    return () => {
      try {
        if (typeof (instance as any).destroy === 'function') {
          (instance as any).destroy();
        }
      } catch (e) {
        console.warn('Error while destroying map instance', e);
      }

      const host = document.getElementById(MAP_CONTAINER_ID);
      if (host) host.innerHTML = '';
      mapRef.current = null;
    };
  }, [session]);

  // 更新覆盖物列表
  const updateOverlayList = () => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const manager = map.getOverlays().getManager();
    const allOverlays = manager.getAll();

    const overlayList: OverlayItem[] = allOverlays.map((overlay: any) => ({
      id: overlay.getId(),
      type: overlay.getType() as OverlayType,
      name: overlay.getProperty('name') || overlay.getId(),
      visible: overlay.isVisible(),
      data: overlay.toJSON(),
    }));

    setOverlays(overlayList);
  };

  // 创建标记
  const handleCreateMarker = () => {
    if (!mapRef.current) return;

    try {
      const marker = mapRef.current.getOverlays().createMarker({
        position: [newMarkerPos.lng, newMarkerPos.lat],
        title: newMarkerTitle,
        icon: newMarkerIcon || undefined,
        properties: {
          name: newMarkerTitle,
        },
      });

      // 监听点击事件
      marker.on('click', () => {
        setSnackbar({ open: true, message: `标记 "${newMarkerTitle}" 被点击` });
      });

      updateOverlayList();
      setSnackbar({ open: true, message: `标记 "${newMarkerTitle}" 已创建` });
    } catch (error) {
      setSnackbar({ open: true, message: `创建标记失败: ${error}` });
    }
  };

  // 创建折线
  const handleCreatePolyline = () => {
    if (!mapRef.current) return;

    try {
      const polyline = mapRef.current.getOverlays().createPolyline({
        path: newPolylinePath,
        color: newPolylineColor,
        width: newPolylineWidth,
        properties: {
          name: `折线-${Date.now()}`,
        },
      });

      // 监听点击事件
      polyline.on('click', () => {
        setSnackbar({ open: true, message: `折线被点击` });
      });

      updateOverlayList();
      setSnackbar({ open: true, message: `折线已创建` });
    } catch (error) {
      setSnackbar({ open: true, message: `创建折线失败: ${error}` });
    }
  };

  // 创建多边形
  const handleCreatePolygon = () => {
    if (!mapRef.current) return;

    try {
      const polygon = mapRef.current.getOverlays().createPolygon({
        path: newPolygonPath,
        fillColor: newPolygonFillColor,
        fillOpacity: newPolygonFillOpacity,
        strokeColor: newPolygonStrokeColor,
        strokeWidth: newPolygonStrokeWidth,
        properties: {
          name: `多边形-${Date.now()}`,
        },
      });

      polygon.on('click', () => {
        setSnackbar({ open: true, message: '多边形被点击' });
      });

      updateOverlayList();
      setSnackbar({ open: true, message: '多边形已创建' });
    } catch (error) {
      setSnackbar({ open: true, message: `创建多边形失败: ${error}` });
    }
  };

  // 删除覆盖物
  const handleDeleteOverlay = (id: string) => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const manager = map.getOverlays().getManager();
    const overlay = manager.getById(id);

    if (overlay) {
      manager.remove(overlay);
      updateOverlayList();
      setSnackbar({ open: true, message: `覆盖物已删除` });
    }
  };

  const handleRunDebug = () => {
    if (!mapRef.current) return;

    const manager = mapRef.current.getOverlays().getManager();
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

  // 切换覆盖物可见性
  const handleToggleVisibility = (id: string) => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const manager = map.getOverlays().getManager();
    const overlay = manager.getById(id);

    if (overlay) {
      overlay.setVisible(!overlay.isVisible());
      updateOverlayList();
    }
  };

  // 清空所有覆盖物
  const handleClearAll = () => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    map.getOverlays().clearOverlays();
    updateOverlayList();
    setSnackbar({ open: true, message: `所有覆盖物已清空` });
  };

  // 显示所有覆盖物
  const handleShowAll = () => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    map.getOverlays().showAllOverlays();
    updateOverlayList();
    setShowAll(true);
  };

  // 隐藏所有覆盖物
  const handleHideAll = () => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    map.getOverlays().hideAllOverlays();
    updateOverlayList();
    setShowAll(false);
  };

  // 导出为GeoJSON
  const handleExportGeoJSON = () => {
    if (!mapRef.current) return;

    const map = mapRef.current;
    const geojson = map.getOverlays().exportToGeoJSON();
    const jsonStr = JSON.stringify(geojson, null, 2);
    setExportData(jsonStr);

    // 下载文件
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'overlays.geojson';
    a.click();
    URL.revokeObjectURL(url);

    setSnackbar({ open: true, message: `GeoJSON已导出` });
  };

  // 获取覆盖物统计
  const getOverlayStats = () => {
    if (!mapRef.current) return { total: 0, marker: 0, polyline: 0, polygon: 0 };

    const map = mapRef.current;
    const manager = map.getOverlays().getManager();
    const stats = (manager as any).getTypeStats?.() || {};

    return {
      total: manager.getCount(),
      marker: stats.marker || 0,
      polyline: stats.polyline || 0,
      polygon: stats.polygon || 0,
    };
  };

  // 获取可见覆盖物数量
  const getVisibleCount = () => {
    if (!mapRef.current) return 0;

    const map = mapRef.current;
    const manager = map.getOverlays().getManager();
    return (manager as any).getVisibleCount?.() ?? manager.getAll().filter((item: any) => item.isVisible()).length;
  };

  const panelMeta: Record<PanelSection, { title: string; subtitle: string }> = {
    marker: { title: '标记 (Marker)', subtitle: '创建与调试标记覆盖物' },
    polyline: { title: '折线 (Polyline)', subtitle: '创建与调试折线覆盖物' },
    polygon: { title: '多边形 (Polygon)', subtitle: '创建与调试多边形覆盖物' },
    circle: { title: '圆形 (Circle)', subtitle: '功能规划中' },
    rectangle: { title: '矩形 (Rectangle)', subtitle: '功能规划中' },
    manager: { title: '覆盖物管理器', subtitle: '显示、隐藏、清空与列表管理' },
    events: { title: '事件监听', subtitle: '调试事件与运行命令' },
    geojson: { title: 'GeoJSON 导入导出', subtitle: '导出覆盖物数据' },
  };

  const activeMeta = panelMeta[activeSection];

  return (
    <Box className="app-shell">
      <Paper elevation={1} className="panel nav-panel">
        <Stack direction="row" alignItems="center" gap={1} className="panel-header">
          <PlaceIcon fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700}>覆盖物 API</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          基于MapLibre的通用覆盖物API，支持标记、折线、多边形
        </Typography>
        <Divider sx={{ mb: 1 }} />
        <List dense sx={{ overflowY: 'auto', flex: 1 }}>
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>覆盖物类型</Typography>
            <ListItemButton
              className="nav-item"
              dense
              selected={activeSection === 'marker'}
              onClick={() => setActiveSection('marker')}
            >
              <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary="标记 (Marker)" />
            </ListItemButton>
            <ListItemButton
              className="nav-item"
              dense
              selected={activeSection === 'polyline'}
              onClick={() => setActiveSection('polyline')}
            >
              <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary="折线 (Polyline)" />
            </ListItemButton>
            <ListItemButton
              className="nav-item"
              dense
              selected={activeSection === 'polygon'}
              onClick={() => setActiveSection('polygon')}
            >
              <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary="多边形 (Polygon)" />
            </ListItemButton>
            <ListItemButton
              className="nav-item"
              dense
              selected={activeSection === 'circle'}
              onClick={() => setActiveSection('circle')}
            >
              <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary="圆形 (Circle)" />
            </ListItemButton>
            <ListItemButton
              className="nav-item"
              dense
              selected={activeSection === 'rectangle'}
              onClick={() => setActiveSection('rectangle')}
            >
              <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary="矩形 (Rectangle)" />
            </ListItemButton>
          </Box>
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>管理功能</Typography>
            <ListItemButton
              className="nav-item"
              dense
              selected={activeSection === 'manager'}
              onClick={() => setActiveSection('manager')}
            >
              <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary="覆盖物管理器" />
            </ListItemButton>
            <ListItemButton
              className="nav-item"
              dense
              selected={activeSection === 'events'}
              onClick={() => setActiveSection('events')}
            >
              <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary="事件监听" />
            </ListItemButton>
            <ListItemButton
              className="nav-item"
              dense
              selected={activeSection === 'geojson'}
              onClick={() => setActiveSection('geojson')}
            >
              <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary="GeoJSON导入导出" />
            </ListItemButton>
          </Box>
        </List>
      </Paper>

        <Box className="map-stage">
          <Box id={MAP_CONTAINER_ID} className="map-canvas" />
          <Box className="map-search">
            <TextField
              size="small"
              placeholder="Search location or overlay"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
            <Button variant="contained" size="small" className="search-button">
              Search
            </Button>
          </Box>
          <Box className="map-floating">
            <Stack direction="row" spacing={1} alignItems="center" className="badge-row">
              <Chip label={`覆盖物: ${getOverlayStats().total}`} size="small" color="primary" variant="outlined" />
              <Chip label={`标记: ${getOverlayStats().marker}`} size="small" variant="outlined" />
              <Chip label={`折线: ${getOverlayStats().polyline}`} size="small" variant="outlined" />
              <Chip label={`多边形: ${getOverlayStats().polygon}`} size="small" variant="outlined" />
              <Chip label={`可见: ${getVisibleCount()}`} size="small" variant="outlined" />
            </Stack>
          </Box>
        </Box>

        <Paper elevation={2} className="panel inspector-panel">
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Stack>
              <Typography variant="subtitle1" fontWeight={700}>{activeMeta.title}</Typography>
              <Typography variant="caption" color="text.secondary">{activeMeta.subtitle}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" label="API Online" className="status-chip" />
              <Tooltip title="重建环境">
                <IconButton onClick={() => setSession(v => v + 1)} size="small" color="primary">
                  <RestartAltIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Stack spacing={2}>
            {activeSection === 'manager' && (
              <>
                <Box className="control-card">
                  <Typography variant="caption" color="text.secondary">渲染与分析</Typography>
                  <Stack spacing={1} mt={1}>
                    <ToggleButtonGroup
                      size="small"
                      value={heatmapEnabled ? 'heatmap' : 'markers'}
                      exclusive
                      onChange={(_, value) => {
                        if (value) setHeatmapEnabled(value === 'heatmap');
                      }}
                    >
                      <ToggleButton value="markers">Markers</ToggleButton>
                      <ToggleButton value="heatmap">Heatmap</ToggleButton>
                    </ToggleButtonGroup>
                    <FormControl fullWidth size="small">
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
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary">Overlay Opacity</Typography>
                      <Slider
                        size="small"
                        value={overlayOpacity}
                        min={0.2}
                        max={1}
                        step={0.05}
                        onChange={(_, value) => setOverlayOpacity(value as number)}
                      />
                    </Stack>
                    <FormControlLabel
                      control={<Checkbox checked={smoothEdges} onChange={e => setSmoothEdges(e.target.checked)} />}
                      label="Smooth edges"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={snapToGrid} onChange={e => setSnapToGrid(e.target.checked)} />}
                      label="Snap to grid"
                    />
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<FlashOnIcon />}
                      className="primary-action"
                    >
                      Run Analysis
                    </Button>
                  </Stack>
                </Box>

                <Divider flexItem />

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
                  <Stack spacing={1} mt={1} sx={{ maxHeight: 200, overflowY: 'auto' }}>
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
              </>
            )}

            {activeSection === 'marker' && (
              <Box>
                <Typography variant="caption" color="text.secondary">创建标记</Typography>
                <Stack spacing={1} mt={1}>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      label="经度"
                      type="number"
                      value={newMarkerPos.lng}
                      onChange={e => setNewMarkerPos({ ...newMarkerPos, lng: Number(e.target.value) })}
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label="纬度"
                      type="number"
                      value={newMarkerPos.lat}
                      onChange={e => setNewMarkerPos({ ...newMarkerPos, lat: Number(e.target.value) })}
                      fullWidth
                    />
                  </Stack>
                  <TextField
                    size="small"
                    label="标题"
                    value={newMarkerTitle}
                    onChange={e => setNewMarkerTitle(e.target.value)}
                  />
                  <TextField
                    size="small"
                    label="图标URL (可选)"
                    value={newMarkerIcon}
                    onChange={e => setNewMarkerIcon(e.target.value)}
                  />
                  <Button variant="contained" startIcon={<PlaceIcon />} onClick={handleCreateMarker}>
                    创建标记
                  </Button>
                </Stack>
              </Box>
            )}

            {activeSection === 'polyline' && (
              <Box>
                <Typography variant="caption" color="text.secondary">创建折线</Typography>
                <Stack spacing={1} mt={1}>
                  <TextField
                    size="small"
                    label="路径 (JSON数组)"
                    value={JSON.stringify(newPolylinePath)}
                    onChange={e => {
                      try {
                        const path = JSON.parse(e.target.value) as [number, number][];
                        setNewPolylinePath(path);
                      } catch (e) {
                        // 忽略解析错误
                      }
                    }}
                    multiline
                    rows={2}
                  />
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      label="颜色"
                      type="color"
                      value={newPolylineColor}
                      onChange={e => setNewPolylineColor(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label="宽度"
                      type="number"
                      value={newPolylineWidth}
                      onChange={e => setNewPolylineWidth(Number(e.target.value))}
                      fullWidth
                    />
                  </Stack>
                  <Button variant="contained" startIcon={<PolylineIcon />} onClick={handleCreatePolyline}>
                    创建折线
                  </Button>
                </Stack>
              </Box>
            )}

            {activeSection === 'polygon' && (
              <Box>
                <Typography variant="caption" color="text.secondary">创建多边形</Typography>
                <Stack spacing={1} mt={1}>
                  <TextField
                    size="small"
                    label="路径 (JSON数组)"
                    value={JSON.stringify(newPolygonPath)}
                    onChange={e => {
                      try {
                        const path = JSON.parse(e.target.value) as [number, number][];
                        setNewPolygonPath(path);
                      } catch (e) {
                        // 忽略解析错误
                      }
                    }}
                    multiline
                    rows={2}
                  />
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      label="填充色"
                      type="color"
                      value={newPolygonFillColor}
                      onChange={e => setNewPolygonFillColor(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label="填充透明度"
                      type="number"
                      inputProps={{ min: 0, max: 1, step: 0.05 }}
                      value={newPolygonFillOpacity}
                      onChange={e => setNewPolygonFillOpacity(Number(e.target.value))}
                      fullWidth
                    />
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      label="描边色"
                      type="color"
                      value={newPolygonStrokeColor}
                      onChange={e => setNewPolygonStrokeColor(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      size="small"
                      label="描边宽度"
                      type="number"
                      value={newPolygonStrokeWidth}
                      onChange={e => setNewPolygonStrokeWidth(Number(e.target.value))}
                      fullWidth
                    />
                  </Stack>
                  <Button variant="contained" startIcon={<PolygonIcon />} onClick={handleCreatePolygon}>
                    创建多边形
                  </Button>
                </Stack>
              </Box>
            )}

            {(activeSection === 'circle' || activeSection === 'rectangle') && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  该覆盖物类型尚未实现，请先选择已实现的类型进行调试。
                </Typography>
              </Box>
            )}

            {activeSection === 'events' && (
              <Box>
                <Typography variant="caption" color="text.secondary">API 调试</Typography>
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
                    rows={4}
                    InputProps={{
                      className: 'debug-output'
                    }}
                  />
                </Stack>
              </Box>
            )}

            {activeSection === 'geojson' && (
              <Box>
                <Typography variant="caption" color="text.secondary">GeoJSON 导出</Typography>
                <Stack spacing={1} mt={1}>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<DownloadIcon />}
                    onClick={handleExportGeoJSON}
                    fullWidth
                  >
                    导出GeoJSON
                  </Button>
                  <TextField
                    size="small"
                    label="GeoJSON"
                    value={exportData}
                    onChange={e => setExportData(e.target.value)}
                    multiline
                    rows={6}
                    fullWidth
                  />
                </Stack>
              </Box>
            )}
          </Stack>
        </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity="info" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

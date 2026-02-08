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
  FormControl
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import PlaceIcon from '@mui/icons-material/Place';
import PolylineIcon from '@mui/icons-material/Timeline';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import { createFusionMap, FusionMap } from 'fusion-map';

const MAP_CONTAINER_ID = 'fusion-map-overlays';

type OverlayType = 'marker' | 'polyline' | 'polygon' | 'circle' | 'rectangle';

interface OverlayItem {
  id: string;
  type: OverlayType;
  name: string;
  visible: boolean;
  data: any;
}

const defaultCenter: [number, number] = [116.3974, 39.9093];

export default function OverlaysDemo() {
  const mapRef = useRef<FusionMap | null>(null);
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [selectedOverlay, setSelectedOverlay] = useState<string>('');
  const [session, setSession] = useState(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  // 新标记状态
  const [newMarkerPos, setNewMarkerPos] = useState({ lng: 116.3974, lat: 39.9093 });
  const [newMarkerTitle, setNewMarkerTitle] = useState('新标记');
  const [newMarkerIcon, setNewMarkerIcon] = useState('https://example.com/marker.png');

  // 新折线状态
  const [newPolylinePath, setNewPolylinePath] = useState([
    [116.3974, 39.9093],
    [116.4074, 39.9193],
    [116.4174, 39.9293],
  ]);
  const [newPolylineColor, setNewPolylineColor] = useState('#3388ff');
  const [newPolylineWidth, setNewPolylineWidth] = useState(3);

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

    mapRef.current = instance;

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

    const overlayList: OverlayItem[] = allOverlays.map(overlay => ({
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
    if (!mapRef.current) return { total: 0, marker: 0, polyline: 0 };

    const map = mapRef.current;
    const manager = map.getOverlays().getManager();
    const stats = manager.getTypeStats!();

    return {
      total: manager.getCount(),
      marker: stats.marker || 0,
      polyline: stats.polyline || 0,
    };
  };

  // 获取可见覆盖物数量
  const getVisibleCount = () => {
    if (!mapRef.current) return 0;

    const map = mapRef.current;
    const manager = map.getOverlays().getManager();
    return manager.getVisibleCount!();
  };

  return (
    <Box className="app-shell">
      <Paper elevation={1} className="panel nav-panel">
        <Stack direction="row" alignItems="center" gap={1} className="panel-header">
          <PlaceIcon fontSize="small" />
          <Typography variant="subtitle1" fontWeight={700}>覆盖物 API</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          基于MapLibre的通用覆盖物API，支持标记、折线等
        </Typography>
        <Divider sx={{ mb: 1 }} />
        <List dense sx={{ overflowY: 'auto', flex: 1 }}>
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>覆盖物类型</Typography>
            <ListItemButton className="nav-item" dense>
              <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary="标记 (Marker)" />
            </ListItemButton>
            <ListItemButton className="nav-item" dense>
              <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary="折线 (Polyline)" />
            </ListItemButton>
            <ListItemButton className="nav-item" dense>
              <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary="多边形 (Polygon)" />
            </ListItemButton>
            <ListItemButton className="nav-item" dense>
              <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary="圆形 (Circle)" />
            </ListItemButton>
            <ListItemButton className="nav-item" dense>
              <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary="矩形 (Rectangle)" />
            </ListItemButton>
          </Box>
          <Box sx={{ mb: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ pl: 1 }}>管理功能</Typography>
            <ListItemButton className="nav-item" dense>
              <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary="覆盖物管理器" />
            </ListItemButton>
            <ListItemButton className="nav-item" dense>
              <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary="事件监听" />
            </ListItemButton>
            <ListItemButton className="nav-item" dense>
              <ListItemText primaryTypographyProps={{ fontSize: 14 }} primary="GeoJSON导入导出" />
            </ListItemButton>
          </Box>
        </List>
      </Paper>

      <Box className="map-stage">
        <Box id={MAP_CONTAINER_ID} className="map-canvas" />
        <Box className="map-floating">
          <Stack direction="row" spacing={1} alignItems="center" className="badge-row">
            <Chip label={`覆盖物: ${getOverlayStats().total}`} size="small" color="primary" variant="outlined" />
            <Chip label={`标记: ${getOverlayStats().marker}`} size="small" variant="outlined" />
            <Chip label={`折线: ${getOverlayStats().polyline}`} size="small" variant="outlined" />
            <Chip label={`可见: ${getVisibleCount()}`} size="small" variant="outlined" />
          </Stack>
        </Box>
      </Box>

      <Paper elevation={2} className="panel inspector-panel">
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Stack>
            <Typography variant="subtitle1" fontWeight={700}>覆盖物操作</Typography>
            <Typography variant="caption" color="text.secondary">创建、管理、导出覆盖物</Typography>
          </Stack>
          <Tooltip title="重建环境">
            <IconButton onClick={() => setSession(v => v + 1)} size="small" color="primary">
              <RestartAltIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Stack spacing={2}>
          {/* 创建标记 */}
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

          <Divider flexItem />

          {/* 创建折线 */}
          <Box>
            <Typography variant="caption" color="text.secondary">创建折线</Typography>
            <Stack spacing={1} mt={1}>
              <TextField
                size="small"
                label="路径 (JSON数组)"
                value={JSON.stringify(newPolylinePath)}
                onChange={e => {
                  try {
                    const path = JSON.parse(e.target.value);
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

          <Divider flexItem />

          {/* 覆盖物管理 */}
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

          {/* 覆盖物列表 */}
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

          <Divider flexItem />

          {/* GeoJSON输出 */}
          <Box>
            <Typography variant="caption" color="text.secondary">GeoJSON 输出</Typography>
            <TextField
              size="small"
              label="GeoJSON"
              value={exportData}
              onChange={e => setExportData(e.target.value)}
              multiline
              rows={4}
              fullWidth
              sx={{ mt: 1 }}
            />
          </Box>
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
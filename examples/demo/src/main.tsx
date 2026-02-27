import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import 'maplibre-gl/dist/maplibre-gl.css';
import App from './App';
import './style.css';

const theme = createTheme({
  shape: {
    borderRadius: 10
  },
  palette: {
    mode: 'light'
  }
});

const root = ReactDOM.createRoot(document.getElementById('app') as HTMLElement);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

import { CssBaseline, colors } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppStateProvider } from './data/AppState';
import './index.css';
import './AspectRatio.css';
import reportWebVitals from './reportWebVitals';

const theme = createTheme({
  palette: {
    secondary: {
      main: colors.grey[900],
    },
    warning: {
      main: colors.yellow[700],
    },
    error: {
      main: colors.red[800],
    },
  },
  typography: {
    fontSize: 17,
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') ?? document.body,
);

root.render(
  <React.StrictMode>
    <CssBaseline />
    <ThemeProvider theme={theme}>
      <AppStateProvider>
        <App />
      </AppStateProvider>
    </ThemeProvider>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

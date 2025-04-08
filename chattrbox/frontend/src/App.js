import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AppBar, Toolbar, Typography, Container } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import VideoChat from './components/VideoChat';

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              ChattrBox
            </Typography>
          </Toolbar>
        </AppBar>
        <Container>
          <Routes>
            <Route path="/" element={<VideoChat />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App; 
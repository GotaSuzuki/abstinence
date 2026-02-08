import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f7f3ec'
    },
    text: {
      primary: '#0b1d16',
      secondary: '#2d4c42'
    },
    primary: {
      main: '#2f6b4f'
    },
    secondary: {
      main: '#ea9a3f'
    },
    divider: 'rgba(255, 255, 255, 0.6)'
  },
  typography: {
    fontFamily: 'var(--font-noto-sans-jp), sans-serif',
    h1: {
      fontFamily: 'var(--font-space-grotesk), var(--font-noto-sans-jp), sans-serif',
      fontWeight: 700
    },
    h2: {
      fontFamily: 'var(--font-space-grotesk), var(--font-noto-sans-jp), sans-serif',
      fontWeight: 700
    }
  },
  shape: {
    borderRadius: 20
  }
});

export default theme;

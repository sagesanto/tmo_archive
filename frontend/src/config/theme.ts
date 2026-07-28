import { createTheme, ThemeOptions, lighten, alpha, decomposeColor } from '@mui/material/styles';

// euclid colors
// blue: #002e45
// red: #980033

// const primaryMain = '#002e45';
// const secondaryMain = '#980033';


const primaryMain = '#980033';
const secondaryMain = '#002e45';;

declare module '@mui/material/styles' {
  interface Palette {
    selected: Palette['primary'];
  }

  interface PaletteOptions {
    selected?: PaletteOptions['primary'];
  }
}


// selected color is just a copy of theme.palette.action.selected  
//    -> needed for functions that only take color strings for named colors

const selected_opacity = 0.1

export const theme_options: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: primaryMain,
    },
    secondary: {
      main: secondaryMain,
    },
    selected: {
      main: alpha(primaryMain, selected_opacity)
    },
    action:{
      selected: alpha(primaryMain, selected_opacity),
      selectedOpacity: selected_opacity
    }
  },
  typography:{
    body1: {
      weight: 400
    }
  }
};

export const theme = createTheme(theme_options);

export default theme;
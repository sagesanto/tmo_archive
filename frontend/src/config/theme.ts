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

export const font_stack = '"Roboto Condensed", "Roboto", "Helvetica", "Arial", sans-serif';
const body_weight = 700;

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
    fontFamily: font_stack,
    fontWeightRegular: body_weight,
    body1: {
      weight: 400
    }
  },
  components: {
    // chip sets fontFamily and fontSize from the theme but not fontWeight, so its label
    // would inherit 400 from :root instead of following body_weight
    MuiChip: {
      styleOverrides: { root: { fontWeight: body_weight } }
    }
  }
};

export const theme = createTheme(theme_options);

export default theme;
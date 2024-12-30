import { createTheme, CssVarsThemeOptions } from '@mui/material/styles';
import { TypographyOptions } from '@mui/material/styles/createTypography';

const components: CssVarsThemeOptions['components'] = {
  // Organize components in alphabetical order. This makes it easier to find components.
  MuiAutocomplete: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
      size: 'small',
      variant: 'contained',
    },
  },
  MuiChip: {
    defaultProps: {
      size: 'small',
      variant: 'outlined',
    },
  },
  MuiIcon: {
    defaultProps: {
      fontSize: 'small',
    },
  },
  MuiIconButton: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiTypography: {
    defaultProps: {
      variantMapping: {
      },
    },
  },
};

const typography: TypographyOptions = {
  fontFamily: ['Inconsolata', 'sans serif'].join(','),
  fontSize: 16,
};

/**
 * darkCompactTheme and lightCompactTheme not actually used in app code, only in Storybook.
 * TODO: Investigate MUI dark mode config.
 */
export const darkCompactTheme = createTheme({
  typography,
  components,
  cssVariables: true,
});

export const lightCompactTheme = createTheme({
  typography,
  components,
  cssVariables: true,
});

/**
 * Use this config for ThemeProvider to avoid flickering when switching themes.
 */
export const customTheme = createTheme({
  colorSchemes: {
    light: {
      palette: {
        mode: 'light',
      },
    },
    dark: {
      palette: {
        mode: 'dark',
      },
    },
  },
  typography,
  components,
  cssVariables: true,
});

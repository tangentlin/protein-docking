import { ThemeProvider } from '@mui/material/styles';

import { customTheme } from '../src/themes/mui-theme';

export const withThemeProvider = Story => {
  return (
    <ThemeProvider theme={customTheme}>
      <ProvideTheme>
        <Story />
      </ProvideTheme>
    </ThemeProvider>
  );
};

// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  /* Ejecución en paralelo */
  fullyParallel: true,
  /* Reintentos en CI */
  retries: process.env.CI ? 2 : 0,
  /* Reporter HTML de Playwright */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list']
  ],
  use: {
    /* Canal chrome por defecto o el que requieras */
    channel: 'chrome',
    /* Modos sin interfaz gráfica para CI */
    headless: true,
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    viewport: { width: 1366, height: 768 },

    /* Capturas automáticas SOLO cuando falle una prueba (Configuración a nivel Framework) */
    screenshot: 'only-on-failure',

    /* Guardar traza solo en caso de fallo */
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
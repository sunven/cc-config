/**
 * Lighthouse CI Configuration
 *
 * Performance budgets and thresholds for CI/CD integration
 */
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:1420/'],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 1,
        },
        // Tauri app specific settings
        chromeFlags: [
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
        ],
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance thresholds
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'interactive': ['error', { maxNumericValue: 3500 }],

        // Accessibility (WCAG 2.1 AA)
        'color-contrast': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'meta-viewport': 'error',
        'bypass': 'warn',
        'link-name': 'error',
        'button-name': 'error',
        'image-alt': 'error',

        // Best practices
        'errors-in-console': 'warn',
        'no-vulnerable-libraries': 'error',
        'js-libraries': 'off', // Tauri apps bundle everything

        // SEO (less relevant for desktop app)
        'meta-description': 'off',
        'crawlable-anchors': 'off',

        // PWA (not applicable)
        'installable-manifest': 'off',
        'service-worker': 'off',
        'splash-screen': 'off',
        'themed-omnibox': 'off',
        'maskable-icon': 'off',
        'viewport': 'warn',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}

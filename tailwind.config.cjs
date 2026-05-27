/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./apps/web/src/**/*.{html,ts}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Material Design 3 Color Tokens - Stitch Design System
        "surface-container-low": "#0b1c30",
        "error": "#ffb4ab",
        "on-secondary-fixed-variant": "#004e5d",
        "on-tertiary-container": "#c41640",
        "surface-container-high": "#1b2b3f",
        "surface-bright": "#2a3a4f",
        "secondary": "#74d4ed",
        "on-tertiary-fixed": "#40000d",
        "surface": "#031427",
        "surface-dim": "#031427",
        "tertiary-fixed-dim": "#ffb2b7",
        "primary": "#00e0b7",
        "primary-light": "#00ffd1",
        "tertiary-container": "#ffd9da",
        "on-secondary-fixed": "#001f26",
        "on-secondary": "#003640",
        "surface-container": "#102034",
        "secondary-fixed-dim": "#74d4ed",
        "on-background": "#d3e4fe",
        "inverse-on-surface": "#213145",
        "background": "#031427",
        "tertiary": "#fffeff",
        "surface-tint": "#00e0b7",
        "secondary-container": "#359db4",
        "primary-fixed": "#15ffd1",
        "on-surface-variant": "#b9cbc3",
        "outline-variant": "#3a4a44",
        "on-primary-container": "#00725c",
        "secondary-fixed": "#adecff",
        "on-primary-fixed-variant": "#005141",
        "primary-fixed-dim": "#00e0b7",
        "surface-variant": "#26364a",
        "outline": "#83958d",
        "on-tertiary-fixed-variant": "#92002a",
        "on-error-container": "#ffdad6",
        "surface-container-lowest": "#000f21",
        "primary-container": "#00ffd1",
        "error-container": "#93000a",
        "tertiary-fixed": "#ffdadb",
        "on-primary": "#00382c",
        "on-error": "#690005",
        "on-surface": "#d3e4fe",
        "surface-container-highest": "#26364a",
        "on-secondary-container": "#002e38",
        "on-primary-fixed": "#002019",
        "on-tertiary": "#67001b",
        "inverse-surface": "#d3e4fe",
        "inverse-primary": "#006b57"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      spacing: {
        "margin-page": "2rem",
        "sidebar-width": "280px",
        "stack-md": "1rem",
        "container-max": "1440px",
        "gutter": "1.5rem",
        "stack-sm": "0.5rem",
        "stack-lg": "2rem"
      },
      fontFamily: {
        "sans": ["Inter", "ui-sans-serif", "system-ui"],
        "code": ["JetBrains Mono", "monospace"]
      },
      fontSize: {
        "label-sm": ["12px", { "lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600" }],
        "label-md": ["14px", { "lineHeight": "20px", "fontWeight": "500" }],
        "body-md": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
        "display-lg-mobile": ["30px", { "lineHeight": "38px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "display-lg": ["36px", { "lineHeight": "44px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
        "body-lg": ["18px", { "lineHeight": "28px", "fontWeight": "400" }],
        "headline-md": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
        "headline-sm": ["20px", { "lineHeight": "28px", "fontWeight": "600" }],
        "code": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
        "body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "400" }]
      },
      boxShadow: {
        'level-1': '0 1px 2px 0 rgb(0 0 0 / 0.3), 0 1px 3px 1px rgb(0 0 0 / 0.15)',
        'level-2': '0 1px 2px 0 rgb(0 0 0 / 0.3), 0 2px 6px 2px rgb(0 0 0 / 0.15)',
        'primary-glow': '0 0 15px rgba(0, 255, 209, 0.3)',
        'primary-glow-lg': '0 4px 20px rgba(0, 224, 183, 0.4)'
      },
      maxWidth: {
        'container': '1440px'
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

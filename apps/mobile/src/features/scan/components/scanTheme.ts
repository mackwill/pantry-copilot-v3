/**
 * Board §08 uses a dark, camera-context palette distinct from the light app
 * tokens (a brighter scan-green reticle over near-black). These are the
 * board-specific values for that dark scene only.
 */
export const scanTheme = {
  bg: '#0A0A08',
  reticle: '#A4C46B',
  textOnDark: '#FFFFFF',
  glass: 'rgba(255,255,255,0.12)',
  glassStrong: 'rgba(255,255,255,0.15)',
  scrim: 'rgba(10,10,8,0.4)',
  sceneItems: [
    { top: '18%', left: '12%', width: 80, height: 110, color: '#E9EFDC' },
    { top: '22%', left: '52%', width: 60, height: 80, color: '#D8E6B8' },
    { top: '48%', left: '20%', width: 70, height: 90, color: '#A67614' },
    { top: '52%', left: '58%', width: 85, height: 70, color: '#7A2C6D' },
  ],
} as const;

/** Tiny committed sample JPEG (base64) for the no-camera dev/CI intake path. */
export const SAMPLE_IMAGE_BASE64 =
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AfwD/2Q==';

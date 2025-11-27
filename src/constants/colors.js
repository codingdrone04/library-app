const DARK_THEME = {
  // Primary colors - Brighter and more modern
  primary: '#6366F1',        // Vibrant indigo
  primaryDark: '#4F46E5',    // Dark indigo
  primaryLight: '#818CF8',   // Light indigo
  accent: '#F59E0B',         // Amber/Warm gold
  accentLight: '#FCD34D',    // Soft yellow

  // Background colors - Softer, less gray
  background: '#0F172A',     // Deep night blue (slate-900)
  surface: '#1E293B',        // Slate blue (slate-800)
  surfaceLight: '#334155',   // Medium slate (slate-700)
  card: '#1E293B',          // For cards

  // Text colors - Better contrast
  textPrimary: '#F1F5F9',    // Almost white with blue tint
  textSecondary: '#CBD5E1',  // Light blue-gray
  textMuted: '#94A3B8',      // Medium blue-gray
  textPlaceholder: '#64748B', // Slate gray

  // Status colors - More vibrant
  success: '#10B981',        // Bright emerald
  warning: '#F59E0B',        // Amber
  error: '#EF4444',          // Bright red but not aggressive
  info: '#3B82F6',           // Bright blue

  // Semantic colors
  available: '#10B981',      // Emerald green
  borrowed: '#F59E0B',       // Amber
  overdue: '#EF4444',        // Red

  // Navigation - More modern
  navBackground: '#1E293B',  // Same as surface
  navBorder: '#334155',      // surfaceLight
  navActive: '#6366F1',      // Primary instead of accent
  navInactive: '#64748B',    // Lighter than before

  // Additional accents for more vibrancy
  purple: '#A855F7',         // Purple
  pink: '#EC4899',           // Pink
  teal: '#14B8A6',          // Turquoise
  orange: '#F97316',        // Bright orange

  // Shadow
  shadow: '#000000',

  // Transparent
  transparent: 'transparent',
  overlay: 'rgba(15, 23, 42, 0.75)', // More opaque, blue tint
  overlayLight: 'rgba(30, 41, 59, 0.5)',
};

const LIGHT_THEME = {
  // Primary colors
  primary: '#6366F1',        // Vibrant indigo
  primaryDark: '#4F46E5',    // Dark indigo
  primaryLight: '#A5B4FC',   // Very light indigo
  accent: '#F59E0B',         // Amber/Warm gold
  accentLight: '#FCD34D',    // Soft yellow

  // Background colors
  background: '#F8FAFC',     // Very light blue-gray (slate-50)
  surface: '#FFFFFF',        // Pure white
  surfaceLight: '#F1F5F9',   // Light blue-gray (slate-100)
  card: '#FFFFFF',          // For cards

  // Text colors
  textPrimary: '#0F172A',    // Deep night blue
  textSecondary: '#475569',  // Dark slate gray
  textMuted: '#64748B',      // Medium slate gray
  textPlaceholder: '#94A3B8', // Light slate gray

  // Status colors
  success: '#10B981',        // Bright emerald
  warning: '#F59E0B',        // Amber
  error: '#EF4444',          // Bright red
  info: '#3B82F6',           // Bright blue

  // Semantic colors
  available: '#10B981',      // Emerald green
  borrowed: '#F59E0B',       // Amber
  overdue: '#EF4444',        // Red

  // Navigation
  navBackground: '#FFFFFF',  // White
  navBorder: '#E2E8F0',      // Light blue-gray (slate-200)
  navActive: '#6366F1',      // Primary
  navInactive: '#94A3B8',    // Light slate gray

  // Additional accents
  purple: '#A855F7',         // Purple
  pink: '#EC4899',           // Pink
  teal: '#14B8A6',          // Turquoise
  orange: '#F97316',        // Bright orange

  // Shadow
  shadow: '#64748B',

  // Transparent
  transparent: 'transparent',
  overlay: 'rgba(15, 23, 42, 0.5)',
  overlayLight: 'rgba(248, 250, 252, 0.8)',
};

export const COLORS = DARK_THEME;

export const getThemeColors = (isDarkMode) => {
  return isDarkMode ? DARK_THEME : LIGHT_THEME;
};
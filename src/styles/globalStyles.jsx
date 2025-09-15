import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../constants';

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.borderRadius,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.containerPadding,
    height: SPACING.inputHeight,
  },
  
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    height: '100%',
  },
  
  inputIcon: {
    marginRight: SPACING.md,
  },
  
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SPACING.borderRadius,
    height: SPACING.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  primaryButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: 1,
  },
  
  secondaryButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: SPACING.borderRadius,
    height: SPACING.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  
  pageTitle: {
    fontSize: FONT_SIZES.pageTitle,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    letterSpacing: 2,
    textAlign: 'center',
  },
  
  sectionTitle: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.textPrimary,
  },
  
  subtitle: {
    fontSize: FONT_SIZES.subtitle,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  
  body: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  
  caption: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textMuted,
  },
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export const mixins = {
  card: (elevated = true, padding = 'default') => {
    const paddingOptions = {
      small: SPACING.sm,
      default: SPACING.cardPadding,
      large: SPACING.lg,
    };

    return {
      backgroundColor: COLORS.surface,
      borderRadius: SPACING.cardRadius,
      padding: paddingOptions[padding],
      marginVertical: SPACING.sm,
      ...(elevated && {
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      })
    };
  },

  input: (hasError = false) => ({
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.borderRadius,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.containerPadding,
    height: SPACING.inputHeight,
    borderWidth: hasError ? 1 : 0,
    borderColor: hasError ? COLORS.error : 'transparent',
  }),
};
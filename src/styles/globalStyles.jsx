import { StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../constants';

export const globalStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.containerPadding,
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Cards
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SPACING.cardRadius,
    padding: SPACING.cardPadding,
    marginVertical: SPACING.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Inputs
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
  
  // Buttons
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
  
  // Typography
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
  
  // Status
  successText: {
    color: COLORS.success,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.medium,
  },
  
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.medium,
  },
  
  warningText: {
    color: COLORS.warning,
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.medium,
  },
  
  // Layout helpers
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Margins and Paddings
  mt_sm: { marginTop: SPACING.sm },
  mt_md: { marginTop: SPACING.md },
  mt_lg: { marginTop: SPACING.lg },
  mt_xl: { marginTop: SPACING.xl },
  
  mb_sm: { marginBottom: SPACING.sm },
  mb_md: { marginBottom: SPACING.md },
  mb_lg: { marginBottom: SPACING.lg },
  mb_xl: { marginBottom: SPACING.xl },
  
  mx_sm: { marginHorizontal: SPACING.sm },
  mx_md: { marginHorizontal: SPACING.md },
  mx_lg: { marginHorizontal: SPACING.lg },
  
  p_sm: { padding: SPACING.sm },
  p_md: { padding: SPACING.md },
  p_lg: { padding: SPACING.lg },
  
  ph_sm: { paddingHorizontal: SPACING.sm },
  ph_md: { paddingHorizontal: SPACING.md },
  ph_lg: { paddingHorizontal: SPACING.lg },
});
import { StyleSheet } from 'react-native';
import { COLORS } from '../../../src/constants';

const chartStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.05)',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 230, 118, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text.primary,
    marginLeft: 12,
    letterSpacing: 0.38,
  },
  description: {
    fontSize: 15,
    color: COLORS.text.secondary,
    marginTop: 6,
    marginBottom: 24,
    letterSpacing: -0.24,
    lineHeight: 22,
  },
  chartWrapper: {
    backgroundColor: COLORS.chartBackground,
    borderRadius: 18,
    padding: 18,
    marginTop: 12,
  },
  chartContainer: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  primaryValue: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  secondaryValue: {
    fontSize: 18,
    fontWeight: '500',
    color: COLORS.text.primary,
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.text.secondary,
  },
  subLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: COLORS.text.tertiary,
  },
});

export default chartStyles; 
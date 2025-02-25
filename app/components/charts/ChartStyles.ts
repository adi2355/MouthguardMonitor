import { StyleSheet } from 'react-native';
import { COLORS } from '../../../src/constants';

const chartStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.08)',
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginLeft: 12,
    letterSpacing: 0.38,
  },
  description: {
    fontSize: 15,
    color: COLORS.text.secondary,
    marginTop: 4,
    marginBottom: 20,
    letterSpacing: -0.24,
    lineHeight: 20,
  },
  chartWrapper: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  chartContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});

export default chartStyles; 
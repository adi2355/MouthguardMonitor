import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

const COLORS = {
  background: '#000000',
  text: {
    secondary: '#FFFFFFCC',
  },
  primary: '#00E676',
};

export default function LoadingView() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.text}>Loading data...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.text.secondary,
  },
}); 
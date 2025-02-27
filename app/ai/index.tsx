import { useEffect } from 'react';
import { Redirect } from 'expo-router';

export default function AIIndex() {
  // Redirect to the recommendations screen by default
  return <Redirect href={'/ai/recommendations' as any} />;
} 
import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { selectAuth } from '../../../store';
import StudyScreen from '../../../components/StudyScreen';

export default function StudyRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const auth = useSelector(selectAuth);

  // Get the passage ID from the route params
  const id = params.id as string;

  // Track if component is mounted
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    // Set mounted flag after first render
    setIsMounted(true);
  }, []);

  // If not authenticated, redirect to login
  React.useEffect(() => {
    if (isMounted && !auth.isAuthenticated) {
      router.push('/login');
    }
  }, [isMounted, auth.isAuthenticated, router]);

  if (!auth.isAuthenticated) {
    return null; // We'll redirect in the useEffect
  }

  return (
    <View style={{ flex: 1 }}>
      <StudyScreen passageId={id} />
    </View>
  );
}

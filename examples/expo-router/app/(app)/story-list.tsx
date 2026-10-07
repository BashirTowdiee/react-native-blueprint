import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { selectAuth } from '../../store';
import StoryListScreen from '../../components/StoryListScreen';

export default function StoryListRoute() {
  const router = useRouter();
  const auth = useSelector(selectAuth);

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
      <StoryListScreen />
    </View>
  );
}

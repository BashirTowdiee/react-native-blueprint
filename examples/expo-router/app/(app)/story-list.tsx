import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../store';
import StoryListScreen from '../../components/StoryListScreen';
import { useAppNavigation } from '../../hooks/useAppNavigation';

export default function StoryListRoute() {
  const navigation = useAppNavigation();
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
      navigation.push('/login');
    }
  }, [isMounted, auth.isAuthenticated, navigation]);

  if (!auth.isAuthenticated) {
    return null; // We'll redirect in the useEffect
  }

  return (
    <View style={{ flex: 1 }}>
      <StoryListScreen />
    </View>
  );
}

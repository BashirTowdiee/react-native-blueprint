import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { useLocalSearchParams } from 'expo-router';
import { selectAuth } from '../../../store';
import PassageScreen from '../../../components/PassageScreen';
import { useAppNavigation } from '../../../hooks/useAppNavigation';

export default function PassageRoute() {
  const navigation = useAppNavigation();
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
      navigation.push('/login');
    }
  }, [isMounted, auth.isAuthenticated, navigation]);

  if (!auth.isAuthenticated) {
    return null; // We'll redirect in the useEffect
  }

  return (
    <View style={{ flex: 1 }}>
      <PassageScreen passageId={id} />
    </View>
  );
}

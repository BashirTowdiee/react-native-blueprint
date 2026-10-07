import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { selectAuth } from '../../store';
import LoginScreen from '../../components/LoginScreen';

export default function LoginRoute() {
  const router = useRouter();
  const auth = useSelector(selectAuth);

  // Track if component is mounted
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    // Set mounted flag after first render
    setIsMounted(true);
  }, []);

  // If already authenticated, redirect to home
  React.useEffect(() => {
    if (isMounted && auth.isAuthenticated) {
      router.push('/');
    }
  }, [isMounted, auth.isAuthenticated, router]);

  return (
    <View style={{ flex: 1 }}>
      <LoginScreen />
    </View>
  );
}

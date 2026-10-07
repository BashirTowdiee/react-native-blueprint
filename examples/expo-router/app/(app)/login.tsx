import React from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../store';
import LoginScreen from '../../components/LoginScreen';
import { useAppNavigation } from '../../hooks/useAppNavigation';

export default function LoginRoute() {
  const navigation = useAppNavigation();
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
      navigation.push('/');
    }
  }, [isMounted, auth.isAuthenticated, navigation]);

  return (
    <View style={{ flex: 1 }}>
      <LoginScreen />
    </View>
  );
}

import { Stack, useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { useTokens } from '../../design-system/tokens';
import { createStyles } from '../../design-system/styles';
import {
  AppNavigationProvider,
  type AppNavigation,
} from '../../hooks/useAppNavigation';

export default function AppLayout() {
  const tokens = useTokens();
  const styles = createStyles(tokens);
  const router = useRouter();
  const navigation = useMemo<AppNavigation>(
    () => ({
      push(path) {
        router.push(path as Href);
      },
      replace(path) {
        router.replace(path as Href);
      },
      back() {
        router.back();
      },
    }),
    [router],
  );

  return (
    <AppNavigationProvider navigation={navigation}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: tokens.baseColors.white,
          },
          headerTintColor: tokens.baseColors.textColor,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: tokens.semanticColors.appBackgroundColor,
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'itsumo benkyou' }} />
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen name="story-list" options={{ title: 'Stories' }} />
        <Stack.Screen name="passage/[id]" options={{ title: 'Passage' }} />
        <Stack.Screen name="study/[id]" options={{ title: 'Study' }} />
      </Stack>
    </AppNavigationProvider>
  );
}

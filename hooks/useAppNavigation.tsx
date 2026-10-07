import React, {
  createContext,
  type ReactNode,
  useContext,
} from 'react';

export type AppNavigation = {
  push(path: string): void;
  back(): void;
};

type AppNavigationProviderProps = {
  navigation: AppNavigation;
  children: ReactNode;
};

const AppNavigationContext = createContext<AppNavigation | null>(null);

export function AppNavigationProvider({
  navigation,
  children,
}: AppNavigationProviderProps) {
  return (
    <AppNavigationContext.Provider value={navigation}>
      {children}
    </AppNavigationContext.Provider>
  );
}

export function useAppNavigation(): AppNavigation {
  const navigation = useContext(AppNavigationContext);

  if (!navigation) {
    throw new Error(
      'useAppNavigation must be used within an AppNavigationProvider.',
    );
  }

  return navigation;
}

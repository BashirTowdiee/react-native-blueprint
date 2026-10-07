import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../store'; // You'd create this store separately
import { tokenServer } from '../utils/token-server';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize token server
    const init = async () => {
      await tokenServer.initialize();
      setIsReady(true);
    };

    init();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Slot />
      </PersistGate>
    </Provider>
  );
}

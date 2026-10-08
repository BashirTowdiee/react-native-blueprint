import { Redirect } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { isBlueprintDevelopmentEnabled } from '@react-native-blueprint/react-native/dev';

export default function HomeRoute() {
  if (isBlueprintDevelopmentEnabled()) {
    return <Redirect href="/ide" />;
  }

  return (
    <View style={styles.container}>
      <Text>React Native Blueprint is available in development builds.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
});

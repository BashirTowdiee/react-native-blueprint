import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { selectAuth } from '../../store';
import { useTokens } from '../../design-system/tokens';
import { createStyles } from '../../design-system/styles';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const tokens = useTokens();
  const styles = createStyles(tokens);
  const router = useRouter();
  const auth = useSelector(selectAuth);
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    // Set mounted flag after first render
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (isMounted && !auth.isAuthenticated) {
      router.replace('/login');
    }
  }, [auth.isAuthenticated, router]);

  const handleViewStories = () => {
    router.push('/story-list');
  };

  const goToIDE = () => {
    // Only available on web
    if (Platform.OS === 'web') {
      // Navigate to the IDE screen
      window.location.href = '/ide';
    }
  };

  if (!auth.isAuthenticated) {
    return null; // We'll redirect to login in the useEffect
  }

  return (
    <View style={styles.container}>
      <View style={{ padding: 16, flex: 1 }}>
        <View style={{ alignItems: 'center', marginBottom: 32, marginTop: 16 }}>
          <Image
            source={{ uri: 'https://via.placeholder.com/120' }}
            style={{ width: 120, height: 120, marginBottom: 16 }}
          />

          <Text style={[styles.heading, { textAlign: 'center' }]}>
            itsumo benkyou
          </Text>

          <Text style={[styles.bodyText, { textAlign: 'center' }]}>
            Study generated Japanese passages at your preferred length and JLPT
            level
          </Text>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', gap: 16 }}>
          <TouchableOpacity
            style={[
              styles.card,
              { flexDirection: 'row', alignItems: 'center' },
            ]}
            onPress={handleViewStories}
          >
            <Ionicons
              name="book-outline"
              size={24}
              color={tokens.baseColors.textColor}
              style={{ marginRight: 16 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.subheading}>View Stories</Text>
              <Text style={styles.bodyText}>
                Browse your collection of Japanese passages
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={tokens.baseColors.textColor}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.card,
              { flexDirection: 'row', alignItems: 'center' },
            ]}
            onPress={() => {}}
          >
            <Ionicons
              name="add-circle-outline"
              size={24}
              color={tokens.baseColors.textColor}
              style={{ marginRight: 16 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.subheading}>Generate New Story</Text>
              <Text style={styles.bodyText}>
                Create a new AI-generated Japanese passage
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={tokens.baseColors.textColor}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.card,
              { flexDirection: 'row', alignItems: 'center' },
            ]}
            onPress={() => {}}
          >
            <Ionicons
              name="stats-chart-outline"
              size={24}
              color={tokens.baseColors.textColor}
              style={{ marginRight: 16 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.subheading}>View Progress</Text>
              <Text style={styles.bodyText}>
                Track your Japanese learning journey
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={tokens.baseColors.textColor}
            />
          </TouchableOpacity>

          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={[
                styles.card,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: tokens.baseColors.lightViolet,
                },
              ]}
              onPress={goToIDE}
            >
              <Ionicons
                name="code-outline"
                size={24}
                color={tokens.baseColors.white}
                style={{ marginRight: 16 }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.subheading,
                    { color: tokens.baseColors.white },
                  ]}
                >
                  Open IDE
                </Text>
                <Text
                  style={[styles.bodyText, { color: tokens.baseColors.white }]}
                >
                  View the app blueprint and modify design tokens
                </Text>
              </View>
              <Ionicons
                name="open-outline"
                size={24}
                color={tokens.baseColors.white}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ marginTop: 16 }}>
          <Text style={[styles.bodyText, { textAlign: 'center' }]}>
            Logged in as {auth.username}
          </Text>
        </View>
      </View>
    </View>
  );
}

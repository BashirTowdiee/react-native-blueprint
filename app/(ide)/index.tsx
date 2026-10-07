import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Pressable,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTokens, updateToken } from '../../design-system/tokens';
import { createStyles } from '../../design-system/styles';
import LoginScreen from '../../components/LoginScreen';
import StoryListScreen from '../../components/StoryListScreen';
import PassageScreen from '../../components/PassageScreen';
import StudyScreen from '../../components/StudyScreen';
import ColorPicker from '../../components/ColorPicker';
import {
  AppNavigationProvider,
  type AppNavigation,
} from '../../hooks/useAppNavigation';

// Tab types for the sidebar
type TabType = 'tokens' | 'redux';

const previewNavigation: AppNavigation = {
  push() {},
  back() {},
};

export default function IDEScreen() {
  const tokens = useTokens();
  const styles = createStyles(tokens);
  const [tabState, setTabState] = useState<TabType>('tokens');
  const [artBoardScale, setArtBoardScale] = useState<number>(0.5);
  const workspaceRef = useRef<View>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColorToken, setActiveColorToken] = useState<{
    path: string[];
    value: string;
  } | null>(null);

  // Get Redux state for display
  const reduxState = useSelector((state) => state);

  // Handle mouse wheel for zooming the artboard
  const handleWheel = useCallback(
    (event: any) => {
      if (event.ctrlKey) {
        event.preventDefault();
        const newScale =
          event.deltaY < 0
            ? Math.min(artBoardScale + 0.03, 2)
            : Math.max(artBoardScale - 0.03, 0.3);
        setArtBoardScale(newScale);
      }
    },
    [artBoardScale],
  );

  useEffect(() => {
    if (Platform.OS === 'web') {
      const workspaceElement = workspaceRef.current;
      if (workspaceElement) {
        // @ts-ignore - TypeScript doesn't know about DOM events in React Native Web
        workspaceElement.addEventListener('wheel', handleWheel);
      }

      return () => {
        if (workspaceElement) {
          // @ts-ignore
          workspaceElement.removeEventListener('wheel', handleWheel);
        }
      };
    }
  }, [handleWheel]);

  // Handle token updates
  const handleColorChange = useCallback(
    async (color: string) => {
      if (activeColorToken) {
        await updateToken(activeColorToken.path, color);
        setShowColorPicker(false);
        setActiveColorToken(null);
      }
    },
    [activeColorToken],
  );

  const openColorPicker = useCallback((path: string[], value: string) => {
    setActiveColorToken({ path, value });
    setShowColorPicker(true);
  }, []);

  // Helper to render color tokens
  const renderColorTokens = useCallback(
    (
      categoryName: string,
      colors: Record<string, string>,
      basePath: string[],
    ) => {
      return (
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.subheading, { color: tokens.baseColors.white }]}>
            {categoryName}
          </Text>
          {Object.entries(colors).map(([name, value]) => (
            <View key={name} style={styles.colorItem}>
              <View style={[styles.colorSwatch, { backgroundColor: value }]} />
              <Text style={styles.colorName}>{name}</Text>
              <TouchableOpacity
                onPress={() => openColorPicker([...basePath, name], value)}
              >
                <Text style={styles.colorValue}>{value}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      );
    },
    [styles, tokens, openColorPicker],
  );

  // Render tokens panel
  const renderTokensPanel = useCallback(() => {
    return (
      <ScrollView style={{ flex: 1 }}>
        {renderColorTokens('Base Colors', tokens.baseColors, ['baseColors'])}
        {renderColorTokens('Semantic Colors', tokens.semanticColors, [
          'semanticColors',
        ])}
      </ScrollView>
    );
  }, [tokens, renderColorTokens]);

  // Render Redux state panel
  const renderReduxPanel = useCallback(() => {
    return (
      <ScrollView style={{ flex: 1 }}>
        <Text style={[styles.bodyText, { color: tokens.baseColors.white }]}>
          {JSON.stringify(reduxState, null, 2)}
        </Text>
      </ScrollView>
    );
  }, [reduxState, styles, tokens]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.workspace}>
        {/* Left sidebar */}
        <View style={styles.leftColumn}>
          {/* Tab bar */}
          <View style={styles.tabBar}>
            <Pressable
              onPress={() => setTabState('tokens')}
              style={[
                styles.tab,
                tabState === 'tokens' ? styles.selectedTab : null,
              ]}
            >
              <Text style={styles.tabText}>tokens</Text>
            </Pressable>
            <Pressable
              onPress={() => setTabState('redux')}
              style={[
                styles.tab,
                tabState === 'redux' ? styles.selectedTab : null,
              ]}
            >
              <Text style={styles.tabText}>redux</Text>
            </Pressable>
          </View>

          {/* Panel content */}
          <View style={{ flex: 1 }}>
            {tabState === 'tokens' ? renderTokensPanel() : null}
            {tabState === 'redux' ? renderReduxPanel() : null}
          </View>
        </View>

        {/* Main workspace */}
        <View style={styles.artboard} ref={workspaceRef}>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              transform: [{ scale: artBoardScale }],
              transformOrigin: 'top left',
              padding: 20,
            }}
          >
            <AppNavigationProvider navigation={previewNavigation}>
              {/* Screen containers */}
              <ScreenContainer label="Login">
                <LoginScreen />
              </ScreenContainer>

              <ScreenContainer label="StoryList">
                <StoryListScreen />
              </ScreenContainer>

              <ScreenContainer label="Passage">
                <PassageScreen passageId="1" />
              </ScreenContainer>

              <ScreenContainer label="StudyScreen">
                <StudyScreen passageId="1" />
              </ScreenContainer>
            </AppNavigationProvider>
          </View>
        </View>
      </View>

      {/* Color picker modal */}
      {showColorPicker && activeColorToken && (
        <ColorPicker
          initialColor={activeColorToken.value}
          onColorSelected={handleColorChange}
          onCancel={() => {
            setShowColorPicker(false);
            setActiveColorToken(null);
          }}
        />
      )}
    </View>
  );
}

// Helper component for screen containers in the artboard
function ScreenContainer({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const tokens = useTokens();
  const styles = createStyles(tokens);

  return (
    <View
      style={{
        width: 375,
        height: 667,
        margin: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 15,
        overflow: 'hidden',
        borderWidth: 10,
        borderColor: '#333',
      }}
    >
      <Text
        style={{
          backgroundColor: '#333',
          color: 'white',
          padding: 5,
          textAlign: 'center',
          fontWeight: 'bold',
        }}
      >
        {label}
      </Text>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

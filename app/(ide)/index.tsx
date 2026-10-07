import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { useSelector } from 'react-redux';
import {
  BlueprintView,
  type BlueprintArtboard,
} from '@react-native-blueprint/react-native';
import { useTokens, updateToken } from '../../design-system/tokens';
import { createStyles } from '../../design-system/styles';
import LoginScreen from '../../components/LoginScreen';
import StoryListScreen from '../../components/StoryListScreen';
import PassageScreen from '../../components/PassageScreen';
import StudyScreen from '../../components/StudyScreen';
import ColorPicker from '../../components/ColorPicker';

// Tab types for the sidebar
type TabType = 'tokens' | 'redux';


const prototypeArtboards: BlueprintArtboard[] = [
  {
    id: 'login',
    label: 'Login',
    render: () => <LoginScreen designing />,
  },
  {
    id: 'story-list',
    label: 'StoryList',
    render: () => <StoryListScreen designing />,
  },
  {
    id: 'passage',
    label: 'Passage',
    render: () => <PassageScreen designing />,
  },
  {
    id: 'study',
    label: 'StudyScreen',
    render: () => <StudyScreen designing />,
  },
];

export default function IDEScreen() {
  const tokens = useTokens();
  const styles = createStyles(tokens);
  const [tabState, setTabState] = useState<TabType>('tokens');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [activeColorToken, setActiveColorToken] = useState<{
    path: string[];
    value: string;
  } | null>(null);

  // Get Redux state for display
  const reduxState = useSelector((state) => state);

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
        <BlueprintView
          artboards={prototypeArtboards}
          initialScale={0.5}
          style={styles.artboard}
        />
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

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
import { useTokens, updateToken } from '../design-system/tokens';
import { createStyles } from '../design-system/styles';
import LoginScreen from '../components/LoginScreen';
import StoryListScreen from '../components/StoryListScreen';
import PassageScreen from '../components/PassageScreen';
import StudyScreen from '../components/StudyScreen';
import ColorPicker from '../components/ColorPicker';

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
          <Text
            style={{
              fontSize: 18,
              fontWeight: '600',
              color: '#FFFFFF',
              marginVertical: 8,
            }}
          >
            {categoryName}
          </Text>
          {Object.entries(colors).map(([name, value]) => (
            <View
              key={name}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginVertical: 4,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  marginRight: 8,
                  backgroundColor: value,
                }}
              />
              <Text
                style={{
                  color: '#FFFFFF',
                  flex: 1,
                }}
              >
                {name}
              </Text>
              <TouchableOpacity
                onPress={() => openColorPicker([...basePath, name], value)}
              >
                <Text
                  style={{
                    color: '#CCCCCC',
                    fontFamily: 'monospace',
                  }}
                >
                  {value}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      );
    },
    [openColorPicker],
  );

  // Render tokens panel
  const renderTokensPanel = useCallback(() => {
    // Add console log to debug tokens
    console.log('Current tokens:', tokens);

    // Default colors to display if tokens aren't loaded
    const defaultBaseColors = {
      black: '#1A1A1A',
      gray1: '#E4D0D6',
      gray2: '#F2EAE3',
      gray3: '#CCCCCC',
      textColor: '#231A1B',
      white: '#FFFFFF',
      brown: '#38000A44',
      lightBlue: '#4fb3d3',
      green: '#3cd53c',
      blue: '#0000FF',
      orange: '#FFA500',
      lightViolet: '#b467de',
      brilliantRose: '#e64bc5',
      monkey: '#4bc5ff',
    };

    const defaultSemanticColors = {
      thumbnailBackground: 'black',
      buttonColor: 'gray2',
      appBackgroundColor: 'gray1',
      guideColor: 'brown',
      'header.titleLight': 'white',
      'header.title': 'black',
    };

    // Use actual tokens if available, otherwise use defaults
    const baseColors = tokens?.baseColors || defaultBaseColors;
    const semanticColors = tokens?.semanticColors || defaultSemanticColors;

    return (
      <ScrollView style={{ flex: 1 }}>
        {renderColorTokens('Base Colors', baseColors, ['baseColors'])}
        {renderColorTokens('Semantic Colors', semanticColors, [
          'semanticColors',
        ])}
      </ScrollView>
    );
  }, [tokens, renderColorTokens]);

  // Render Redux state panel
  const renderReduxPanel = useCallback(() => {
    return (
      <ScrollView style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontFamily: 'monospace',
            color: '#FFFFFF',
          }}
        >
          {JSON.stringify(reduxState, null, 2)}
        </Text>
      </ScrollView>
    );
  }, [reduxState]);

  return (
    <View style={{ flex: 1 }}>
      <View
        style={{
          flexDirection: 'row',
          flex: 1,
        }}
      >
        {/* Left sidebar */}
        <View
          style={{
            width: 250,
            backgroundColor: tokens.baseColors.black || '#1A1A1A',
            padding: 16,
          }}
        >
          {/* Tab bar */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: tokens.baseColors.black || '#1A1A1A',
              padding: 4,
              borderRadius: 2,
              marginBottom: 4,
            }}
          >
            <Pressable
              onPress={() => setTabState('tokens')}
              style={[
                {
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 2,
                  marginRight: 4,
                },
                tabState === 'tokens'
                  ? {
                      backgroundColor:
                        tokens.baseColors.lightViolet || '#b467de',
                    }
                  : null,
              ]}
            >
              <Text style={{ color: tokens.baseColors.white || '#FFFFFF' }}>
                tokens
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setTabState('redux')}
              style={[
                {
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 2,
                  marginRight: 4,
                },
                tabState === 'redux'
                  ? {
                      backgroundColor:
                        tokens.baseColors.lightViolet || '#b467de',
                    }
                  : null,
              ]}
            >
              <Text style={{ color: tokens.baseColors.white || '#FFFFFF' }}>
                redux
              </Text>
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

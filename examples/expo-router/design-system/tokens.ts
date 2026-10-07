import { useEffect, useState } from 'react';
import { tokenServer } from '../utils/token-server';

// Token types based on our JSON structure
export type BaseColors = {
  black: string;
  gray1: string;
  gray2: string;
  gray3: string;
  textColor: string;
  white: string;
  brown: string;
  lightBlue: string;
  green: string;
  blue: string;
  orange: string;
  lightViolet: string;
  brilliantRose: string;
  monkey: string;
};

export type SemanticColors = {
  thumbnailBackground: string;
  buttonColor: string;
  appBackgroundColor: string;
  guideColor: string;
  'header.titleLight': string;
  'header.title': string;
};

export type TokensType = {
  baseColors: BaseColors;
  semanticColors: SemanticColors;
};

// Default tokens to use until the real ones are loaded
const defaultTokens: TokensType = {
  baseColors: {
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
  },
  semanticColors: {
    thumbnailBackground: 'black',
    buttonColor: 'gray2',
    appBackgroundColor: 'gray1',
    guideColor: 'brown',
    'header.titleLight': 'white',
    'header.title': 'black',
  },
};

// This will initialize as a singleton
let globalTokens: TokensType = { ...defaultTokens };

// Hook to access tokens and subscribe to changes
export function useTokens() {
  const [tokens, setTokens] = useState<TokensType>(globalTokens);

  useEffect(() => {
    // Initialize token server
    const initTokens = async () => {
      await tokenServer.initialize();
      const serverTokens = tokenServer.getTokens() as TokensType;

      // Ensure we have all the expected token properties
      const mergedTokens = {
        baseColors: {
          ...globalTokens.baseColors,
          ...(serverTokens?.baseColors || {}),
        },
        semanticColors: {
          ...globalTokens.semanticColors,
          ...(serverTokens?.semanticColors || {}),
        },
      };

      globalTokens = mergedTokens;
      setTokens(mergedTokens);
    };

    initTokens();

    // Subscribe to token changes
    const unsubscribe = tokenServer.subscribe(() => {
      const updatedTokens = tokenServer.getTokens() as TokensType;

      // Again ensure we maintain the structure
      const mergedTokens = {
        baseColors: {
          ...globalTokens.baseColors,
          ...(updatedTokens?.baseColors || {}),
        },
        semanticColors: {
          ...globalTokens.semanticColors,
          ...(updatedTokens?.semanticColors || {}),
        },
      };

      globalTokens = mergedTokens;
      setTokens({ ...mergedTokens });
    });

    return unsubscribe;
  }, []);

  return tokens;
}

// Function to update a token value
export const updateToken = async (path: string[], value: string) => {
  return await tokenServer.updateToken(path, value);
};

// Get color value from either base or semantic colors
export const getColor = (tokens: TokensType, colorName: string): string => {
  if (colorName in tokens.baseColors) {
    return tokens.baseColors[colorName as keyof BaseColors];
  }
  if (colorName in tokens.semanticColors) {
    const semanticValue =
      tokens.semanticColors[colorName as keyof SemanticColors];
    // If the semantic color references a base color, resolve it
    if (semanticValue in tokens.baseColors) {
      return tokens.baseColors[semanticValue as keyof BaseColors];
    }
    return semanticValue;
  }
  return colorName; // Return the original value if not found
};

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { Asset } from 'expo-asset';

// This is a simplified version to work with Expo
// In a real app, you'd need to set up a proper server
export class TokenServer {
  private static instance: TokenServer;
  private tokensPath: string = '';
  private tokens: Record<string, any> = {};
  private subscribers: Array<() => void> = [];

  private constructor() {}

  public static getInstance(): TokenServer {
    if (!TokenServer.instance) {
      TokenServer.instance = new TokenServer();
    }
    return TokenServer.instance;
  }

  public async initialize() {
    // Load tokens from the JSON file during initialization
    try {
      // Default token structure
      this.tokens = {
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

      if (Platform.OS === 'web') {
        // On web, we'll use a different approach since we can directly modify files
        // In a real implementation, you would set up an actual server
        try {
          const response = await fetch('/tokens.json');
          const loadedTokens = await response.json();

          // Merge with default structure
          if (loadedTokens?.baseColors) {
            this.tokens.baseColors = {
              ...this.tokens.baseColors,
              ...loadedTokens.baseColors,
            };
          }

          if (loadedTokens?.semanticColors) {
            this.tokens.semanticColors = {
              ...this.tokens.semanticColors,
              ...loadedTokens.semanticColors,
            };
          }
        } catch (loadError) {
          console.warn(
            'Could not load tokens from JSON, using defaults',
            loadError,
          );
          // Continue with default tokens
        }
      } else {
        // For native platforms, we'll use the assets directory
        try {
          const asset = Asset.fromModule(require('../tokens.json'));
          await asset.downloadAsync();
          if (asset.localUri) {
            const content = await FileSystem.readAsStringAsync(asset.localUri);
            const loadedTokens = JSON.parse(content);

            // Merge with default structure
            if (loadedTokens?.baseColors) {
              this.tokens.baseColors = {
                ...this.tokens.baseColors,
                ...loadedTokens.baseColors,
              };
            }

            if (loadedTokens?.semanticColors) {
              this.tokens.semanticColors = {
                ...this.tokens.semanticColors,
                ...loadedTokens.semanticColors,
              };
            }

            this.tokensPath = asset.localUri;
          }
        } catch (loadError) {
          console.warn(
            'Could not load tokens from asset, using defaults',
            loadError,
          );
          // Continue with default tokens
        }
      }
    } catch (error) {
      console.error('Failed to initialize tokens:', error);
    }

    console.log('Token server initialized with tokens:', this.tokens);
    return this.tokens;
  }

  public getTokens() {
    return this.tokens;
  }

  public async updateToken(path: string[], value: string) {
    // Navigate through the object paths to find the token to update
    let current = this.tokens;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }

    // Update the token value
    current[path[path.length - 1]] = value;

    // Only on web, we can actually save changes to the file system
    // In a real implementation, you would call your server
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const updatedContent = JSON.stringify(this.tokens, null, 2);

        // In a real implementation, this would be a call to your backend
        console.log('Token updated:', path.join('.'), '=', value);

        // This is where you'd make an API call in a real app
        // For demo purposes, we're simulating it with a console.log

        // Notify subscribers about the token update
        this.notifySubscribers();

        return { success: true, message: 'Token updated successfully' };
      } catch (error) {
        console.error('Failed to update token:', error);
        return { success: false, message: 'Failed to update token' };
      }
    } else {
      // For native, we'll just update the in-memory tokens and notify subscribers
      this.notifySubscribers();
      return { success: true, message: 'Token updated in memory' };
    }
  }

  public subscribe(callback: () => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((sub) => sub !== callback);
    };
  }

  private notifySubscribers() {
    for (const subscriber of this.subscribers) {
      subscriber();
    }
  }
}

// Create a singleton instance
export const tokenServer = TokenServer.getInstance();

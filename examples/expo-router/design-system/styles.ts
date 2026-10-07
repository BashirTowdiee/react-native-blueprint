import { StyleSheet } from 'react-native';
import { TokensType, getColor } from './tokens';

// Create a typed StyleSheet using our design tokens
export const createStyles = (tokens: TokensType) => {
  return StyleSheet.create({
    // Layout styles
    container: {
      flex: 1,
      backgroundColor: getColor(tokens, 'appBackgroundColor'),
    },
    screenContainer: {
      flex: 1,
      backgroundColor: getColor(tokens, 'white'),
      borderRadius: 8,
      overflow: 'hidden',
      margin: 8,
    },

    // Typography
    heading: {
      fontSize: 24,
      fontWeight: 'bold',
      color: getColor(tokens, 'textColor'),
      marginVertical: 16,
    },
    subheading: {
      fontSize: 18,
      fontWeight: '600',
      color: getColor(tokens, 'textColor'),
      marginVertical: 8,
    },
    bodyText: {
      fontSize: 16,
      color: getColor(tokens, 'textColor'),
      marginVertical: 4,
    },

    // UI Components
    button: {
      backgroundColor: getColor(tokens, 'buttonColor'),
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 8,
    },
    buttonText: {
      color: getColor(tokens, 'textColor'),
      fontWeight: '600',
    },
    card: {
      backgroundColor: getColor(tokens, 'white'),
      borderRadius: 8,
      padding: 16,
      margin: 8,
      shadowColor: getColor(tokens, 'black'),
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    input: {
      backgroundColor: getColor(tokens, 'white'),
      borderWidth: 1,
      borderColor: getColor(tokens, 'gray3'),
      borderRadius: 6,
      padding: 12,
      marginVertical: 8,
      color: getColor(tokens, 'textColor'),
    },

    // IDE specific styles
    workspace: {
      flexDirection: 'row',
      flex: 1,
    },
    leftColumn: {
      width: 250,
      backgroundColor: getColor(tokens, 'black'),
      padding: 16,
    },
    artboard: {
      flex: 1,
      padding: 16,
      backgroundColor: '#333',
    },
    tabBar: {
      flexDirection: 'row',
      backgroundColor: getColor(tokens, 'black'),
      padding: 4,
      borderRadius: 2,
      marginBottom: 4,
    },
    tab: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 2,
      marginRight: 4,
    },
    selectedTab: {
      backgroundColor: getColor(tokens, 'lightViolet'),
    },
    tabText: {
      color: getColor(tokens, 'white'),
    },
    colorItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 4,
    },
    colorSwatch: {
      width: 20,
      height: 20,
      borderRadius: 4,
      marginRight: 8,
    },
    colorName: {
      color: getColor(tokens, 'white'),
      flex: 1,
    },
    colorValue: {
      color: getColor(tokens, 'gray3'),
      fontFamily: 'monospace',
    },
  });
};

export type AppStyles = ReturnType<typeof createStyles>;

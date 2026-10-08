import { Platform } from 'react-native';
import type { BlueprintInspectionConfiguration } from '@react-native-blueprint/react-native';

// External names and source overrides use existing accessibility labels.
export const socialInspection: BlueprintInspectionConfiguration = {
  automatic: true,
  mappings: [
    { id: 'search', match: { accessibilityLabel: 'Search social posts' }, name: 'Search input' },
    { id: 'draft', match: { accessibilityLabel: 'Post draft' }, name: 'Post draft' },
    { id: 'thread', match: { accessibilityLabel: { prefix: 'Open thread ' } }, name: 'Open conversation' },
    { id: 'post', match: { componentName: 'PostCard', host: 'View' }, name: 'Post card' },
    { id: 'profile', match: { accessibilityLabel: { prefix: 'View ' } }, name: 'Author profile' },
  ],
  devTools: Platform.OS === 'web' && __DEV__ && typeof document !== 'undefined' ? require('./devtoolsConnection.cjs') : undefined,
};

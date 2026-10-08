import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();

const examples = [
  {
    name: 'Expo Router',
    file: 'examples/expo-router/app/(ide)/ide.tsx',
    required: [
      '@react-native-blueprint/react-native',
      '@react-native-blueprint/react-native/dev',
      'socialManifest',
      'socialFlow',
      'SocialNavigationApp',
      'BlueprintPreviewHost',
      'BlueprintWorkspace',
      'isBlueprintDevelopmentEnabled',
    ],
  },
  {
    name: 'React Navigation',
    file: 'examples/react-navigation/src/App.tsx',
    required: [
      '@react-native-blueprint/core',
      '@react-native-blueprint/react-native',
      '@react-native-blueprint/react-native/dev',
      '@react-native-blueprint/react-navigation',
      'createReactNavigationStaticManifest',
      'registerReactNavigationScreens',
      'BlueprintPreviewHost',
      'BlueprintView',
      'BlueprintDevelopmentGuard',
    ],
  },
];

for (const example of examples) {
  const source = await readFile(join(root, example.file), 'utf8');

  for (const required of example.required) {
    if (!source.includes(required)) {
      throw new Error(
        `${example.name}: expected ${example.file} to contain ${required}`,
      );
    }
  }

  const blueprintImports = [
    ...source.matchAll(
      /from\s+['"](@react-native-blueprint\/[^'"]+)['"]/g,
    ),
  ].map((match) => match[1]);

  if (blueprintImports.length === 0) {
    throw new Error(`${example.name}: no Blueprint public imports found`);
  }

  for (const specifier of blueprintImports) {
    if (
      specifier.includes('/src/') ||
      specifier.includes('/dist/')
    ) {
      throw new Error(
        `${example.name}: unsupported Blueprint deep import ${specifier}`,
      );
    }
  }

  console.log(
    `${example.name}: public API and development guard smoke checks passed`,
  );
}

console.log('Blueprint example smoke validation passed.');

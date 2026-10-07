import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const expected = new Map([
  ['core', { name: '@react-native-blueprint/core', internal: [] }],
  ['react-native', { name: '@react-native-blueprint/react-native', internal: ['@react-native-blueprint/core'] }],
  ['expo-router', { name: '@react-native-blueprint/expo-router', internal: ['@react-native-blueprint/core'] }],
  ['react-navigation', { name: '@react-native-blueprint/react-navigation', internal: ['@react-native-blueprint/core'] }],
  ['plugin-redux', { name: '@react-native-blueprint/plugin-redux', internal: ['@react-native-blueprint/core'] }],
  ['plugin-tokens', { name: '@react-native-blueprint/plugin-tokens', internal: ['@react-native-blueprint/core'] }],
]);

const forbiddenCoreDependencies = new Set([
  'expo',
  'expo-router',
  '@react-navigation/native',
  'react-redux',
  'redux',
]);

const manifests = new Map();
for (const [directory, rules] of expected) {
  const path = join(root, 'packages', directory, 'package.json');
  const manifest = JSON.parse(await readFile(path, 'utf8'));
  manifests.set(directory, manifest);

  if (manifest.name !== rules.name) {
    throw new Error(`${directory}: expected package name ${rules.name}, got ${manifest.name}`);
  }

  const exportKeys = Object.keys(manifest.exports ?? {});
  if (exportKeys.length !== 1 || exportKeys[0] !== '.') {
    throw new Error(`${manifest.name}: only the package-root "." export is allowed during the refactor`);
  }

  const dependencies = manifest.dependencies ?? {};
  const internal = Object.keys(dependencies).filter((name) => name.startsWith('@react-native-blueprint/')).sort();
  const allowed = [...rules.internal].sort();
  if (JSON.stringify(internal) !== JSON.stringify(allowed)) {
    throw new Error(`${manifest.name}: internal dependencies ${internal.join(', ')} do not match allowed dependencies ${allowed.join(', ')}`);
  }
}

const core = manifests.get('core');
const coreDependencySections = [
  core.dependencies ?? {},
  core.devDependencies ?? {},
  core.peerDependencies ?? {},
  core.optionalDependencies ?? {},
];

for (const dependencies of coreDependencySections) {
  for (const name of Object.keys(dependencies)) {
    if (forbiddenCoreDependencies.has(name)) {
      throw new Error(`@react-native-blueprint/core must not depend on ${name}`);
    }
  }
}

console.log('Blueprint package boundaries are valid.');

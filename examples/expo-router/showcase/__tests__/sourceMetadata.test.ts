import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
const babel = require('@babel/core');
const sourcePlugin = require('../../babel-blueprint-source.cjs');

function instrument(code: string, filename = resolve(__dirname, '../SocialApp.tsx')) {
  return babel.transformSync(code, {
    filename, babelrc: false, configFile: false, ast: true,
    parserOpts: { plugins: ['typescript', 'jsx'] }, plugins: [sourcePlugin],
  }).ast;
}
function locations(ast: any) {
  const found: { name: string; line: number; location?: Record<string, string | number> }[] = [];
  babel.traverse(ast, {
    JSXOpeningElement(path: any) {
      const attr = path.node.attributes.find((a: any) => a.name?.name === 'sourceLocation');
      const name = path.node.attributes.find((a: any) => a.name?.name === 'name');
      if (attr) found.push({ name: name?.value?.value, line: path.node.loc.start.line,
        location: Object.fromEntries(attr.value.expression.properties.map((p: any) => [p.key.name, p.value.value])) });
    },
  });
  return found;
}

it('gives every showcase region its actual file and JSX line, including SettingsPanel', () => {
  for (const file of ['SocialApp.tsx', 'SocialNavigationApp.tsx', 'SocialFlow.tsx']) {
    const filename = resolve(__dirname, '..', file);
    const code = readFileSync(filename, 'utf8');
    const found = locations(instrument(code, filename));
    expect(found.length).toBe((code.match(/<BlueprintInspectable\b/g) ?? []).length);
    if (file === 'SocialApp.tsx') expect(found.map((entry) => entry.name)).toEqual(['SettingsPanel']);
    for (const entry of found) {
      expect(entry.location?.file).toBe(`examples/expo-router/showcase/${file}`);
      expect(entry.location?.line).toBe(entry.line);
    }
  }
});

it('supports an import alias, preserves supplied locations and ignores unrelated components', () => {
  const found = locations(instrument(`import { BlueprintInspectable as Region } from '@react-native-blueprint/react-native';
import { BlueprintInspectable } from 'other-library';
const value = <><Region name="First" /><Region name="Explicit" sourceLocation={{file:'custom.tsx',line:91}} /><BlueprintInspectable name="Unrelated" /></>;`));
  expect(found.map((entry) => entry.name)).toEqual(['First', 'Explicit']);
  expect(found[1].location).toEqual({ file: 'custom.tsx', line: 91 });
});

it('does not inject metadata into files outside the example or production configuration', () => {
  const outside = instrument(`import { BlueprintInspectable } from '@react-native-blueprint/react-native'; const x=<BlueprintInspectable name="External"/>;`, resolve(__dirname, '../../../../packages/react-native/src/Test.tsx'));
  expect(locations(outside)).toHaveLength(0);
  const config = require('../../babel.config.cjs');
  expect(config({ env: () => 'production' }).plugins).toEqual([]);
});

it('instruments aliased React Native hosts with JSX locations while preserving keys, refs and prop spreads', () => {
  const ast = instrument(`import { View as Box, Text } from 'react-native';
import { View } from 'elsewhere';
function Profile(props) { return <Box key="one" ref={props.ref} {...props}><Text>Hello</Text><View /></Box>; }`);
  const generated: any[] = [];
  babel.traverse(ast, { JSXOpeningElement(path: any) { const source = path.node.attributes.find((a: any) => a.name?.name === 'blueprintSource'); if (source) generated.push({ node: path.node, metadata: source.value.expression }); } });
  expect(generated).toHaveLength(2);
  expect(generated[0].node.attributes.some((a: any) => a.name?.name === 'key')).toBe(true);
  expect(generated[0].node.attributes.some((a: any) => a.name?.name === 'ref')).toBe(true);
  expect(generated[0].metadata.properties.find((p: any) => p.key.name === 'name').value.value).toBe('Profile');
  const code = readFileSync(resolve(__dirname, '../SocialApp.tsx'), 'utf8');
  expect(code.match(/<BlueprintInspectable\b/g)).toHaveLength(1);
});

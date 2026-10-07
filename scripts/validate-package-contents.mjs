import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const packageDirectories = [
  'core',
  'react-native',
  'expo-router',
  'react-navigation',
  'plugin-redux',
  'plugin-tokens',
];

for (const directory of packageDirectories) {
  const packageRoot = join(root, 'packages', directory);
  const manifest = JSON.parse(
    await readFile(join(packageRoot, 'package.json'), 'utf8'),
  );

  if (manifest.private === true) {
    throw new Error(`${manifest.name}: package is still private`);
  }

  if (manifest.publishConfig?.access !== 'public') {
    throw new Error(
      `${manifest.name}: publishConfig.access must be "public"`,
    );
  }

  const packed = spawnSync(
    'npm',
    ['pack', '--dry-run', '--json'],
    {
      cwd: packageRoot,
      encoding: 'utf8',
    },
  );

  if (packed.status !== 0) {
    throw new Error(
      `${manifest.name}: npm pack failed\n${packed.stderr || packed.stdout}`,
    );
  }

  const [result] = JSON.parse(packed.stdout);
  const files = new Set(result.files.map(({ path }) => path));

  if (!files.has('package.json')) {
    throw new Error(`${manifest.name}: package.json is missing from tarball`);
  }

  for (const file of files) {
    if (file !== 'package.json' && !file.startsWith('dist/')) {
      throw new Error(
        `${manifest.name}: unexpected tarball file ${file}`,
      );
    }
  }

  for (const [exportName, conditions] of Object.entries(
    manifest.exports ?? {},
  )) {
    for (const condition of ['types', 'default']) {
      const target = conditions?.[condition];
      if (!target) {
        throw new Error(
          `${manifest.name}: export ${exportName} is missing ${condition}`,
        );
      }

      const packedPath = target.replace(/^\.\//, '');
      if (!files.has(packedPath)) {
        throw new Error(
          `${manifest.name}: export ${exportName} points to missing tarball file ${packedPath}`,
        );
      }
    }
  }

  console.log(
    `${manifest.name}: ${files.size} intended files, exports verified`,
  );
}

console.log('Blueprint package tarballs are valid.');

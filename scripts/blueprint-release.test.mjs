import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateVersion, validateArchiveFiles, checkVersions, packageDirectories } from './blueprint-release.mjs';

test('versions reject ambiguous identifiers and malformed prereleases', () => {
  for (const version of ['0.2.0', '0.2.0-dev.1']) assert.doesNotThrow(() => validateVersion(version));
  for (const version of ['latest', 'v0.2.0', '01.2.0', '0.2.0-dev.01', '0.2']) assert.throws(() => validateVersion(version));
});
test('release archives reject example apps, source checkouts and path traversal', () => {
  validateArchiveFiles(['package/package.json', 'package/dist/index.js', 'package/babel.cjs']);
  for (const path of ['package/examples/bluesky/App.tsx', 'package/src/index.ts', 'package/dist/../examples/App.js']) assert.throws(() => validateArchiveFiles([path]));
});
test('coordinated versions detect package and public API drift', async t => {
  const root = await mkdtemp(join(tmpdir(), 'blueprint-version-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const name of packageDirectories) {
    await mkdir(join(root, 'packages', name, 'src'), { recursive: true });
    await writeFile(join(root, 'packages', name, 'package.json'), JSON.stringify({ name, version: '0.2.0-dev.1' }));
  }
  await writeFile(join(root, 'packages/core/src/version.ts'), "// Maintained by yarn release:version.\nexport const BLUEPRINT_VERSION = '0.2.0-dev.1' as const;\n");
  assert.equal((await checkVersions(root)).version, '0.2.0-dev.1');
  await writeFile(join(root, 'packages/react-native/package.json'), JSON.stringify({ name: 'renderer', version: '0.1.0' }));
  await assert.rejects(checkVersions(root), /version drift/);
});

import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const packageDirectories = ['core', 'react-native', 'expo-router', 'react-navigation', 'plugin-redux', 'plugin-tokens'];
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?$/;
export function validateVersion(version) {
  if (!semver.test(version)) throw new Error('Use a semantic version, optionally with a prerelease (e.g. 0.2.0-dev.1).');
}
const versionSource = version => `// Maintained by yarn release:version.\nexport const BLUEPRINT_VERSION = '${version}' as const;\n`;
export async function checkVersions(repository = root) {
  const manifests = await Promise.all(packageDirectories.map(async directory => ({
    directory,
    manifest: JSON.parse(await readFile(join(repository, 'packages', directory, 'package.json'), 'utf8')),
  })));
  const version = manifests[0].manifest.version;
  validateVersion(version);
  for (const { manifest } of manifests) {
    if (manifest.version !== version) throw new Error(`${manifest.name}: version drift; expected ${version}.`);
    for (const [name, range] of Object.entries(manifest.dependencies ?? {})) {
      if (name.startsWith('@react-native-blueprint/') && range !== 'workspace:*') throw new Error(`${manifest.name}: ${name} must use workspace:* for coordinated releases.`);
    }
  }
  if (await readFile(join(repository, 'packages/core/src/version.ts'), 'utf8') !== versionSource(version)) throw new Error('Public Blueprint version is out of sync. Run yarn release:version <version>.');
  return { version, manifests };
}
export function validateArchiveFiles(files) {
  const allowed = new Set(['package/package.json', 'package/dev.js', 'package/dev.d.ts', 'package/babel.cjs', 'package/babel.d.cts', 'package/devtools.cjs', 'package/devtools.d.cts']);
  for (const file of files) {
    if (!file || file.endsWith('/')) continue;
    if (file.includes('..') || (!file.startsWith('package/dist/') && !allowed.has(file))) throw new Error(`Unexpected release file: ${file}`);
  }
}
async function setVersion(version) {
  validateVersion(version);
  for (const directory of packageDirectories) {
    const path = join(root, 'packages', directory, 'package.json');
    const manifest = JSON.parse(await readFile(path, 'utf8'));
    manifest.version = version;
    await writeFile(path, `${JSON.stringify(manifest, null, 2)}\n`);
  }
  await writeFile(join(root, 'packages/core/src/version.ts'), versionSource(version));
  console.log(`All Blueprint packages: ${version}. Run yarn install to refresh yarn.lock.`);
}
async function pack(output) {
  const { version, manifests } = await checkVersions();
  const status = execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
  if (status.trim()) throw new Error('Commit Blueprint source before packing so the release identifies an exact clean source revision.');
  const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  const directory = resolve(output ?? join(root, 'releases', version));
  await mkdir(directory, { recursive: true });
  const packages = [];
  for (const { directory: name, manifest } of manifests) {
    const filename = `blueprint-${name}-${version}.tgz`;
    const path = join(directory, filename);
    let exists = false;
    try { await access(path); exists = true; } catch { /* new artifact */ }
    if (exists) throw new Error(`Refusing to overwrite immutable archive: ${path}`);
    execFileSync('yarn', ['workspace', manifest.name, 'pack', '--out', path], { cwd: root, stdio: 'pipe' });
    validateArchiveFiles(execFileSync('tar', ['-tzf', path], { encoding: 'utf8' }).split('\n'));
    const bytes = await readFile(path);
    packages.push({ name: manifest.name, version, filename, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  const release = { version, sourceCommit, builtAt: new Date().toISOString(), packages };
  await writeFile(join(directory, 'blueprint-release.json'), `${JSON.stringify(release, null, 2)}\n`);
  console.log(`Packed ${packages.length} packages at ${directory}; source ${sourceCommit}. Examples excluded.`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [command, argument] = process.argv.slice(2);
    if (command === 'version') await setVersion(argument);
    else if (command === 'check') console.log(`Blueprint ${ (await checkVersions()).version }: all package versions agree.`);
    else if (command === 'pack') await pack(argument);
    else throw new Error('Usage: blueprint-release.mjs version <semver> | check | pack [output-directory]');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}

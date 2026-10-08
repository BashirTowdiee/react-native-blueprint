import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const checkout = join(root, 'examples/upstream/bluesky');
const commit = 'bf69672674cfff39e8796b60c9f37dc7f0c9d53a';
function git(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || 'git failed');
  return result.stdout.trimEnd();
}
if (!existsSync(join(checkout, '.git'))) {
  if (existsSync(checkout))
    throw new Error('Existing non-Git directory; refusing to overwrite it.');
  await mkdir(dirname(checkout), { recursive: true });
  git([
    'clone',
    '--depth',
    '1',
    '--branch',
    '1.100.0',
    'https://github.com/bluesky-social/social-app.git',
    checkout,
  ]);
}
const actualCommit = git(['-C', checkout, 'rev-parse', 'HEAD']);
if (actualCommit !== commit)
  throw new Error(
    `Expected ${commit}, found ${actualCommit}; refusing to modify another version.`,
  );
const dirty = git(['-C', checkout, 'status', '--porcelain']);
const allowed = [
  'src/App.web.tsx',
  'src/BlueprintWorkbench.tsx',
  '.blueprint-showcase.json',
];
if (
  dirty
    .split('\n')
    .filter(Boolean)
    .some((line) => !allowed.includes(line.slice(3)))
) {
  throw new Error(
    'Upstream checkout has unrelated changes. Preserve them before preparing the harness.',
  );
}
const license = await readFile(join(checkout, 'LICENSE'), 'utf8');
if (!license.includes('Permission is hereby granted'))
  throw new Error('Upstream license did not match the expected MIT grant.');
console.log(`Bluesky 1.100.0 cloned at ${actualCommit}`);
console.log(`Source: ${checkout}`);
if (process.argv.includes('--prepare')) {
  const appPath = join(checkout, 'src/App.web.tsx');
  const original = git(['-C', checkout, 'show', 'HEAD:src/App.web.tsx']);
  const current = await readFile(appPath, 'utf8');
  const guard = `{__DEV__ && new URLSearchParams(window.location.search).has('blueprint') ? <BlueprintWorkbench /> : <Shell />}`;
  const patched = original
    .replace(
      "import {Shell} from '#/view/shell/index'",
      "import {Shell} from '#/view/shell/index'\nconst BlueprintWorkbench = React.lazy(() => import('./BlueprintWorkbench'))",
    )
    .replace(
      '<Shell />',
      `<React.Suspense fallback={null}>${guard}</React.Suspense>`,
    );
  if (!patched.includes(guard))
    throw new Error('Upstream Shell marker missing; no modifications made.');
  if (current.trim() !== original.trim() && current.trim() !== patched.trim())
    throw new Error('App.web.tsx has user edits; refusing to overwrite.');

  const harnessPath = join(checkout, 'src/BlueprintWorkbench.tsx');
  const harnessSource = await readFile(
    join(root, 'examples/bluesky/BlueprintWorkbench.tsx'),
    'utf8',
  );
  const stampPath = join(checkout, '.blueprint-showcase.json');
  const stamp = existsSync(stampPath)
    ? JSON.parse(await readFile(stampPath, 'utf8'))
    : {};
  const hash = (text) => createHash('sha256').update(text).digest('hex');
  if (existsSync(harnessPath)) {
    const existing = await readFile(harnessPath, 'utf8');
    if (
      existing !== harnessSource &&
      hash(existing) !== stamp['src/BlueprintWorkbench.tsx']
    ) {
      throw new Error(
        'BlueprintWorkbench.tsx has user edits; refusing to overwrite.',
      );
    }
  }

  for (const name of ['core', 'react-native']) {
    const packageDir = join(root, 'packages', name);
    if (!existsSync(join(packageDir, 'dist/index.js')))
      throw new Error('Run yarn build:packages before preparing.');
    const target = join(checkout, 'node_modules/@react-native-blueprint', name);
    await mkdir(target, { recursive: true });
    await cp(join(packageDir, 'dist'), join(target, 'dist'), {
      recursive: true,
    });
    const pkg = JSON.parse(
      await readFile(join(packageDir, 'package.json'), 'utf8'),
    );
    if (pkg.dependencies)
      for (const key of Object.keys(pkg.dependencies)) {
        if (pkg.dependencies[key].startsWith('workspace:'))
          pkg.dependencies[key] = '0.1.0';
      }
    await writeFile(
      join(target, 'package.json'),
      JSON.stringify(pkg, null, 2) + '\n',
    );
  }
  await cp(
    join(root, 'examples/bluesky/BlueprintWorkbench.tsx'),
    join(checkout, 'src/BlueprintWorkbench.tsx'),
  );
  await writeFile(appPath, patched + '\n');
  await writeFile(
    stampPath,
    JSON.stringify(
      {
        'src/App.web.tsx': hash(patched + '\n'),
        'src/BlueprintWorkbench.tsx': hash(harnessSource),
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    'Prepared development-only ?blueprint harness with real upstream screens.',
  );
  console.log(
    'Install upstream dependencies, then rerun preparation (install may remove copied packages).',
  );
  console.log(
    'See examples/bluesky/README.md for launch and provider limitations.',
  );
}

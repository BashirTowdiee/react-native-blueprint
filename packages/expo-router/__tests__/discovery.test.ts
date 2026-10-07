import {
  discoverExpoRouterScreens,
  discoverExpoRouterScreensFromContext,
  type ExpoRouterRequireContext,
} from '../src';

const Home = () => null;
const Login = () => null;
const StoryList = () => null;
const Passage = () => null;
const Blueprint = () => null;

describe('Expo Router discovery', () => {
  it('discovers app and src/app routes while filtering layouts and special files', () => {
    const manifest = discoverExpoRouterScreens([
      { file: 'app/(app)/index.tsx', render: Home },
      { file: 'app/(auth)/login.tsx', render: Login },
      { file: 'src/app/(app)/story-list.tsx', render: StoryList },
      { file: 'app/_layout.tsx', render: Home },
      { file: 'app/+not-found.tsx', render: Home },
    ]);

    expect(manifest.map((screen) => screen.route?.pathname)).toEqual([
      '/',
      '/story-list',
      '/login',
    ]);
    expect(manifest.map((screen) => screen.name)).toEqual([
      'Home',
      'Story List',
      'Login',
    ]);
  });

  it('keeps route groups in stable ids but not in user-facing paths or labels', () => {
    const [screen] = discoverExpoRouterScreens([
      { file: 'app/(app)/passage/[id].tsx', render: Passage },
    ]);

    expect(screen.id).toBe('expo-router:(app)/passage/[id]');
    expect(screen.name).toBe('Passage');
    expect(screen.route?.pathname).toBe('/passage/[id]');
    expect(screen.metadata).toMatchObject({
      routeGroups: ['app'],
      dynamicSegments: ['id'],
      fixtureRequired: true,
      fixtureStatus: 'missing',
    });
  });

  it('creates deterministic variants for dynamic route fixtures', () => {
    const PassageOne = () => null;
    const PassageTwo = () => null;
    const [screen] = discoverExpoRouterScreens(
      [{ file: 'app/(app)/passage/[id].tsx', render: Passage }],
      {
        fixtures: {
          '/passage/[id]': [
            {
              id: 'journey',
              name: 'The Journey',
              params: { id: '1' },
              render: PassageOne,
              data: { title: 'The Journey' },
            },
            {
              id: 'city-dreams',
              name: 'City Dreams',
              params: { id: '2' },
              render: PassageTwo,
              context: { authenticated: true },
            },
          ],
        },
      },
    );

    expect(screen.metadata).toMatchObject({ fixtureStatus: 'ready' });
    expect(screen.variants).toHaveLength(2);
    expect(screen.variants?.[0]).toMatchObject({
      id: 'journey',
      name: 'The Journey',
      render: PassageOne,
      route: {
        pathname: '/passage/[id]',
        params: { id: '1' },
      },
      metadata: {
        fixtureData: { title: 'The Journey' },
      },
    });
  });

  it('surfaces invalid fixture params as metadata instead of throwing', () => {
    const [screen] = discoverExpoRouterScreens(
      [{ file: 'app/(app)/passage/[id].tsx', render: Passage }],
      {
        fixtures: {
          '/passage/[id]': [
            {
              id: 'missing-id',
              name: 'Missing id',
              params: {},
            },
          ],
        },
      },
    );

    expect(screen.variants).toBeUndefined();
    expect(screen.metadata).toMatchObject({
      fixtureStatus: 'invalid',
      fixtureIssues: ['missing-id is missing params: id.'],
    });
  });

  it('can exclude the Blueprint integration route', () => {
    const manifest = discoverExpoRouterScreens(
      [
        { file: './(app)/index.tsx', render: Home },
        { file: './(ide)/index.tsx', render: Blueprint },
      ],
      {
        excludeFiles: ['./(ide)/index.tsx'],
      },
    );

    expect(manifest).toHaveLength(1);
    expect(manifest[0].route?.pathname).toBe('/');
  });

  it('discovers default exports from a Metro-style require context', () => {
    const modules = new Map<string, { default: () => null }>([
      ['./(app)/index.tsx', { default: Home }],
      ['./(app)/story-list.tsx', { default: StoryList }],
    ]);
    const context = ((key: string) => modules.get(key)!) as
      ExpoRouterRequireContext<() => null>;
    context.keys = () => [...modules.keys()];

    const manifest = discoverExpoRouterScreensFromContext(context);

    expect(manifest.map((screen) => screen.name)).toEqual([
      'Home',
      'Story List',
    ]);
  });
});

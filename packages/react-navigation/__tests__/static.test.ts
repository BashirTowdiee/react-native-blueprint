import { createReactNavigationStaticManifest } from '../src';

const Home = () => null;
const Stories = () => null;
const Profile = () => null;
const Settings = () => null;

describe('React Navigation static adapter', () => {
  it('maps a static stack to the common Blueprint manifest', () => {
    const manifest = createReactNavigationStaticManifest({
      kind: 'stack',
      screens: {
        Home,
        Settings: {
          screen: Settings,
          label: 'App Settings',
          initialParams: { section: 'general' },
        },
      },
    });

    expect(manifest.map((screen) => screen.id)).toEqual([
      'react-navigation:Home',
      'react-navigation:Settings',
    ]);
    expect(manifest[1]).toMatchObject({
      name: 'App Settings',
      route: { params: { section: 'general' } },
    });
  });

  it('supports nested tab navigation with stable ids and navigator metadata', () => {
    const manifest = createReactNavigationStaticManifest({
      kind: 'stack',
      screens: {
        Home,
        Library: {
          kind: 'tab',
          screens: {
            Stories,
            UserProfile: Profile,
          },
        },
      },
    });

    expect(manifest.map((screen) => screen.id)).toEqual([
      'react-navigation:Home',
      'react-navigation:Library/Stories',
      'react-navigation:Library/UserProfile',
    ]);
    expect(manifest[1].metadata).toMatchObject({
      routeNames: ['Library', 'Stories'],
      navigatorKinds: ['stack', 'tab'],
      navigatorPath: 'Library/Stories',
    });
    expect(manifest[2].name).toBe('User Profile');
  });
});

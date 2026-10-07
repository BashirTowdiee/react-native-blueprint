import {
  BlueprintRegistryError,
  createBlueprintScreenRegistry,
  defineBlueprintScreen,
  type BlueprintScreen,
} from '../src';

const loginScreen = defineBlueprintScreen({
  id: 'login',
  name: 'Login',
  render: 'LoginComponent',
  route: {
    pathname: '/login',
    params: {
      source: 'blueprint',
    },
  },
  viewport: {
    width: 375,
    height: 667,
    name: 'Phone',
  },
  variants: [
    {
      id: 'filled',
      name: 'Filled form',
      metadata: {
        fixture: 'filled',
      },
    },
  ],
});

describe('createBlueprintScreenRegistry', () => {
  it('registers and lists screens in insertion order', () => {
    const registry = createBlueprintScreenRegistry([loginScreen]);
    const storyScreen: BlueprintScreen<string> = {
      id: 'stories',
      name: 'Stories',
      render: 'StoryComponent',
    };

    registry.register(storyScreen);

    expect(registry.size).toBe(2);
    expect(registry.get('login')).toBe(loginScreen);
    expect(registry.list().map((screen) => screen.id)).toEqual([
      'login',
      'stories',
    ]);
    expect(registry.get('login')?.route?.params).toEqual({
      source: 'blueprint',
    });
  });

  it('rejects duplicate ids without partially mutating a batch', () => {
    const registry = createBlueprintScreenRegistry([loginScreen]);

    expect(() =>
      registry.registerMany([
        {
          id: 'settings',
          name: 'Settings',
          render: 'SettingsComponent',
        },
        {
          id: 'login',
          name: 'Duplicate login',
          render: 'OtherLoginComponent',
        },
      ]),
    ).toThrow(BlueprintRegistryError);

    expect(registry.has('settings')).toBe(false);
    expect(registry.size).toBe(1);
  });

  it('supports intentional replacement and removal', () => {
    const registry = createBlueprintScreenRegistry([loginScreen]);

    registry.register(
      {
        id: 'login',
        name: 'Updated login',
        render: 'UpdatedLoginComponent',
      },
      {
        replace: true,
      },
    );

    expect(registry.get('login')?.name).toBe('Updated login');
    expect(registry.unregister('login')).toBe(true);
    expect(registry.size).toBe(0);
  });

  it('validates viewport dimensions and variant ids', () => {
    expect(() =>
      defineBlueprintScreen({
        id: 'invalid',
        name: 'Invalid',
        render: 'InvalidComponent',
        viewport: {
          width: 0,
          height: 667,
        },
      }),
    ).toThrow(BlueprintRegistryError);

    expect(() =>
      defineBlueprintScreen({
        id: 'duplicate-variants',
        name: 'Duplicate variants',
        render: 'VariantComponent',
        variants: [
          {
            id: 'default',
            name: 'Default',
          },
          {
            id: 'default',
            name: 'Duplicate',
          },
        ],
      }),
    ).toThrow(BlueprintRegistryError);
  });
});

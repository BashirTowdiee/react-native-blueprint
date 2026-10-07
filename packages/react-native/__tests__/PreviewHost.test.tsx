import React from 'react';
import {
  Text,
  View,
} from 'react-native';
import renderer, {
  act,
  type ReactTestRenderer,
} from 'react-test-renderer';

import {
  BlueprintPreviewHost,
  resolveReactNativePreviewWrappers,
  type ReactNativeBlueprintScreen,
  type ReactNativePreviewProviderConfig,
  type ReactNativePreviewRenderer,
  type ReactNativePreviewWrapper,
} from '../src';

function NormalScreen() {
  return <Text testID="normal-screen">Normal screen</Text>;
}

function VariantScreen() {
  return <Text testID="variant-screen">Variant screen</Text>;
}

const normalScreen: ReactNativeBlueprintScreen = {
  id: 'normal',
  name: 'Normal',
  render: NormalScreen,
};

describe('BlueprintPreviewHost', () => {
  it('renders a normal React Native component without Blueprint props', () => {
    let view!: ReactTestRenderer;

    act(() => {
      view = renderer.create(
        <BlueprintPreviewHost
          screen={normalScreen}
          wrapPreview={(preview) => (
            <View testID="preview-wrapper">{preview}</View>
          )}
        />,
      );
    });

    expect(view.root.findByProps({ testID: 'normal-screen' })).toBeDefined();
    expect(view.root.findByProps({ testID: 'preview-wrapper' })).toBeDefined();
  });

  it('renders a variant-specific component when the common manifest supplies one', () => {
    let view!: ReactTestRenderer;

    act(() => {
      view = renderer.create(
        <BlueprintPreviewHost
          screen={normalScreen}
          variant={{
            id: 'fixture-one',
            name: 'Fixture one',
            render: VariantScreen,
            route: {
              params: { id: '1' },
            },
          }}
        />,
      );
    });

    expect(view.root.findByProps({ testID: 'variant-screen' })).toBeDefined();
  });

  it('composes root, screen and variant providers in documented order', () => {
    const rootWrapper: ReactNativePreviewWrapper = (preview) => (
      <View testID="root-provider">{preview}</View>
    );
    const screenWrapper: ReactNativePreviewWrapper = (preview) => (
      <View testID="screen-provider">{preview}</View>
    );
    const variantWrapper: ReactNativePreviewWrapper = (preview, context) => (
      <View
        testID="variant-provider"
        accessibilityLabel={context.variant?.id}
      >
        {preview}
      </View>
    );
    const providers: ReactNativePreviewProviderConfig = {
      root: [rootWrapper],
      screens: {
        normal: {
          wrappers: [screenWrapper],
          variants: {
            fixture: {
              wrappers: [variantWrapper],
            },
          },
        },
      },
    };

    let view!: ReactTestRenderer;

    act(() => {
      view = renderer.create(
        <BlueprintPreviewHost
          screen={normalScreen}
          variant={{
            id: 'fixture',
            name: 'Fixture',
            render: VariantScreen,
          }}
          providers={providers}
        />,
      );
    });

    const root = view.root.findByProps({ testID: 'root-provider' });
    const screen = view.root.findByProps({ testID: 'screen-provider' });
    const variant = view.root.findByProps({ testID: 'variant-provider' });

    expect(root.findByProps({ testID: 'screen-provider' })).toBe(screen);
    expect(screen.findByProps({ testID: 'variant-provider' })).toBe(variant);
    expect(variant.props.accessibilityLabel).toBe('fixture');
    expect(variant.findByProps({ testID: 'variant-screen' })).toBeDefined();
  });

  it('supports replacement and avoids mounting the same provider twice', () => {
    const duplicatedWrapper: ReactNativePreviewWrapper = (preview) => (
      <View testID="duplicated-provider">{preview}</View>
    );
    const replacementWrapper: ReactNativePreviewWrapper = (preview) => (
      <View testID="replacement-provider">{preview}</View>
    );

    expect(
      resolveReactNativePreviewWrappers(
        {
          root: [duplicatedWrapper],
          screens: {
            normal: {
              wrappers: [duplicatedWrapper],
            },
          },
        },
        normalScreen,
      ),
    ).toEqual([duplicatedWrapper]);

    let view!: ReactTestRenderer;

    act(() => {
      view = renderer.create(
        <BlueprintPreviewHost
          screen={normalScreen}
          providers={{
            root: [duplicatedWrapper],
            screens: {
              normal: {
                wrappers: [duplicatedWrapper],
                variants: {
                  replacement: {
                    mode: 'replace',
                    wrappers: [replacementWrapper],
                  },
                },
              },
            },
          }}
          variant={{
            id: 'replacement',
            name: 'Replacement',
          }}
        />,
      );
    });

    expect(
      view.root.findAllByProps({ testID: 'duplicated-provider' }),
    ).toHaveLength(0);
    expect(
      view.root.findByProps({ testID: 'replacement-provider' }),
    ).toBeDefined();
  });

  it('isolates provider failures to the affected preview', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const brokenWrapper: ReactNativePreviewWrapper = () => {
      throw new Error('Provider failed');
    };

    let view!: ReactTestRenderer;

    try {
      act(() => {
        view = renderer.create(
          <View>
            <BlueprintPreviewHost
              screen={normalScreen}
              providers={{ root: [brokenWrapper] }}
            />
            <BlueprintPreviewHost screen={normalScreen} />
          </View>,
        );
      });

      expect(
        view.root.findByProps({ testID: 'blueprint-preview-error-normal' }),
      ).toBeDefined();
      expect(
        view.root.findByProps({ testID: 'normal-screen' }),
      ).toBeDefined();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('renders loading and unsupported states from a replaceable renderer', () => {
    const loadingRenderer: ReactNativePreviewRenderer = {
      render() {
        return {
          status: 'loading',
          message: 'Preparing preview',
        };
      },
    };
    const unsupportedRenderer: ReactNativePreviewRenderer = {
      render() {
        return {
          status: 'unsupported',
          message: 'Adapter cannot render this screen',
        };
      },
    };

    let loadingView!: ReactTestRenderer;
    let unsupportedView!: ReactTestRenderer;

    act(() => {
      loadingView = renderer.create(
        <BlueprintPreviewHost
          screen={normalScreen}
          renderer={loadingRenderer}
        />,
      );
      unsupportedView = renderer.create(
        <BlueprintPreviewHost
          screen={normalScreen}
          renderer={unsupportedRenderer}
        />,
      );
    });

    expect(
      loadingView.root.findByProps({
        testID: 'blueprint-preview-loading-normal',
      }),
    ).toBeDefined();
    expect(
      unsupportedView.root.findByProps({
        testID: 'blueprint-preview-unsupported-normal',
      }),
    ).toBeDefined();
  });

  it('isolates a failed preview without taking down sibling previews', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    function BrokenScreen() {
      throw new Error('Broken preview');
    }

    const brokenScreen: ReactNativeBlueprintScreen = {
      id: 'broken',
      name: 'Broken',
      render: BrokenScreen,
    };

    let view!: ReactTestRenderer;

    try {
      act(() => {
        view = renderer.create(
          <View>
            <BlueprintPreviewHost screen={brokenScreen} />
            <BlueprintPreviewHost screen={normalScreen} />
          </View>,
        );
      });

      expect(
        view.root.findByProps({
          testID: 'blueprint-preview-error-broken',
        }),
      ).toBeDefined();
      expect(view.root.findByProps({ testID: 'normal-screen' })).toBeDefined();
    } finally {
      consoleError.mockRestore();
    }
  });

  it('renders an isolated error state returned by a preview renderer', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const failedRenderer: ReactNativePreviewRenderer = {
      render() {
        return {
          status: 'error',
          error: new Error('Adapter preview failed'),
        };
      },
    };

    let view!: ReactTestRenderer;

    try {
      act(() => {
        view = renderer.create(
          <BlueprintPreviewHost
            screen={normalScreen}
            renderer={failedRenderer}
          />,
        );
      });

      expect(
        view.root.findByProps({
          testID: 'blueprint-preview-error-normal',
        }),
      ).toBeDefined();
    } finally {
      consoleError.mockRestore();
    }
  });
});

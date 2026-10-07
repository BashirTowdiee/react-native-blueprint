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
  type ReactNativeBlueprintScreen,
  type ReactNativePreviewRenderer,
} from '../src';

function NormalScreen() {
  return <Text testID="normal-screen">Normal screen</Text>;
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

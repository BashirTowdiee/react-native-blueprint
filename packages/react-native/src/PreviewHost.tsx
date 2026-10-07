import React, {
  Component,
  createElement,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type {
  BlueprintPreviewRenderer,
  BlueprintScreen,
  BlueprintVariant,
} from '@react-native-blueprint/core';

export type ReactNativeBlueprintScreen =
  BlueprintScreen<ComponentType<any>>;

export type ReactNativePreviewRenderer = BlueprintPreviewRenderer<
  ComponentType<any>,
  ReactNode
>;

export type ReactNativePreviewContext = {
  screen: ReactNativeBlueprintScreen;
  variant?: BlueprintVariant<ComponentType<any>>;
};

export type ReactNativePreviewWrapper = (
  preview: ReactNode,
  context: ReactNativePreviewContext,
) => ReactNode;

export type ReactNativePreviewWrapperSet = {
  wrappers: readonly ReactNativePreviewWrapper[];
  mode?: 'append' | 'replace';
};

export type ReactNativePreviewProviderConfig = {
  root?: readonly ReactNativePreviewWrapper[];
  screens?: Readonly<
    Record<
      string,
      ReactNativePreviewWrapperSet & {
        variants?: Readonly<Record<string, ReactNativePreviewWrapperSet>>;
      }
    >
  >;
};

export type BlueprintPreviewHostProps = {
  screen: ReactNativeBlueprintScreen;
  variant?: BlueprintVariant<ComponentType<any>>;
  renderer?: ReactNativePreviewRenderer;
  providers?: ReactNativePreviewProviderConfig;
  wrapPreview?: (
    preview: ReactNode,
    screen: ReactNativeBlueprintScreen,
  ) => ReactNode;
  loadingFallback?: (
    screen: ReactNativeBlueprintScreen,
    message?: string,
  ) => ReactNode;
  unsupportedFallback?: (
    screen: ReactNativeBlueprintScreen,
    message?: string,
  ) => ReactNode;
  errorFallback?: (
    screen: ReactNativeBlueprintScreen,
    error: Error,
  ) => ReactNode;
  onError?: (
    screen: ReactNativeBlueprintScreen,
    error: Error,
    info: ErrorInfo,
  ) => void;
};

export const defaultReactNativePreviewRenderer: ReactNativePreviewRenderer = {
  render({ screen, variant }) {
    return {
      status: 'ready',
      output: createElement(variant?.render ?? screen.render),
    };
  },
};

export function resolveReactNativePreviewWrappers(
  providers: ReactNativePreviewProviderConfig | undefined,
  screen: ReactNativeBlueprintScreen,
  variant?: BlueprintVariant<ComponentType<any>>,
): readonly ReactNativePreviewWrapper[] {
  if (!providers) {
    return [];
  }

  let wrappers = [...(providers.root ?? [])];
  const screenConfig = providers.screens?.[screen.id];

  if (screenConfig) {
    wrappers =
      screenConfig.mode === 'replace'
        ? [...screenConfig.wrappers]
        : [...wrappers, ...screenConfig.wrappers];

    const variantConfig = variant
      ? screenConfig.variants?.[variant.id]
      : undefined;

    if (variantConfig) {
      wrappers =
        variantConfig.mode === 'replace'
          ? [...variantConfig.wrappers]
          : [...wrappers, ...variantConfig.wrappers];
    }
  }

  return wrappers.filter(
    (wrapper, index) => wrappers.indexOf(wrapper) === index,
  );
}

export function composeReactNativePreviewWrappers(
  preview: ReactNode,
  wrappers: readonly ReactNativePreviewWrapper[],
  context: ReactNativePreviewContext,
): ReactNode {
  return wrappers.reduceRight(
    (wrappedPreview, wrapper) => wrapper(wrappedPreview, context),
    preview,
  );
}

export function BlueprintPreviewHost({
  screen,
  variant,
  renderer = defaultReactNativePreviewRenderer,
  providers,
  wrapPreview,
  loadingFallback = defaultLoadingFallback,
  unsupportedFallback = defaultUnsupportedFallback,
  errorFallback = defaultErrorFallback,
  onError,
}: BlueprintPreviewHostProps) {
  return (
    <PreviewErrorBoundary
      resetKey={`${screen.id}:${variant?.id ?? 'default'}`}
      screen={screen}
      errorFallback={errorFallback}
      onError={onError}
    >
      <PreviewContent
        screen={screen}
        variant={variant}
        renderer={renderer}
        providers={providers}
        wrapPreview={wrapPreview}
        loadingFallback={loadingFallback}
        unsupportedFallback={unsupportedFallback}
      />
    </PreviewErrorBoundary>
  );
}

type PreviewContentProps = Pick<
  BlueprintPreviewHostProps,
  | 'screen'
  | 'variant'
  | 'renderer'
  | 'providers'
  | 'wrapPreview'
  | 'loadingFallback'
  | 'unsupportedFallback'
> & {
  renderer: ReactNativePreviewRenderer;
  loadingFallback: NonNullable<BlueprintPreviewHostProps['loadingFallback']>;
  unsupportedFallback: NonNullable<
    BlueprintPreviewHostProps['unsupportedFallback']
  >;
};

function PreviewContent({
  screen,
  variant,
  renderer,
  providers,
  wrapPreview,
  loadingFallback,
  unsupportedFallback,
}: PreviewContentProps) {
  const result = renderer.render({
    screen,
    variant,
  });

  if (result.status === 'loading') {
    return loadingFallback(screen, result.message);
  }

  if (result.status === 'unsupported') {
    return unsupportedFallback(screen, result.message);
  }

  if (result.status === 'error') {
    throw toError(result.error, result.message);
  }

  const context: ReactNativePreviewContext = {
    screen,
    ...(variant ? { variant } : {}),
  };
  const wrappers = resolveReactNativePreviewWrappers(
    providers,
    screen,
    variant,
  );
  const preview = composeReactNativePreviewWrappers(
    result.output,
    wrappers,
    context,
  );

  return wrapPreview ? wrapPreview(preview, screen) : preview;
}

type PreviewErrorBoundaryProps = {
  resetKey: string;
  screen: ReactNativeBlueprintScreen;
  errorFallback: NonNullable<BlueprintPreviewHostProps['errorFallback']>;
  onError?: BlueprintPreviewHostProps['onError'];
  children: ReactNode;
};

type PreviewErrorBoundaryState = {
  error: Error | null;
};

class PreviewErrorBoundary extends Component<
  PreviewErrorBoundaryProps,
  PreviewErrorBoundaryState
> {
  state: PreviewErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): PreviewErrorBoundaryState {
    return {
      error,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(this.props.screen, error, info);
  }

  componentDidUpdate(previousProps: PreviewErrorBoundaryProps) {
    if (
      previousProps.resetKey !== this.props.resetKey &&
      this.state.error !== null
    ) {
      this.setState({
        error: null,
      });
    }
  }

  render() {
    if (this.state.error) {
      return this.props.errorFallback(
        this.props.screen,
        this.state.error,
      );
    }

    return this.props.children;
  }
}

function defaultLoadingFallback(
  screen: ReactNativeBlueprintScreen,
  message?: string,
) {
  return (
    <View
      style={styles.state}
      testID={`blueprint-preview-loading-${screen.id}`}
    >
      <Text style={styles.stateText}>
        {message ?? `Loading ${screen.name}…`}
      </Text>
    </View>
  );
}

function defaultUnsupportedFallback(
  screen: ReactNativeBlueprintScreen,
  message?: string,
) {
  return (
    <View
      style={styles.state}
      testID={`blueprint-preview-unsupported-${screen.id}`}
    >
      <Text style={styles.stateText}>
        {message ?? `Preview unavailable for ${screen.name}`}
      </Text>
    </View>
  );
}

function defaultErrorFallback(
  screen: ReactNativeBlueprintScreen,
  error: Error,
) {
  return (
    <View
      style={styles.errorState}
      testID={`blueprint-preview-error-${screen.id}`}
    >
      <Text style={styles.errorTitle}>
        {'Failed to preview ' + screen.name}
      </Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
    </View>
  );
}

function toError(error: unknown, message?: string): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(message ?? String(error));
}

const styles = StyleSheet.create({
  state: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  stateText: {
    textAlign: 'center',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorTitle: {
    fontWeight: '600',
    textAlign: 'center',
  },
  errorMessage: {
    marginTop: 4,
    textAlign: 'center',
  },
});

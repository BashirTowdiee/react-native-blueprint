import React, { type ComponentType, useMemo } from 'react';

import { createBlueprintScreenRegistry } from '@react-native-blueprint/core';
import {
  BlueprintPreviewHost,
  BlueprintView,
  type ReactNativeBlueprintScreen,
} from '@react-native-blueprint/react-native';

import LoginScreen from '../../components/LoginScreen';
import PassageScreen from '../../components/PassageScreen';
import StoryListScreen from '../../components/StoryListScreen';
import StudyScreen from '../../components/StudyScreen';
import {
  AppNavigationProvider,
  type AppNavigation,
} from '../../hooks/useAppNavigation';

const previewNavigation: AppNavigation = {
  push() {},
  back() {},
};

function PassagePreview() {
  return <PassageScreen passageId="1" />;
}

function StudyPreview() {
  return <StudyScreen passageId="1" />;
}

const registry = createBlueprintScreenRegistry<ComponentType<any>>([
  {
    id: 'login',
    name: 'Login',
    render: LoginScreen,
  },
  {
    id: 'story-list',
    name: 'Story List',
    render: StoryListScreen,
  },
  {
    id: 'passage',
    name: 'Passage',
    render: PassagePreview,
    route: {
      pathname: '/passage/[id]',
      params: { id: '1' },
    },
  },
  {
    id: 'study',
    name: 'Study',
    render: StudyPreview,
    route: {
      pathname: '/study/[id]',
      params: { id: '1' },
    },
  },
]);

export default function BlueprintRoute() {
  const artboards = useMemo(
    () =>
      registry.list().map((screen) => ({
        id: screen.id,
        label: screen.name,
        width: screen.viewport?.width,
        height: screen.viewport?.height,
        content: (
          <BlueprintPreviewHost
            screen={screen as ReactNativeBlueprintScreen}
            wrapPreview={(preview) => (
              <AppNavigationProvider navigation={previewNavigation}>
                {preview}
              </AppNavigationProvider>
            )}
          />
        ),
      })),
    [],
  );

  return <BlueprintView artboards={artboards} />;
}

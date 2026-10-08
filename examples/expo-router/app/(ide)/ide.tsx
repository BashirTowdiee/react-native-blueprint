import React, { useMemo } from 'react';
import { Redirect } from 'expo-router';
import { socialManifest } from '../../showcase/SocialApp';
import { SocialNavigationApp } from '../../showcase/SocialNavigationApp';
import { socialInspection } from '../../showcase/inspectionConfig';
import { socialFlow } from '../../showcase/SocialFlow';
import {
  BlueprintPreviewHost,
  BlueprintWorkspace,
} from '@react-native-blueprint/react-native';
import { isBlueprintDevelopmentEnabled } from '@react-native-blueprint/react-native/dev';

export default function BlueprintRoute() {
  return isBlueprintDevelopmentEnabled() ? (
    <BlueprintCanvas />
  ) : (
    <Redirect href="/" />
  );
}

function BlueprintCanvas() {
  const artboards = useMemo(
    () =>
      socialManifest.map((screen) => ({
        id: screen.id,
        label: String(screen.metadata?.fixture ?? 'Default'),
        groupId: screen.name,
        groupLabel: screen.name,
        viewport: screen.viewport,
        metadata: { ...screen.metadata, route: screen.route },
        content: <BlueprintPreviewHost screen={screen} />,
      })),
    [],
  );

  return (
    <BlueprintWorkspace
      applicationName="Open Social"
      application={<SocialNavigationApp />}
      flow={socialFlow}
      applicationViewport={{ width: 390, height: 844, name: 'Standard phone' }}
      artboards={artboards}
      previewProps={{
        initialZoom: 0.65,
        inspection: socialInspection,
        minZoom: 0.08,
      }}
    />
  );
}

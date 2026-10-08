import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type {
  BlueprintRoute,
  BlueprintViewport,
} from '@react-native-blueprint/core';
import {
  BlueprintView,
  type BlueprintArtboardDefinition,
  type BlueprintViewProps,
} from './BlueprintView';
import { serializeBlueprintData } from './dataTools';
import {
  BlueprintNavigationFlow,
  type BlueprintNavigationFlowConfig,
} from './BlueprintNavigationFlow';

export type BlueprintWorkspaceMode =
  'navigation' | 'all-screens' | 'navigation-flow';
export type BlueprintNavigationRoute = BlueprintRoute & { name: string };
type RouteReporter = (route: BlueprintNavigationRoute) => void;
const NavigationReporter = createContext<RouteReporter | undefined>(undefined);
const ignoreRoute: RouteReporter = () => {};

/** Observe the application's navigator; this never navigates or mounts screens. */
export function useBlueprintNavigationReporter(): RouteReporter {
  return useContext(NavigationReporter) ?? ignoreRoute;
}

export type BlueprintWorkspaceProps = {
  artboards: readonly BlueprintArtboardDefinition[];
  /** One application root, including its own navigator and providers. */
  application: ReactNode;
  applicationName?: string;
  applicationViewport?: BlueprintViewport;
  flow?: BlueprintNavigationFlowConfig;
  mode?: BlueprintWorkspaceMode;
  defaultMode?: BlueprintWorkspaceMode;
  onModeChange?: (mode: BlueprintWorkspaceMode) => void;
  previewProps?: Omit<
    BlueprintViewProps,
    'artboards' | 'selectedArtboardId' | 'onSelectArtboard'
  >;
  style?: StyleProp<ViewStyle>;
};

export function BlueprintWorkspace({
  artboards,
  application,
  applicationName = 'Application',
  applicationViewport,
  flow,
  mode,
  defaultMode = 'navigation',
  onModeChange,
  previewProps,
  style,
}: BlueprintWorkspaceProps) {
  const [localMode, setLocalMode] = useState(defaultMode);
  const activeMode = mode ?? localMode;
  const selectMode = (next: BlueprintWorkspaceMode) => {
    if (next === activeMode) return;
    if (mode === undefined) setLocalMode(next);
    onModeChange?.(next);
  };

  const header = (
    <View style={styles.toolbar}>
      <Text style={styles.title}>{applicationName}</Text>
      {(['navigation', 'navigation-flow', 'all-screens'] as const).map(
        (option) => (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityHint="Switching modes starts a fresh session."
            accessibilityLabel={
              option === 'navigation'
                ? 'Navigation mode'
                : option === 'navigation-flow'
                  ? 'Navigation flow mode'
                  : 'All screens mode'
            }
            disabled={option === 'navigation-flow' && !flow}
            accessibilityState={{
              selected: activeMode === option,
              disabled: option === 'navigation-flow' && !flow,
            }}
            testID={`blueprint-mode-${option}`}
            onPress={() => selectMode(option)}
            style={[styles.mode, activeMode === option && styles.selectedMode]}
          >
            <Text style={styles.modeText}>
              {option === 'navigation'
                ? 'Navigation'
                : option === 'navigation-flow'
                  ? 'Navigation flow'
                  : 'All screens'}
            </Text>
          </Pressable>
        ),
      )}
    </View>
  );

  return (
    <View style={[styles.workspace, style]}>
      {activeMode === 'navigation' ? (
        <NavigationSession
          application={application}
          name={applicationName}
          toolbarContent={header}
          viewport={applicationViewport}
          previewProps={previewProps}
        />
      ) : activeMode === 'navigation-flow' ? (
        flow ? (
          <BlueprintNavigationFlow
            configuration={flow}
            toolbarContent={header}
            viewport={applicationViewport}
            previewProps={previewProps}
          />
        ) : (
          <Text style={styles.explanation}>
            Supply a navigation flow integration to use this mode.
          </Text>
        )
      ) : (
        <View style={styles.workspace}>
          <BlueprintView
            artboardAppearance="flow"
            {...previewProps}
            artboards={artboards}
            toolbarContent={header}
            toolbarStatus={
              <Text style={styles.hint}>
                {artboards.length} mounted previews
              </Text>
            }
          />
        </View>
      )}
    </View>
  );
}

function NavigationSession({
  toolbarContent,
  application,
  name,
  viewport,
  previewProps,
}: {
  toolbarContent: ReactNode;
  application: ReactNode;
  name: string;
  viewport?: BlueprintViewport;
  previewProps?: BlueprintWorkspaceProps['previewProps'];
}) {
  const [routeData, setRouteData] = useState<string>();
  const reportRoute = useCallback<RouteReporter>((route) => {
    // Only retain bounded, redacted route data in the development inspector.
    setRouteData(serializeBlueprintData(route));
  }, []);
  const route = useMemo(
    () => (routeData ? JSON.parse(routeData) : undefined),
    [routeData],
  );
  const content = useMemo(
    () => (
      <NavigationReporter.Provider value={reportRoute}>
        {application}
      </NavigationReporter.Provider>
    ),
    [application, reportRoute],
  );
  const boards = useMemo<readonly BlueprintArtboardDefinition[]>(
    () => [
      {
        // A stable ID and component tree preserve navigator state across route reports.
        id: 'blueprint-application',
        label: name,
        viewport,
        metadata: { mode: 'navigation', activeRoute: route ?? null },
        content,
      },
    ],
    [name, viewport, route, content],
  );

  return (
    <View style={styles.workspace}>
      <BlueprintView
        artboardAppearance="flow"
        {...previewProps}
        artboards={boards}
        toolbarContent={toolbarContent}
        toolbarStatus={
          <Text
            numberOfLines={1}
            style={styles.hint}
            testID="blueprint-navigation-status"
          >
            Live · {route?.name ?? 'Waiting for app navigation'}
          </Text>
        }
        defaultSelectedArtboardId="blueprint-application"
        showNavigator={false}
        showFocusControl={false}
        refreshLabel="Restart app"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  workspace: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  title: { color: '#4dd9b4', fontWeight: '600', marginRight: 8 },
  mode: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 5,
    backgroundColor: '#1b2a3c',
  },
  selectedMode: { backgroundColor: '#24535d' },
  modeText: { color: '#edf4ff', fontSize: 11 },
  hint: { color: '#93a9c3', fontSize: 12 },
  explanation: {
    color: '#93a9c3',
    backgroundColor: '#101c2b',
    padding: 10,
    fontSize: 12,
  },
});

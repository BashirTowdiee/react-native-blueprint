import React, { type ReactNode } from 'react';

declare const __DEV__: boolean | undefined;

export type BlueprintDevelopmentGuardProps = {
  children: ReactNode;
  fallback?: ReactNode;
  enabled?: boolean;
};

export function isBlueprintDevelopmentEnabled(
  enabled?: boolean,
): boolean {
  if (enabled !== undefined) {
    return enabled;
  }

  return typeof __DEV__ !== 'undefined' && __DEV__;
}

export function BlueprintDevelopmentGuard({
  children,
  fallback = null,
  enabled,
}: BlueprintDevelopmentGuardProps) {
  return (
    <>
      {isBlueprintDevelopmentEnabled(enabled)
        ? children
        : fallback}
    </>
  );
}

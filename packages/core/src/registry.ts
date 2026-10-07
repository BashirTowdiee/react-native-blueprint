import type {
  BlueprintScreen,
  BlueprintScreenManifest,
  BlueprintVariant,
  BlueprintViewport,
} from './types';

export type BlueprintRegisterOptions = {
  replace?: boolean;
};

export interface BlueprintScreenRegistry<TRender = unknown> {
  readonly size: number;
  register(
    screen: BlueprintScreen<TRender>,
    options?: BlueprintRegisterOptions,
  ): void;
  registerMany(
    screens: Iterable<BlueprintScreen<TRender>>,
    options?: BlueprintRegisterOptions,
  ): void;
  unregister(id: string): boolean;
  get(id: string): BlueprintScreen<TRender> | undefined;
  has(id: string): boolean;
  list(): BlueprintScreenManifest<TRender>;
  clear(): void;
}

export class BlueprintRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlueprintRegistryError';
  }
}

export function defineBlueprintScreen<TRender>(
  screen: BlueprintScreen<TRender>,
): BlueprintScreen<TRender> {
  assertScreen(screen);
  return screen;
}

export function createBlueprintScreenRegistry<TRender = unknown>(
  initialScreens: Iterable<BlueprintScreen<TRender>> = [],
): BlueprintScreenRegistry<TRender> {
  const screens = new Map<string, BlueprintScreen<TRender>>();

  const registerMany = (
    values: Iterable<BlueprintScreen<TRender>>,
    options: BlueprintRegisterOptions = {},
  ) => {
    const candidates = Array.from(values);
    const candidateIds = new Set<string>();

    for (const screen of candidates) {
      assertScreen(screen);

      if (candidateIds.has(screen.id)) {
        throw new BlueprintRegistryError(
          `Duplicate Blueprint screen id "${screen.id}" in registration batch.`,
        );
      }

      if (!options.replace && screens.has(screen.id)) {
        throw new BlueprintRegistryError(
          `Blueprint screen id "${screen.id}" is already registered.`,
        );
      }

      candidateIds.add(screen.id);
    }

    for (const screen of candidates) {
      screens.set(screen.id, screen);
    }
  };

  const registry: BlueprintScreenRegistry<TRender> = {
    get size() {
      return screens.size;
    },
    register(screen, options) {
      registerMany([screen], options);
    },
    registerMany,
    unregister(id) {
      return screens.delete(id);
    },
    get(id) {
      return screens.get(id);
    },
    has(id) {
      return screens.has(id);
    },
    list() {
      return Array.from(screens.values());
    },
    clear() {
      screens.clear();
    },
  };

  registerMany(initialScreens);
  return registry;
}

function assertScreen<TRender>(screen: BlueprintScreen<TRender>): void {
  assertText(screen.id, 'screen id');
  assertText(screen.name, 'screen name');

  if (screen.viewport) {
    assertViewport(screen.viewport, 'screen viewport');
  }

  if (screen.variants) {
    assertVariants(screen.variants);
  }
}

function assertVariants(variants: readonly BlueprintVariant[]): void {
  const ids = new Set<string>();

  for (const variant of variants) {
    assertText(variant.id, 'variant id');
    assertText(variant.name, 'variant name');

    if (ids.has(variant.id)) {
      throw new BlueprintRegistryError(
        `Duplicate Blueprint variant id "${variant.id}".`,
      );
    }

    ids.add(variant.id);

    if (variant.viewport) {
      assertViewport(variant.viewport, 'variant viewport');
    }
  }
}

function assertViewport(viewport: BlueprintViewport, label: string): void {
  if (!Number.isFinite(viewport.width) || viewport.width <= 0) {
    throw new BlueprintRegistryError(
      `${label} width must be a positive finite number.`,
    );
  }

  if (!Number.isFinite(viewport.height) || viewport.height <= 0) {
    throw new BlueprintRegistryError(
      `${label} height must be a positive finite number.`,
    );
  }
}

function assertText(value: string, label: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BlueprintRegistryError(`${label} must be a non-empty string.`);
  }
}

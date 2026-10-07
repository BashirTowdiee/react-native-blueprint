import {
  createReduxInspectorPlugin,
  createReduxInspectorTool,
} from '../src';

describe('Redux inspector plugin', () => {
  it('reads selected Redux state without importing Redux runtime code', () => {
    const store = {
      getState: () => ({
        auth: { user: 'Bash' },
        ignored: true,
      }),
      subscribe: () => () => undefined,
    };

    const tool = createReduxInspectorTool({
      store,
      select: (state) => state.auth,
    });

    expect(tool.getSnapshot()).toEqual({ user: 'Bash' });
    expect(createReduxInspectorPlugin({ store }).tools).toHaveLength(1);
  });

  it('forwards store subscriptions', () => {
    const unsubscribe = jest.fn();
    const subscribe = jest.fn(() => unsubscribe);
    const listener = jest.fn();
    const tool = createReduxInspectorTool({
      store: {
        getState: () => ({}),
        subscribe,
      },
    });

    expect(tool.subscribe?.(listener)).toBe(unsubscribe);
    expect(subscribe).toHaveBeenCalledWith(listener);
  });
});

import {
  createTokenInspectorPlugin,
  createTokenInspectorTool,
} from '../src';

describe('Design-token inspector plugin', () => {
  it('reads tokens from an explicit source', () => {
    const source = {
      getTokens: () => ({
        colours: {
          primary: '#123456',
        },
      }),
    };

    const tool = createTokenInspectorTool({ source });

    expect(tool.getSnapshot()).toEqual({
      colours: {
        primary: '#123456',
      },
    });
    expect(createTokenInspectorPlugin({ source }).tools).toHaveLength(1);
  });

  it('updates tokens only through the supplied update interface', async () => {
    const updateToken = jest.fn();
    const tool = createTokenInspectorTool({
      source: {
        getTokens: () => ({}),
        updateToken,
      },
    });

    await tool.update?.({
      path: ['colours', 'primary'],
      value: '#abcdef',
    });

    expect(updateToken).toHaveBeenCalledWith(
      ['colours', 'primary'],
      '#abcdef',
    );
  });
});

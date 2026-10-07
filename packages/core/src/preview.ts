import type {
  BlueprintScreen,
  BlueprintVariant,
} from './types';

export type BlueprintPreviewRequest<TRender = unknown> = {
  screen: BlueprintScreen<TRender>;
  variant?: BlueprintVariant;
};

export type BlueprintPreviewResult<TOutput = unknown> =
  | {
      status: 'ready';
      output: TOutput;
    }
  | {
      status: 'loading';
      message?: string;
    }
  | {
      status: 'unsupported';
      message?: string;
    }
  | {
      status: 'error';
      error: unknown;
      message?: string;
    };

export interface BlueprintPreviewRenderer<
  TRender = unknown,
  TOutput = unknown,
> {
  render(
    request: BlueprintPreviewRequest<TRender>,
  ): BlueprintPreviewResult<TOutput>;
}

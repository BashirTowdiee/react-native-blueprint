import type { BlueprintDevToolsConnection } from './dist/inspectionSources';
declare function connectBlueprintDevTools(backend: {
  connectWithCustomMessagingProtocol(options: {
    onSubscribe(listener: (message: unknown) => void): void;
    onUnsubscribe(listener: (message: unknown) => void): void;
    onMessage(event: string, payload: unknown): void;
  }): () => void;
}, options: { createWebSocket(): WebSocket; open(): void; readyMessage?: string }): BlueprintDevToolsConnection & { dispose(): void };
export { connectBlueprintDevTools };

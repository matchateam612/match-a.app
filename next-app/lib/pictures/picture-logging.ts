import "server-only";

type PictureLogMetadata = Record<string, unknown>;

export function logPictureError(message: string, error: unknown, metadata?: PictureLogMetadata) {
  console.error(`[pictures] ${message}`, {
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
    metadata,
  });
}

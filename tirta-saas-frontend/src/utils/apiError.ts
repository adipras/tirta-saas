interface ErrorResponseData {
  message?: unknown;
  error?: unknown;
}

interface ErrorResponse {
  data?: ErrorResponseData;
}

interface ErrorWithMessage {
  message?: unknown;
  response?: ErrorResponse;
}

const getStringValue = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

export const extractApiErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null) {
    const normalizedError = error as ErrorWithMessage;

    return (
      getStringValue(normalizedError.response?.data?.message) ??
      getStringValue(normalizedError.response?.data?.error) ??
      getStringValue(normalizedError.message) ??
      fallback
    );
  }

  return getStringValue(error) ?? fallback;
};

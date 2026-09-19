type ServerErrorBody = {
  message?: unknown;
  error?: unknown;
};

const resolveServerMessage = (body: unknown, response: Response): string => {
  if (body && typeof body === "object") {
    const { message, error } = body as ServerErrorBody;
    if (Array.isArray(message)) {
      const messages = message.filter((item): item is string => typeof item === "string");
      if (messages.length > 0) return messages.join(", ");
    }
    if (typeof message === "string" && message.length > 0) return message;
    if (typeof error === "string" && error.length > 0) return error;
  }
  const statusText = response.statusText ? `: ${response.statusText}` : "";
  return `Error ${response.status}${statusText}`;
};

/**
 * Parses a fetch response and throws an Error carrying the server message when
 * the response is not ok. Dependency-free.
 */
export const parseJsonResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    throw new Error(resolveServerMessage(body, response));
  }

  return body as T;
};

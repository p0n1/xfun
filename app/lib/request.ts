interface RequestOptions extends RequestInit {
  timeoutMs: number;
}

export async function fetchText(
  url: string,
  { timeoutMs, signal, ...init }: RequestOptions,
): Promise<string> {
  signal?.throwIfAborted();
  const controller = new AbortController();
  const abort = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', abort, { once: true });
  const timeoutId = setTimeout(
    () => controller.abort(new Error(`Timed out after ${timeoutMs / 1000} seconds`)),
    timeoutMs,
  );

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    // Keep the timeout and cancellation active until the body is fully read.
    return await response.text();
  } catch (error) {
    if (controller.signal.aborted) throw controller.signal.reason;
    throw error;
  } finally {
    clearTimeout(timeoutId);
    signal?.removeEventListener('abort', abort);
  }
}

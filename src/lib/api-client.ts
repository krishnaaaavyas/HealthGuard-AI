import { auth } from "./firebase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export class ApiError extends Error {
  constructor(
    public type:
      | "network"
      | "cold_start"
      | "unauthorized"
      | "timeout"
      | "server"
      | "validation"
      | "unknown",
    message: string,
    public status?: number,
    public details?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  skipRetry?: boolean;
}

// Registry to prevent duplicate simultaneous request promises to the same endpoint
const inFlightRequests = new Map<string, Promise<any>>();

function getRequestKey(url: string, options?: RequestOptions): string {
  const method = options?.method || "GET";
  const body = typeof options?.body === "string" ? options.body : "";
  return `${method}:${url}:${body}`;
}

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let attemptCountForDiagnostics = 0;

export const apiClient = {
  async request<T>(path: string, options?: RequestOptions): Promise<T> {
    const url = path.startsWith("http") ? path : `${API_URL}${path}`;
    const requestKey = getRequestKey(url, options);

    // If an identical request is already running, reuse the promise
    if (inFlightRequests.has(requestKey)) {
      console.log(`[ApiClient] Reusing in-flight request for: ${requestKey}`);
      return inFlightRequests.get(requestKey) as Promise<T>;
    }

    const requestPromise = (async () => {
      const maxRetries = options?.method === "GET" || !options?.method ? 2 : 0;
      let attempt = 0;

      while (true) {
        attempt++;
        try {
          return await this.executeSingle<T>(url, options);
        } catch (error: any) {
          const isRetryable =
            error instanceof ApiError &&
            (error.type === "network" || error.type === "timeout" || error.type === "cold_start") &&
            attempt <= maxRetries;

          if (isRetryable && !options?.skipRetry) {
            const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
            console.warn(
              `[ApiClient] Request failed (attempt ${attempt}/${maxRetries + 1}). Retrying in ${backoffMs}ms... Error: ${error.message}`,
            );
            await wait(backoffMs);
            continue;
          }
          throw error;
        }
      }
    })();

    inFlightRequests.set(requestKey, requestPromise);
    try {
      return await requestPromise;
    } finally {
      inFlightRequests.delete(requestKey);
    }
  },

  async executeSingle<T>(url: string, options?: RequestOptions): Promise<T> {
    attemptCountForDiagnostics++;

    // 1. Centralized Firebase Token retrieval
    let token = "mock-uid-guest";
    try {
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
      }
    } catch (e) {
      console.warn("[ApiClient] Failed to retrieve ID token, using guest credentials", e);
    }

    const headers = new Headers(options?.headers);
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (!headers.has("Content-Type") && options?.body) {
      headers.set("Content-Type", "application/json");
    }

    // 2. Abort Controller & Custom Timeout
    const controller = new AbortController();
    const timeoutMs =
      options?.timeoutMs || (options?.method === "GET" || !options?.method ? 15000 : 25000);
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const mergedOptions: RequestInit = {
      ...options,
      headers,
      signal: controller.signal,
    };

    const startTime = Date.now();
    try {
      const response = await fetch(url, mergedOptions);
      clearTimeout(timeoutId);

      const duration = Date.now() - startTime;

      if (duration > 15000) {
        console.log(
          `[ApiClient] Cold start detected but completed successfully, call took ${duration}ms`,
        );
      }

      if (!response.ok) {
        let details: any = null;
        try {
          details = await response.json();
        } catch (_) {
          // Ignored
        }

        if (response.status === 401 || response.status === 403) {
          throw new ApiError(
            "unauthorized",
            "Session unauthorized or expired",
            response.status,
            details,
          );
        }
        if (response.status >= 500) {
          throw new ApiError("server", "Internal server error occurred", response.status, details);
        }
        if (response.status === 400) {
          throw new ApiError("validation", "Validation error occurred", response.status, details);
        }
        throw new ApiError(
          "unknown",
          `Request failed with status ${response.status}`,
          response.status,
          details,
        );
      }

      return (await response.json()) as T;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error.name === "AbortError") {
        const duration = Date.now() - startTime;
        if (duration >= timeoutMs) {
          throw new ApiError("timeout", `Request timed out after ${timeoutMs}ms`);
        }
      }

      // Check if connection failed (network offline/server down)
      const isColdStartPotential = Date.now() - startTime >= 9000;
      if (isColdStartPotential) {
        throw new ApiError(
          "cold_start",
          "The health service is starting. Your dashboard will load shortly.",
        );
      }

      throw new ApiError("network", `Network connection failure: ${error.message || error}`);
    }
  },

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  },

  async post<T>(path: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async patch<T>(path: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  },
};

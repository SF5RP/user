import Cookies from "js-cookie";
// Use the built-in fetch types from DOM lib; avoid undici types in the client bundle

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function camelCaseKeys<T>(input: T): T {
  if (Array.isArray(input)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return input.map((item) => camelCaseKeys(item)) as unknown as T;
  }
  if (isPlainObject(input)) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      const newKey = toCamelCase(key);
      result[newKey] = camelCaseKeys(value);
    }
    return result as T;
  }
  return input;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = false, headers, ...restOptions } = options;

  const requestHeadersBase: HeadersInit = {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...headers,
  };
  const requestHeaders = requestHeadersBase as Record<string, string>;

  if (requiresAuth) {
    const token = Cookies.get("accessToken");
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const fullUrl = `${API_URL}${endpoint}`;
  console.log("API request:", {
    url: fullUrl,
    method: restOptions.method || "GET",
    headers: requestHeaders,
    body: restOptions.body,
  });

  const response = await fetch(fullUrl, {
    ...restOptions,
    headers: requestHeaders,
    credentials: "include",
    mode: "cors",
    cache: "no-cache",
  });

  if (!response.ok) {
    console.log("API response error:", {
      status: response.status,
      statusText: response.statusText,
      url: fullUrl,
    });
    if (response.status === 401) {
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    const errorPayload = (await response
      .json()
      .catch(() => ({ message: response.statusText }))) as unknown;
    const errorMessage =
      isPlainObject(errorPayload) && typeof errorPayload.message === "string"
        ? errorPayload.message
        : response.statusText;
    throw new Error(errorMessage || "API request failed");
  }

  // 204 No Content safety
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  const json = (await response.json()) as unknown;
  console.log("API response success:", {
    url: fullUrl,
    data: json,
  });

  return camelCaseKeys(json as T);
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiRequestOptions extends Omit<RequestInit, "body" | "method"> {
  method?: HttpMethod;
  body?: unknown;
  token?: string;
}

async function request<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    method = "GET",
    body,
    token,
    headers,
    ...rest
  } = options;
  
  let authToken = token;

if (
  !authToken &&
  typeof window !== "undefined"
) {
  authToken =
    localStorage.getItem("access_token") ?? undefined;
}
 
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    cache: "no-store",

    headers: {
      "Content-Type": "application/json",

      ...(authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : {}),

      ...(headers ?? {}),
    },

    ...(body !== undefined
      ? {
          body: JSON.stringify(body),
        }
      : {}),

    ...rest,
  });

  if (!response.ok) {
    let message = response.statusText;

    try {
      const error = await response.json();

      message =
        error?.message ??
        error?.error ??
        response.statusText;
    } catch {}

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  get<T>(path: string, token?: string) {
    return request<T>(path, {
      method: "GET",
      token,
    });
  },

  post<T>(
    path: string,
    body?: unknown,
    token?: string,
  ) {
    return request<T>(path, {
      method: "POST",
      body,
      token,
    });
  },

  put<T>(
    path: string,
    body?: unknown,
    token?: string,
  ) {
    return request<T>(path, {
      method: "PUT",
      body,
      token,
    });
  },

  patch<T>(
    path: string,
    body?: unknown,
    token?: string,
  ) {
    return request<T>(path, {
      method: "PATCH",
      body,
      token,
    });
  },

  delete<T>(path: string, token?: string) {
    return request<T>(path, {
      method: "DELETE",
      token,
    });
  },
};

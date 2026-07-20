const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api";

const ACCESS_TOKEN_KEY = "access_token";
const AUTH_USER_KEY = "user";

function clearBrowserAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

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
      localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined;
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

  if (response.status === 401 && authToken) {
    clearBrowserAuthSession();

    if (typeof window !== "undefined") {
      const next = encodeURIComponent(
        `${window.location.pathname}${window.location.search}`,
      );
      window.location.assign(`/admin/login?next=${next}`);
    }
  }

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

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

async function upload<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  let authToken: string | undefined;

  if (typeof window !== "undefined") {
    authToken =
      localStorage.getItem(ACCESS_TOKEN_KEY) ?? undefined;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      ...(authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : {}),
    },
    body: formData,
  });

  if (response.status === 401 && authToken) {
    clearBrowserAuthSession();

    if (typeof window !== "undefined") {
      const next = encodeURIComponent(
        `${window.location.pathname}${window.location.search}`,
      );
      window.location.assign(`/admin/login?next=${next}`);
    }
  }

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

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
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

  upload,
};

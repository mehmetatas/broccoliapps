// Basiq API Client SDK
// https://api.basiq.io/reference

const BASE_URL = "https://au-api.basiq.io";
const BASIQ_VERSION = "3.0";

// Type Definitions

export interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface User {
  type: string;
  id: string;
  email?: string;
  mobile?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  links?: {
    self: string;
    connections?: string;
    accounts?: string;
    transactions?: string;
  };
}

export interface CreateUserParams {
  email?: string;
  mobile?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  businessName?: string;
  businessIdNo?: string;
}

export interface AuthLink {
  type: string;
  userId: string;
  mobile?: string;
  expiresAt: string;
  links: {
    self: string;
    public: string;
  };
}

export interface JobStep {
  title: string;
  status: string;
  result?: {
    type: string;
    url?: string;
  };
}

export interface Job {
  type: string;
  id: string;
  steps: JobStep[];
  links?: {
    self: string;
    source?: string;
  };
}

export interface Account {
  type: string;
  id: string;
  accountNo?: string;
  name: string;
  balance?: string;
  availableFunds?: string;
  currency: string;
  class: {
    type: string;
    product?: string;
  };
  institution: string;
  connection: string;
  status: string;
  links?: {
    self: string;
    transactions?: string;
  };
}

export interface Transaction {
  type: string;
  id: string;
  status: string;
  description: string;
  amount: string;
  account: string;
  direction: string;
  class: string;
  postDate: string;
  transactionDate?: string;
  enrich?: {
    merchant?: {
      id: string;
      businessName: string;
    };
    category?: {
      anzsic?: {
        code: string;
        title: string;
      };
    };
    location?: {
      geometry?: {
        lat: number;
        lng: number;
      };
    };
  };
  links?: {
    self: string;
    account?: string;
  };
}

export interface Connection {
  type: string;
  id: string;
  status: string;
  institution: {
    id: string;
    links?: {
      self: string;
    };
  };
  user: string;
  createdDate: string;
  lastUsed?: string;
  links?: {
    self: string;
    accounts?: string;
    transactions?: string;
  };
}

export interface ListResponse<T> {
  type: string;
  count?: number;
  size?: number;
  data: T[];
  links?: {
    self: string;
    next?: string;
    prev?: string;
  };
}

export interface BasiqError {
  type: string;
  correlationId?: string;
  data?: Array<{
    type: string;
    code: string;
    title: string;
    detail: string;
    source?: {
      parameter?: string;
      pointer?: string;
    };
  }>;
}

export class BasiqApiError extends Error {
  public statusCode: number;
  public basiqError?: BasiqError;

  constructor(message: string, statusCode: number, basiqError?: BasiqError) {
    super(message);
    this.name = "BasiqApiError";
    this.statusCode = statusCode;
    this.basiqError = basiqError;
  }
}

export class BasiqClient {
  private apiKey: string;
  private accessToken?: string;
  private tokenExpiry?: number;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Shared request method - handles headers, auth, errors
   */
  private async request<T>(path: string, options?: RequestInit & { skipAuth?: boolean }): Promise<T> {
    const { skipAuth, ...fetchOptions } = options || {};

    // Auto-refresh token if needed
    if (!skipAuth && (!this.accessToken || !this.tokenExpiry || Date.now() >= this.tokenExpiry)) {
      await this.getToken();
    }

    const headers: Record<string, string> = {
      "basiq-version": BASIQ_VERSION,
      ...(fetchOptions.headers as Record<string, string>),
    };

    if (!skipAuth && this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    // Add Content-Type for POST/PUT/PATCH if not already set and has body
    if (fetchOptions.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    if (!response.ok) {
      let errorBody: BasiqError | undefined;
      if (isJson) {
        try {
          errorBody = await response.json();
        } catch {
          // Ignore JSON parse error
        }
      }
      const errorMessage = errorBody?.data?.[0]?.detail || `Request failed with status ${response.status}`;
      throw new BasiqApiError(errorMessage, response.status, errorBody);
    }

    if (isJson) {
      return response.json();
    }

    return undefined as T;
  }

  /**
   * Get an access token using the API key
   * Token endpoint uses Basic auth and form-encoded body
   */
  async getToken(scope: "SERVER_ACCESS" | "CLIENT_ACCESS" = "SERVER_ACCESS", userId?: string): Promise<TokenResponse> {
    const body = new URLSearchParams();
    body.append("scope", scope);
    if (scope === "CLIENT_ACCESS" && userId) {
      body.append("userId", userId);
    }

    const response = await fetch(`${BASE_URL}/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${this.apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "basiq-version": BASIQ_VERSION,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => undefined);
      throw new BasiqApiError(errorBody?.data?.[0]?.detail || `Token request failed with status ${response.status}`, response.status, errorBody);
    }

    const tokenResponse: TokenResponse = await response.json();

    // Store token for automatic refresh
    this.accessToken = tokenResponse.access_token;
    // Set expiry with 60 second buffer
    this.tokenExpiry = Date.now() + (tokenResponse.expires_in - 60) * 1000;

    return tokenResponse;
  }

  /**
   * Set access token manually
   */
  setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
    this.tokenExpiry = Date.now() + (3600 - 60) * 1000;
  }

  /**
   * Create a new user
   */
  async createUser(params: CreateUserParams): Promise<User> {
    return this.request<User>("/users", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * Get a user by ID
   */
  async getUser(userId: string): Promise<User> {
    return this.request<User>(`/users/${userId}`);
  }

  /**
   * Delete a user by ID
   */
  async deleteUser(userId: string): Promise<void> {
    return this.request<void>(`/users/${userId}`, {
      method: "DELETE",
    });
  }

  /**
   * Create an auth link for a user to connect their bank
   */
  async createAuthLink(userId: string, mobile?: string): Promise<AuthLink> {
    const body: { mobile?: string } = {};
    if (mobile) {
      body.mobile = mobile;
    }

    return this.request<AuthLink>(`/users/${userId}/auth_link`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /**
   * Get job status by ID
   */
  async getJob(jobId: string): Promise<Job> {
    return this.request<Job>(`/jobs/${jobId}`);
  }

  /**
   * Submit MFA response for a job
   */
  async submitJobMfa(jobId: string, mfaResponse: string[]): Promise<Job> {
    return this.request<Job>(`/jobs/${jobId}/mfa`, {
      method: "POST",
      body: JSON.stringify({ mfa: mfaResponse }),
    });
  }

  /**
   * Get accounts for a user
   */
  async getAccounts(userId: string, filter?: string, limit?: number): Promise<ListResponse<Account>> {
    const params = new URLSearchParams();
    if (filter) {
      params.append("filter", filter);
    }
    if (limit) {
      params.append("limit", limit.toString());
    }

    const query = params.toString();
    const path = `/users/${userId}/accounts${query ? `?${query}` : ""}`;

    return this.request<ListResponse<Account>>(path);
  }

  /**
   * Get transactions for a user
   */
  async getTransactions(userId: string, filter?: string, limit?: number): Promise<ListResponse<Transaction>> {
    const params = new URLSearchParams();
    if (filter) {
      params.append("filter", filter);
    }
    if (limit) {
      params.append("limit", limit.toString());
    }

    const query = params.toString();
    const path = `/users/${userId}/transactions${query ? `?${query}` : ""}`;

    return this.request<ListResponse<Transaction>>(path);
  }

  /**
   * Get connections for a user
   */
  async getConnections(userId: string): Promise<ListResponse<Connection>> {
    return this.request<ListResponse<Connection>>(`/users/${userId}/connections`);
  }
}

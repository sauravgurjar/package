export interface AskNowApiConfig {
  accessToken: string;
  userId: string;
  sessionId?: string;
  departmentId?: string;
  useCase?: string;
  suggestionLimit?: number;
  mode?: string | null;
  endpoint: string;
}
export interface QuerySuggestion { query: string; similarity: number }
export interface SearchResponse {
  content: string;
  citations?: string[];
  leading_question?: string;
  message_id?: string;
  verified?: boolean;
  [key: string]: unknown;
}
export class AskNowApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'AskNowApiError';
  }
}
export class AskNowApi {
  private readonly config: Required<AskNowApiConfig>;
  constructor(options: AskNowApiConfig) {
    const config = {
      sessionId: `chat_${globalThis.crypto.randomUUID()}`, departmentId: 'root',
      useCase: 'khoj', suggestionLimit: 3, mode: null, ...options,
    };
    if (![config.endpoint, config.accessToken, config.userId, config.sessionId, config.departmentId, config.useCase].every(value => value.trim())) {
      throw new AskNowApiError('Endpoint, access token, user ID, session ID, department, and use case are required.');
    }
    if (!Number.isInteger(config.suggestionLimit) || config.suggestionLimit < 1) throw new AskNowApiError('Suggestion limit must be a positive integer.');
    this.config = { ...config, accessToken: config.accessToken.trim(), userId: config.userId.trim() };
  }
  async querySuggestions(query: string, signal?: AbortSignal): Promise<QuerySuggestion[]> {
    if (!query.trim()) return [];
    const result = await this.post('/utils/query_suggestions', {
      query: query.trim(), use_case: this.config.useCase, limit: this.config.suggestionLimit,
    }, signal);
    if (!result || typeof result !== 'object' || !('data' in result) || !Array.isArray(result.data) ||
      !result.data.every(item => item && typeof item.query === 'string' && typeof item.similarity === 'number')) {
      throw new AskNowApiError('Suggestions API returned an unexpected response.');
    }
    return result.data;
  }
  async search(query: string, signal?: AbortSignal): Promise<SearchResponse> {
    if (!query.trim()) throw new AskNowApiError('Enter a question.');
    const result = await this.post('/chat/search', {
      query: query.trim(), session_id: this.config.sessionId, mode: this.config.mode,
      user_id: this.config.userId, department_id: this.config.departmentId,
    }, signal);
    if (!result || typeof result !== 'object' || !('content' in result) || typeof result.content !== 'string' || !result.content.trim()) {
      throw new AskNowApiError('Search API returned an unexpected response.');
    }
    return result as SearchResponse;
  }
  private async post(path: string, body: unknown, signal?: AbortSignal): Promise<unknown> {
    const timeout = AbortSignal.timeout(90_000);
    let response: Response;
    try {
      response = await fetch(`${this.config.endpoint.replace(/\/$/, '')}${path}`, {
        method: 'POST', headers: {
          'Accept': 'application/json', 'Content-Type': 'application/json',
          'x-user-id': this.config.userId,
          // The local server proxy converts this to the upstream access-token cookie.
          'x-asknow-access-token': this.config.accessToken,
        },
        body: JSON.stringify(body), signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
        credentials: 'same-origin',
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new AskNowApiError(timeout.aborted ? 'The API request timed out. Please try again.' : 'Cannot reach the API. Check your connection and proxy settings.');
    }
    if (!response.ok) throw new AskNowApiError(response.status === 401 || response.status === 403
      ? 'Authentication failed. Check your access token, user ID, and UAT session cookies.'
      : `API request failed (HTTP ${response.status}).`, response.status);
    try { return await response.json(); }
    catch { throw new AskNowApiError('API did not return JSON. Check authentication and the endpoint.'); }
  }
}

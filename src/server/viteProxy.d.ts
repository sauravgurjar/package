import type { ProxyOptions } from 'vite';
export interface AskNowProxyOptions {
  target?: string;
  upstreamPath?: string;
  prefix?: string;
  sessionCookies?: string;
  allowInsecureTls?: boolean;
}
export declare function createAskNowProxy(options?: AskNowProxyOptions): Record<string, ProxyOptions>;

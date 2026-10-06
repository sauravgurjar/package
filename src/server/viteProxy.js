/**
 * Vite development/preview proxy for AskNow's cookie-authenticated APIs.
 * This module runs only on the server and must not be imported into browser code.
 */
export function createAskNowProxy({
  target = 'https://asknow-uat.hdfcbankuat.com',
  upstreamPath = '/UAT/asknow-edge-services/core/v1/api/external',
  prefix = '/asknow-api',
  sessionCookies = '',
  allowInsecureTls = false,
} = {}) {
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return {
    [`^${escaped}/(utils/query_suggestions|chat/search)$`]: {
      target,
      changeOrigin: true,
      secure: !allowInsecureTls,
      rewrite: path => upstreamPath.replace(/\/$/, '') + path.slice(prefix.length),
      configure: server => {
        server.on('proxyReq', (request, incoming) => {
          const token = incoming.headers['x-asknow-access-token'];
          request.removeHeader('x-asknow-access-token');
          request.removeHeader('cookie');
          if (typeof token === 'string' && token.trim()) {
            const extra = sessionCookies.trim();
            request.setHeader('Cookie', `access-token=${encodeURIComponent(token.trim())}${extra ? `; ${extra}` : ''}`);
          }
        });
        server.on('proxyRes', response => { delete response.headers['set-cookie']; });
      },
    },
  };
}

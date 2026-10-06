import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Paper, Typography } from '@mui/material';
import { AskNowApi } from '../api/AskNowApi';
import type { AskNowApiConfig, SearchResponse } from '../api/AskNowApi';
import { AskNowInput } from './AskNowInput';
import { Chatbot } from './Chatbot';

export interface AskNowWidgetProps extends AskNowApiConfig {
  variant?: 'input' | 'chatbot';
  title?: string;
}

/** A complete API-connected input or floating chatbot. */
export function AskNowWidget({ variant = 'input', title, ...config }: AskNowWidgetProps) {
  const result = useMemo(() => {
    try { return { api: new AskNowApi(config), id: globalThis.crypto.randomUUID() }; }
    catch (err) { return { error: err instanceof Error ? err.message : 'Invalid API settings.' }; }
  }, [config.endpoint, config.accessToken, config.userId, config.sessionId, config.departmentId, config.useCase, config.suggestionLimit, config.mode]);
  if (!result.api) return <Alert severity="error">{result.error}</Alert>;
  return <ConnectedWidget key={`${result.id}-${variant}`} api={result.api} variant={variant} title={title} />;
}

function ConnectedWidget({ api, variant, title }: { api: AskNowApi; variant: 'input' | 'chatbot'; title?: string }) {
  const [answer, setAnswer] = useState<SearchResponse | null>(null);
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const active = useRef<AbortController | null>(null);
  useEffect(() => {
    setAnswer(null);
    setQuestion('');
    setError('');
    return () => active.current?.abort();
  }, [api]);

  const getSuggestions = useCallback(async (query: string, signal: AbortSignal) => {
    return (await api.querySuggestions(query, signal)).map(item => item.query);
  }, [api]);

  const search = useCallback(async (text: string) => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setError('');
    setAnswer(null);
    setQuestion(text);
    try {
      const response = await api.search(text, controller.signal);
      if (!controller.signal.aborted) setAnswer(response);
      return response.content;
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Search failed.');
      throw err;
    }
  }, [api]);

  return (
    <>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {variant === 'chatbot' ? <Chatbot title={title} getSuggestions={getSuggestions} onAsk={search} /> : (
        <>
          <AskNowInput getSuggestions={getSuggestions} onSubmit={async text => { await search(text); }} />
          {answer && <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
            <Typography variant="subtitle2">{question}</Typography>
            <Typography sx={{ mt: 2, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{answer.content}</Typography>
            {!!answer.citations?.length && <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Sources</Typography>
              {answer.citations.map(source => <Typography key={source} variant="caption" component="p" sx={{ overflowWrap: 'anywhere' }}>{source}</Typography>)}
            </Box>}
            {answer.leading_question && <Typography sx={{ mt: 2 }}>{answer.leading_question}</Typography>}
          </Paper>}
        </>
      )}
    </>
  );
}

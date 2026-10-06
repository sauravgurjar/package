import { useEffect, useState } from 'react';
export type SuggestionProvider = (query: string, signal: AbortSignal) => Promise<readonly string[]>;
export function useQuerySuggestions(query: string, provider?: SuggestionProvider, disabled = false) {
  const [items, setItems] = useState<readonly string[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    setItems([]);
    setError('');
    if (!provider || query.trim().length < 2 || disabled) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const result = await provider(query.trim(), controller.signal);
        if (!controller.signal.aborted) setItems(result);
      } catch {
        if (!controller.signal.aborted) setError('Suggestions are unavailable. You can still submit your question.');
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, provider, disabled]);
  return { items, error };
}

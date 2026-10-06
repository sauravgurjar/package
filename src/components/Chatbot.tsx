import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Alert, Box, Button, CircularProgress, Fab, IconButton, Paper, SvgIcon, TextField, Typography } from '@mui/material';

import { useQuerySuggestions } from './useQuerySuggestions';
import type { SuggestionProvider } from './useQuerySuggestions';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatbotProps {
  getSuggestions?: SuggestionProvider;
  title?: string;
  greeting?: string;
  /** Return an answer from your backend. Without this callback, demo replies are shown. */
  onAsk?: (question: string, history: readonly ChatMessage[]) => string | Promise<string>;
}

export function Chatbot({
  title = 'AskNow assistant',
  greeting = 'Hi! How can I help you today?',
  onAsk,
  getSuggestions,
}: ChatbotProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: greeting },
  ]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const mounted = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const log = useRef<HTMLDivElement>(null);
  const suggestions = useQuerySuggestions(question, getSuggestions, pending || !open);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages, pending, open, error]);

  function close() {
    setOpen(false);
    launcher.current?.focus();
  }

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = question.trim();
    if (!text || busy.current) return;
    const history: ChatMessage[] = [...messages, { role: 'user', content: text }];
    busy.current = true;
    setMessages(history);
    setQuestion('');
    setError('');
    setPending(true);
    try {
      const answer = onAsk
        ? await onAsk(text, history)
        : 'This is a demo assistant. Connect the onAsk callback to your backend to answer questions.';
      if (!answer.trim()) throw new Error('Empty answer');
      if (mounted.current) setMessages((current) => [...current, { role: 'assistant', content: answer }]);
    } catch {
      if (mounted.current) setError('Could not get an answer. Please try your question again.');
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  return (
    <>
      {open && (
        <Paper
          id={id}
          role="dialog"
          aria-labelledby={`${id}-title`}
          elevation={12}
          onKeyDown={(event) => {
            if (event.key === 'Escape') { event.stopPropagation(); close(); }
          }}
          sx={{
            position: 'fixed', right: { xs: 12, sm: 24 }, bottom: 96,
            width: { xs: 'calc(100vw - 24px)', sm: 380 },
            height: 500, maxHeight: 'calc(100dvh - 112px)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            borderRadius: 3, zIndex: (theme) => theme.zIndex.modal,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Box sx={{ flex: 1 }}>
              <Typography id={`${id}-title`} variant="subtitle1" sx={{ fontWeight: 700 }}>{title}</Typography>
              <Typography variant="caption">Ask a question to get started</Typography>
            </Box>
            <IconButton aria-label="Close chat" onClick={close} sx={{ color: 'inherit' }}>
              <SvgIcon><path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z" /></SvgIcon>
            </IconButton>
          </Box>
          <Box ref={log} role="log" aria-label="Conversation" aria-live="polite" aria-relevant="additions" sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 2, bgcolor: 'grey.50' }}>
            {messages.map((message, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start', mb: 1.5 }}>
                <Box sx={{ maxWidth: '85%', px: 1.5, py: 1, borderRadius: 2, bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper', color: message.role === 'user' ? 'primary.contrastText' : 'text.primary', boxShadow: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>{message.role === 'user' ? 'You' : title}</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{message.content}</Typography>
                </Box>
              </Box>
            ))}
            {pending && <Box role="status" sx={{ display: 'flex', gap: 1, alignItems: 'center' }}><CircularProgress size={16} /><Typography variant="body2">Thinking…</Typography></Box>}
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
          {!!suggestions.items.length && <Box aria-label="Suggested questions" sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, px: 1.5, py: 1, maxHeight: 100, overflowY: 'auto' }}>
            {suggestions.items.map((item) => <Button key={item} size="small" onClick={() => { setQuestion(item); input.current?.focus(); }}>{item}</Button>)}
          </Box>}
          {suggestions.error && <Typography role="status" variant="caption" sx={{ px: 1.5 }}>{suggestions.error}</Typography>}
          <Box component="form" onSubmit={ask} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderTop: 1, borderColor: 'divider' }}>
            <TextField
              inputRef={input} label="Your question" placeholder="Ask anything…"
              value={question} onChange={(event) => setQuestion(event.target.value)}
              size="small" fullWidth
            />
            <IconButton type="submit" color="primary" aria-label="Send question" disabled={pending || !question.trim()}>
              <SvgIcon><path d="M2 3v7l14 2-14 2v7l20-9L2 3z" /></SvgIcon>
            </IconButton>
          </Box>
        </Paper>
      )}
      <Fab
        ref={launcher} color="primary" aria-label={open ? 'Close chat' : 'Open chat'}
        aria-expanded={open} aria-controls={open ? id : undefined} aria-haspopup="dialog"
        onClick={() => open ? close() : setOpen(true)}
        sx={{ position: 'fixed', bottom: 24, right: { xs: 12, sm: 24 }, zIndex: (theme) => theme.zIndex.modal }}
      >
        <SvgIcon><path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2ZM6 7h12v2H6V7Zm0 4h8v2H6v-2Z" /></SvgIcon>
      </Fab>
    </>
  );
}

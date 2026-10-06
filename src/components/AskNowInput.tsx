import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Box, Button, IconButton, InputBase, Typography } from '@mui/material';
import '@fontsource/inter/latin-500.css';
import logo from '../assets/asknow-logo.svg';
import send from '../assets/asknow-send.svg';
import keyboard from '../assets/asknow-keyboard.svg';
import microphone from '../assets/asknow-microphone.svg';
import './AskNowInput.css';
import { useQuerySuggestions } from './useQuerySuggestions';
import type { SuggestionProvider } from './useQuerySuggestions';

export interface AskNowInputProps {
  onSubmit: (question: string) => void | Promise<void>;
  /** Return a transcript from your app's voice input service. */
  onVoiceInput?: () => string | Promise<string>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  getSuggestions?: SuggestionProvider;
}

export function AskNowInput({ onSubmit, onVoiceInput, getSuggestions, placeholder = 'Ask or Search anything...', disabled = false, className = '' }: AskNowInputProps) {
  const [value, setValue] = useState('');
  const [mode, setMode] = useState<'keyboard' | 'microphone'>('keyboard');
  const [pending, setPending] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = value.trim();
    if (!question || disabled || busy.current) return;
    busy.current = true;
    setPending(true);
    setError('');
    try {
      await onSubmit(question);
      if (mounted.current) setValue('');
    } catch {
      if (mounted.current) setError('Could not send your question. Please try again.');
    } finally {
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }

  async function voice() {
    if (disabled || busy.current) return;
    setError('');
    if (!onVoiceInput) {
      setError('Voice input is not available. Please type your question.');
      input.current?.focus();
      return;
    }
    busy.current = true;
    setMode('microphone');
    setListening(true);
    try {
      const transcript = await onVoiceInput();
      if (mounted.current) setValue(transcript);
    } catch {
      if (mounted.current) setError('Could not capture your voice. Please try again or type your question.');
    } finally {
      busy.current = false;
      if (mounted.current) {
        setListening(false);
        setMode('keyboard');
        input.current?.focus();
      }
    }
  }

  const locked = disabled || pending || listening;
  const suggestions = useQuerySuggestions(value, getSuggestions, locked);
  return (
    <Box className={`asknow-input ${className}`.trim()}>
      <Box component="form" onSubmit={submit} className="asknow-input__bar" aria-label="AskNow question">
        <img className="asknow-input__logo" src={logo} alt="AskNow" />
        <InputBase
          className="asknow-input__field" inputRef={input} value={value}
          onChange={(event) => setValue(event.target.value)} disabled={locked}
          placeholder={placeholder} inputProps={{ 'aria-label': 'Ask or search anything' }}
        />
        <Box className="asknow-input__actions">
          <IconButton className="asknow-input__send" type="submit" aria-label="Send question" disabled={locked || !value.trim()}>
            <img src={send} alt="" />
          </IconButton>
          <Box className="asknow-input__modes" role="group" aria-label="Input mode">
            <IconButton className="asknow-input__mode" aria-label="Type question" aria-pressed={mode === 'keyboard'} disabled={locked} onClick={() => { setMode('keyboard'); input.current?.focus(); }}>
              <img src={keyboard} alt="" />
            </IconButton>
            <IconButton className="asknow-input__mode" aria-label="Use microphone" aria-pressed={mode === 'microphone'} disabled={locked} onClick={voice}>
              <img src={microphone} alt="" />
            </IconButton>
          </Box>
        </Box>
      </Box>
      {!!suggestions.items.length && <Box aria-label="Suggested questions" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
        {suggestions.items.map((item) => <Button key={item} size="small" variant="outlined" onClick={() => { setValue(item); input.current?.focus(); }}>{item}</Button>)}
      </Box>}
      {suggestions.error && <Typography role="status" variant="caption">{suggestions.error}</Typography>}
      {(pending || listening) && <Typography role="status" variant="caption">{listening ? 'Listening…' : 'Sending…'}</Typography>}
      {error && <Typography role="alert" color="error" variant="caption">{error}</Typography>}
    </Box>
  );
}

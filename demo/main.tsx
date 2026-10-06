import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Alert, Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { AskNowInput, Chatbot } from '../src';

import './style.css';

function App() {
  const [component, setComponent] = useState<'input' | 'chatbot'>('input');
  const [question, setQuestion] = useState('');

  return (
    <main>
      <p className="eyebrow">AskNow React · Component examples</p>
      <h1>Choose how you ask.</h1>
      <p>Try the Figma input bar or the floating chatbot.</p>
      <FormControl sx={{ minWidth: 240, mb: 4 }} size="small">
        <InputLabel id="component-label">Choose a component</InputLabel>
        <Select labelId="component-label" label="Choose a component" value={component} onChange={(event) => setComponent(event.target.value as 'input' | 'chatbot')}>
          <MenuItem value="input">AskNow input bar (Figma)</MenuItem>
          <MenuItem value="chatbot">Floating chatbot</MenuItem>
        </Select>
      </FormControl>
      {component === 'input' ? (
        <>
          <AskNowInput onSubmit={(text) => setQuestion(text)} />
          {question && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2">Your question</Typography>
              <Typography sx={{ overflowWrap: 'anywhere', mb: 2 }}>{question}</Typography>
              <Alert severity="info">Demo: your question was received. Connect onSubmit to your backend for answers.</Alert>
            </Box>
          )}
        </>
      ) : (
        <>
          <Alert severity="info">Click the chat button at the bottom-right to ask a question.</Alert>
          <Chatbot />
        </>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);

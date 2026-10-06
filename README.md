# AskNow React

## Figma input bar

`AskNowInput` recreates the selected [Figma input design](https://www.figma.com/design/fU8HwFA9x5EZUZ4rdKclTI/KHOJ_Redesign?node-id=4396-56392).
The original logo, send, keyboard, and microphone SVGs are bundled locally.

```tsx
import { AskNowInput } from 'asknow-react';
import 'asknow-react/style.css';

<AskNowInput onSubmit={async (question) => {
  // Send the question to your own API.
  console.log(question);
}} />
```

The input trims questions, prevents empty/duplicate submissions, and retains the
question when submission fails. Optional `onVoiceInput` returns a transcript from
your app's voice service; without it, the microphone displays an availability message.
Optional props: `placeholder`, `disabled`, and `className`.

The demo and `../asknow-example` have a component selector for this input bar or
the floating chatbot. The demo displays submitted questions locally. The separate
example connects both components to the AskNow suggestions and search APIs.
Both components accept `getSuggestions(query, signal)` returning question strings;
requests are debounced and cancelled when the query changes.

A Vite + TypeScript boilerplate for a reusable React package. Includes ES modules,
CommonJS, TypeScript declarations, an exported stylesheet, and a local playground.
React and React DOM are peer dependencies and stay outside the library bundle.

## Development

Use Node.js 20.19+ (20.x) or 22.12+.

```sh
npm install
npm run dev
```

Library code lives in `src/`; export public components and types from `src/index.ts`.
The `demo/` directory is a development playground and is excluded from the package.

## Build and use locally

```sh
npm run build
npm pack
```

Install the generated tarball in a consuming React project:

```sh
npm install /absolute/path/to/asknow-react-0.1.0.tgz
```

```tsx
import { Button } from 'asknow-react';
import 'asknow-react/style.css';

export function App() {
  return <Button onClick={() => alert('Hello!')}>Ask now</Button>;
}
```

Consumers must import the stylesheet once. Native button attributes, event handlers,
and custom class names are supported. React 18 and 19 are supported.

## Floating chatbot (Material UI)

Install the chatbot's peer dependencies in your React app:

```sh
npm install @mui/material @emotion/react @emotion/styled
```

```tsx
import { Chatbot } from 'asknow-react';

export function App() {
  return <Chatbot title="Support" onAsk={async (question, history) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, messages: history }),
    });
    if (!response.ok) throw new Error('Chat request failed');
    const data = await response.json();
    return data.answer;
  }} />;
}
```

The floating button opens a responsive chat panel at the bottom-right. Users can
send questions with Enter or the send button, close with Escape, and reopen their
conversation. The callback receives history including the new question and must
return an answer string. Keep API keys on your backend. Without `onAsk`, the
component displays a demo reply; no AI service is connected by default.

`Chatbot` uses the host application's MUI theme when provided. MUI and Emotion
are peer dependencies and are excluded from the library bundle.

`npm run typecheck` checks the library, demo, and Vite configuration.
`npm run build:watch` watches JavaScript and CSS; rerun `npm run build` to refresh
declarations after changing public types. `npm pack` automatically runs a full build.

Before publishing, choose your package name, update its description and version,
and add your chosen license and repository metadata to `package.json`.

Build setup follows [Vite library mode](https://vite.dev/guide/build.html#library-mode).

## Complete API integration

All API code lives in this package. Applications can pass configuration directly:

```tsx
import { AskNowWidget } from 'asknow-react';
import 'asknow-react/style.css';

<AskNowWidget endpoint="/asknow-api" accessToken={token} userId={userId} variant="input" />
// Use variant="chatbot" for the floating panel.
```

`userId` is required by the supplied API contract. Optional settings: `sessionId`,
`departmentId` (root), `useCase` (khoj), `suggestionLimit` (3), and `mode` (null).
The library generates a session ID and handles suggestions, answers, sources,
errors, and cancellation. Credentials/configuration changes reset the widget.

For lower-level use, import `AskNowApi` and `AskNowApiConfig` from `asknow-react`.
The constructor takes the same configuration. `endpoint` is a base path.

Cookie authentication needs a server proxy. The library provides a Vite helper:

```ts
import { createAskNowProxy } from 'asknow-react/vite';

const proxy = createAskNowProxy({ target: 'https://asknow-uat.hdfcbankuat.com' });
// Include server: { proxy }, preview: { proxy } in your Vite config.
```

This server-only entry converts `x-asknow-access-token` to the upstream
`access-token` cookie. It accepts optional `upstreamPath`, `prefix`,
`sessionCookies`, and `allowInsecureTls`. Deployed apps need an equivalent
backend route; a browser cannot set arbitrary Cookie headers.

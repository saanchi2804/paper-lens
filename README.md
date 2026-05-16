# PaperLens

**Hey! Welcome to PaperLens 👋**

This is a tool I'm building to make research papers actually enjoyable to learn from. The idea: upload a PDF, and PaperLens generates a narrated video that explains the paper the way a professor would — with slides, diagrams, and a teaching voice walking you through it.

## What's working right now

- Upload any research PDF → the AI reads it and writes a 13-scene teaching script
- Each scene gets the right visual: concept diagrams, layered architecture charts, bar charts with real numbers, or AI-generated illustrations depending on what the content needs
- Audio narration plays in sync with the slides

> **Note on audio quality:** The current version uses the browser's built-in text-to-speech (free, no quota) as a placeholder. The final version will use ElevenLabs — a specific voice called Rachel that sounds like a real teacher. You'll hear the difference immediately when we switch it back.

## The vision

Think YouTube explainer video but generated entirely from a PDF. Not bullet points — actual visual explanations of concepts, the way a professor draws on a whiteboard.

## Running locally

1. Clone the repo
2. Create a `.env.local` file in the root with your API keys (ask me for these):

```
YALE_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
```

3. Install and run:

```bash
npm install
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) and upload a PDF.

## Tech stack

- **Next.js** — app framework
- **Remotion** — frame-based video composition in React
- **ElevenLabs** — narration (Rachel voice, temporarily replaced with Web Speech API)
- **Pollinations.ai** — free AI image generation for illustration scenes
- **Yale LLM Router** — script generation via GLM-4.5

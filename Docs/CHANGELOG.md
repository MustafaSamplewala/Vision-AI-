# Changelog

All notable changes to the **VisionAI Sentinel** project will be documented in this file.

## [0.2.0] - 2026-02-14

### 🔄 Critical Fixes & Enhancements

This release addresses major stability issues with the Gemini Live API connection and modernizes the audio processing architecture.

#### 1. Gemini Live API Connectivity
- **Issue**: Connection was terminating immediately upon start with error code 1008 (Resource Not Found).
- **Diagnosis**: The initial model name `gemini-2.0-flash-live-preview-04-09` was deprecated or incorrect for the `bidiGenerateContent` WebSocket endpoint.
- **Resolution**: Implemented a model discovery script (`list_models.ts`) to enumerate available models. Identified and switched to `gemini-2.5-flash-native-audio-latest`, which correctly supports real-time, bidirectional multimodal streaming.

#### 2. Advanced Audio Architecture (Deprecation Fixes)
- **Issue**: The application used `ScriptProcessorNode` for audio capture, which is deprecated, runs on the main thread (causing UI jank), and is known for latency issues. Additionally, browser autoplay policies frequently suspended the `AudioContext`, resulting in "silent" responses where the AI was processing but no sound played.
- **Resolution**:
    - **AudioWorklet Implementation**: Created a custom `AudioWorkletProcessor` in `public/audio-processor.js` to handle PCM audio capture on a dedicated audio thread.
    - **Context Management**: Implemented automatic `resume()` calls for the `AudioContext` in both connection startup and message reception handlers to bypass browser autoplay restrictions.
    - **Stability**: Refactored `Dashboard.tsx` to load the Worklet module dynamically and handle message passing via `port.onmessage`.

#### 3. New Dashboard Controls
- **Feature**: Added a dedicated control bar to the Dashboard.
- **Camera Toggle**: Real-time enabling/disabling of the video track. Visual feedback (grayscale/opacity) indicates when the camera is off.
- **Mic Mute**: Toggle to mute/unmute the microphone stream without severing the WebSocket connection.
- **System Power**: Centralized "ON/OFF" button to manage the entire AI session lifecycle.

#### 4. Code Quality & Standards
- **Linting**: Resolved all SonarQube and TypeScript warnings:
    - Replaced `window.AudioContext` with `globalThis.AudioContext` for better environment compatibility.
    - Updated deprecated `charCodeAt`/`fromCharCode` to Unicode-safe `codePointAt`/`fromCodePoint`.
    - Fixed syntax errors involving `await` in synchronous callbacks by implementing IIFE (Immediately Invoked Function Expression) wrappers.
    - Removed unused imports (`useCallback`, `AnimatePresence`, etc.) to reduce bundle size.
    - Added `vite/client` types to `tsconfig.json` to resolve `import.meta.env` type errors.

#### 5. User Experience & Branding
- **Favicon**: Designed and implemented a custom "Cyber Eye" SVG favicon producing a consistent, futuristic brand identity compliant with the dashboard's dark aesthetic.
- **Feedback**: Re-instated robust console logging (`RX: ...`) to allow developer monitoring of incoming server payloads.

## [0.1.0] - 2026-02-14

### 🚀 Project Overview
**VisionAI Sentinel** is a next-generation, vision-based AI companion application designed to provide real-time visual intelligence and multimodal interaction. Built with a focus on high-performance aesthetics and low-latency processing, it serves as a bridge between human perception and artificial intelligence.

### 🏗️ Architecture & Tech Stack
The project is architected as a modern **Single Page Application (SPA)** using **Vite** for lightning-fast development and build performance.

- **Core Framework**: React 19 (TypeScript)
- **Styling**: Tailwind CSS for utility-first styling with a custom dark-mode aesthetic (`#0E0E12` background).
- **Animations**: `framer-motion` for complex, physics-based transitions and micro-interactions.
- **Data Visualization**: `recharts` for rendering real-time analytics and metric visualizations.
- **AI Engine**: `@google/genai` SDK, leveraging **Gemini 2.0 Flash Live Preview** for multimodal streaming (Video + Audio in, Audio out).
- **Icons**: `lucide-react` for consistent, lightweight iconography.

### ✨ Key Features

#### 1. Immersive Landing Page (`components/LandingPage.tsx`)
A high-converting, visually stunning entry point featuring:
- **Dynamic Hero Section**: Gradient glassmorphism effects with animated background blobs.
- **Interactive Visuals**: Floating 3D-style abstract cards using Framer Motion.
- **Performance Metrics**: Animated area charts demonstrating throughput and uptime.
- **Content Sections**: Features grid, real-time stat counters, integrations list, testimonials, and FAQ with accordion interactions.
- **Responsive Design**: Fully adaptive layout for mobile, tablet, and desktop.

#### 2. AI Dashboard OS (`components/Dashboard.tsx`)
The core operational interface, designed to mimic a futuristic Operating System:
- **Real-Time Camera Integration**: Direct access to user webcam (`getUserMedia`) with canvas-based frame processing.
- **Multimodal Websocket Pipeline**:
  - **Video Streaming**: Captures video frames at 1fps (adjustable), converts to base64, and streams to Gemini Model.
  - **Audio Input**: Captures microphone audio (16kHz PCM), processes it via `ScriptProcessorNode`, and streams raw PCM data to the AI.
  - **Audio Output**: Receives raw PCM chunks from Gemini, decodes them to `AudioBuffer`, and plays them back sequentially with queue management to prevent overlap.
- **State Management**: Complex state machine handling `IDLE`, `LISTENING`, `THINKING`, and `SPEAKING` states to drive UI feedback.
- **Visual Feedback**:
  - **Live Audio Visualizers**: CSS/Framer animations that react to the application state (e.g., pulsing microphone, thinking rotation).
  - **System Status Sidebar**: Real-time connection status, neural link metrics, and visual "activity" bars.
  - **OS Chrome**: Custom header with clock, connection quality, and microphone status indicators.

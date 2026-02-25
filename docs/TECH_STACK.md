# VibeMap Technical Stack Manual

## Overview
VibeMap is a social "Vibe" discovery platform built on a modern React + Firebase stack. It focuses on real-time social interactions, location-based discovery ("Roots"), and trusted user networks.

## Core Technologies

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite (Lightning fast HMR & Build)
- **Language**: TypeScript (Strict typing for robustness)
- **Styling**: Tailwind CSS (Utility-first styling system)
- **Icons**: Lucide React
- **Animations**: CSS Transitions, Keyframes in `index.css`

### Backend (Serverless)
- **Platform**: Firebase
- **Database**: Firestore (NoSQL, Real-time)
- **Authentication**: Firebase Auth (Email/Password, Google, Social)
- **Storage**: Firebase Storage (Images, Avatars)
- **Hosting**: Firebase Hosting

### AI / Intelligence
- **LLM**: Google Gemini (via API)
    - Used for: Vibe Analysis, Content Moderation, Smart Location grouping.

## Key Libraries
- `date-fns`: Lightweight date formatting.
- `react-markdown`: Rendering rich text content.
- `firebase`: Official SDK (v10 modular).

## Architecture Patterns
- **Services Pattern**: All Firebase logic is encapsulated in `src/services/` (e.g., `postService.ts`, `userService.ts`). Components interact with services, not directly with Firestore SDK where possible.
- **Hooks Pattern**: Complex state logic (like fetching feeds or chats) is moved to custom hooks in `src/hooks/` (e.g., `useFeed.ts`, `useChat.ts`).
- **Optimistic Updates**: Use local state to reflect changes instantly (Likes, Follows) while the background request processes. Revert on failure.

## File Structure
```
src/
├── components/   # UI building blocks (Feed, Profile, PostCard)
├── hooks/        # Reusable React hooks
├── services/     # Backend API wrappers
├── utils/        # Generic helpers (formatters, error handlers)
├── types.ts      # Global TypeScript definitions
└── App.tsx       # Main Router and State Orchestrator
```

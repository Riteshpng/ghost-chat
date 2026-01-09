# 👻 GhostChat: Encrypted Ephemeral Messaging

![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Redis](https://img.shields.io/badge/Upstash-Redis-red) ![Status](https://img.shields.io/badge/Status-Production_Ready-green)

**GhostChat** is a secure, real-time communication tool designed for zero-trace conversations.

Built on top of a modern Next.js + Redis foundation, this project extends standard real-time capabilities with a custom **Encryption-at-Rest** layer, ensuring that message data remains chemically secure even if the database is compromised.

**[🚀 View Live Demo](https://your-vercel-link-here.com)**

---

## 🌟 Key Engineering Features

Unlike standard chat apps, GhostChat focuses on **security** and **performance optimizations**:

### 🔒 Custom Security Layer (My Implementation)
* **AES-256 Encryption:** Implemented a custom `encryption.ts` module using Node's `crypto` library.
* **Encryption at Rest:** Messages are encrypted *before* they touch the Redis database.
    * *Database View:* `U2FsdGVkX1+...` (Gibberish)
    * *User View:* `Hello World` (Decrypted on retrieval)
* **Scoped Middleware:** Engineered `middleware.ts` to handle race conditions and prevent unauthorized room access using Redis atomic sets.

### ⚡ Performance & UX
* **Optimistic UI:** Utilized **TanStack Query** to render messages instantly (0ms latency), rolling back only if the server fails.
* **Render Optimization:** Refactored the countdown timer logic using **Component Composition** to prevent the "Re-render Bomb" issue, ensuring the heavy chat list remains static while the timer ticks.

---

## 🛠️ Tech Stack

| Component | Technology | Usage |
| :--- | :--- | :--- |
| **Framework** | Next.js 14 | App Router, Server Actions, & API Routes |
| **Database** | Upstash Redis | Ephemeral storage with native TTL (Auto-deletion) |
| **Backend** | ElysiaJS | Lightweight, type-safe route handling |
| **Realtime** | Upstash Realtime | Serverless WebSocket layer |
| **Styling** | Tailwind CSS | Rapid, utility-first UI design |

---

## 🧠 How It Works

### 1. The Encryption Pipeline
To ensure privacy, messages undergo a transformation before storage:

```typescript
// Incoming Message -> Encrypt -> Store in Redis
const dbMessage = {
  ...baseMessage,
  text: encrypt(text) // Stored as cipher text
}

// Socket Emit -> Send Plain Text (Live View)
// We send plain text to the live socket for immediate UI updates,
// but the permanent record in the DB remains encrypted.
2. The "Self-Destruct" Mechanism
Redis TTLs (Time-To-Live) are synchronized across three layers:

Room Meta: meta:room-id expires in 10 mins.

Message History: messages:room-id inherits the room's remaining TTL.

Cleanup: A delete trigger flushes all associated keys instantly upon manual destruction.

🚀 Getting Started
1. Clone the repository
Bash

git clone [https://github.com/yourusername/ghost-chat.git](https://github.com/yourusername/ghost-chat.git)
cd ghost-chat
2. Install dependencies
Bash

npm install
# or
bun install
3. Environment Setup
Create a .env.local file with your Upstash credentials and a 32-character random string for encryption:

Code snippet

ENCRYPTION_KEY="your_super_secret_32_char_key_here"
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."
NEXT_PUBLIC_UPSTASH_REALTIME_URL="..."
NEXT_PUBLIC_UPSTASH_REALTIME_TOKEN="..."
4. Run Development Server
Bash

npm run dev
🤝 Credits & Acknowledgements
This project was built to explore advanced Next.js patterns and Cryptography.

Core realtime architecture inspired by open-source patterns.

Encryption, Middleware Security, and UI Optimizations implemented by [Your Name].

📄 License
MIT
# THE OTHER SIDE

> Your real life has two worlds.

**THE OTHER SIDE** is a full-stack Life RPG that turns real-world goals, habits, study, fitness, and personal tasks into an interactive progression system.

Complete missions in real life → earn XP & Credits → level up → restore corrupted areas → defeat bosses → maintain streaks → survive world events.

The core idea is simple:

**Your real-life progress changes the game world.**

---

## 🎮 Core Gameplay

### THE RIGHT SIDE
Your real world — missions, progress, attributes, streaks and achievements.

### THE OTHER SIDE
A corrupted parallel world that reacts to your inactivity and progress.

Players:

- Create and complete real-world missions
- Earn **XP, Credits and Attribute points**
- Level up using non-linear RPG progression
- Build **MIND, BODY, FOCUS, SPIRIT and CONNECTION**
- Restore corrupted world areas
- Fight world bosses through mission progress
- Spend Credits in **The Arcade**
- Maintain daily streaks and unlock milestones
- Participate in temporary **World Events**
- Validate selected missions using evidence or focus sessions

---

## 🧠 Real-World Verification

To reduce fake progress, missions can use different verification levels:

| Verification | How it works |
|---|---|
| **Self Report** | Player confirms completion |
| **Evidence** | Player submits private text/image evidence |
| **Focus Session** | Server-tracked timed session with heartbeat & activity signals |

Focus sessions use server timestamps and lightweight activity/visibility signals.

**No camera, microphone, screen recording or keystroke-content recording is used.**

Verification produces a **Signal Integrity** score used as a confidence indicator, not as scientific proof.

---

## ⚔️ RPG Progression

Every successful mission can affect multiple systems:

```text
MISSION
   ↓
Verification
   ↓
Server Validation
   ↓
XP + Credits + Attributes
   ↓
Level Progression
   ↓
Streak / Milestone
   ↓
Boss Damage / World Event
   ↓
World Corruption Changes

Progression is server-authoritative, preventing clients from directly awarding themselves XP, Credits or world progress.

🌍 World System

The Other Side contains progressively unlockable areas:

THE GATE
KNOWLEDGE FOREST
FOCUS LAB
IRON PEAK
STILLWATER
THE CITADEL

Completing missions restores the corresponding area and reduces world corruption.

World Bosses

Players encounter original bosses representing real-life obstacles:

THE PROCRASTINATOR
THE DISTRACTION
THE DOUBT
THE SLEEPLESS

Mission completion deals damage while preserving the normal reward system.

🔥 Streaks & Events
Survival Protocol

Daily activity creates persistent streaks, milestones and comeback challenges.

Players can unlock milestones such as:

FIRST SIGNAL → HOLD THE LINE → FORTIFIED → UNBREAKABLE → BEYOND THE GATE

World Events

Temporary server-controlled events react to player activity.

Examples:

SIGNAL SURGE
STATIC STORM
IRON WAKE
STILL SIGNAL
OPEN CHANNEL
BREACH WARNING

Events add temporary objectives, rewards and changes to the Other Side.

🏗️ Architecture
                    ┌─────────────────┐
                    │   Next.js App   │
                    │  React + UI     │
                    └────────┬────────┘
                             │
                    Server Actions / API
                             │
                    ┌────────▼────────┐
                    │ Game Logic      │
                    │ Auth / Rewards  │
                    │ Verification   │
                    │ World / Streaks│
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Prisma ORM      │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    └─────────────────┘
Server-authoritative flow
Client Request
     ↓
Authentication
     ↓
Ownership Validation
     ↓
Mission / Verification Validation
     ↓
Game Engine Calculation
     ↓
Database Transaction
     ↓
Updated Player State

Rewards, mission ownership, duplicate completion prevention, streaks, corruption, boss damage and event progress are validated on the server.

🛠️ Tech Stack

Frontend

Next.js 16
React 19
TypeScript
Tailwind CSS
Framer Motion
Lucide React

Backend

Next.js API routes / server-side logic
Prisma ORM
PostgreSQL
Custom JWT sessions
jose
bcryptjs


📁 Project Structure
app/
  api/              # Server APIs
  dashboard/        # Player experience
  missions/         # Mission UI
  world/            # World / corruption
  arcade/           # Economy / inventory

components/         # Reusable UI
lib/
  game/             # Core game engine
  auth/             # Authentication
  db/               # Database utilities

prisma/
  schema.prisma     # Database schema
public/             # Static assets

🚀 Run Locally
1. Clone
git clone <YOUR_REPOSITORY_URL>
cd the-other-side
2. Install
npm install
3. Configure environment

Create .env:

DATABASE_URL="your_postgresql_connection_string"
JWT_SECRET="your_secure_secret"

See .env.example for the required variables.

4. Setup database
npx prisma migrate dev
5. Start development server
npm run dev

Open:

http://localhost:3000
Production build
npm run build
npm start

🎨 Design Philosophy

The experience is built around an original supernatural mystery aesthetic:

THE RIGHT SIDE

Dark navy / black
Clean interfaces
Blue-white signals
Calm progression

THE OTHER SIDE

Crimson / black
Distortion
Fog
Particles
Flickering signals
Environmental reactions

The visual language takes inspiration from retro supernatural atmosphere and CRT-era mystery without using copyrighted characters, names, locations or story elements from existing franchises.

💡 What Makes It Different?

Most productivity apps say:

"Complete your task."

THE OTHER SIDE says:

"Something on the other side is getting stronger because you didn't."

A real-world action doesn't just check a box.

It can:

increase your level → strengthen your attributes → maintain your streak → damage a boss → restore the world → change what happens next.

The goal is to make productivity feel less like a checklist and more like an RPG where your real life is the gameplay.

🎥 Demo Flow

Recommended demo sequence:

Create Character
      ↓
Create Mission
      ↓
Start Focus / Evidence Verification
      ↓
Complete Mission
      ↓
XP + Credits + Attributes
      ↓
Level / Streak Update
      ↓
Boss Damage
      ↓
World Event Progress
      ↓
Corruption Changes
      ↓
THE OTHER SIDE Reacts

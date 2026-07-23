# 🚀 NovaTask: AI-Powered Productivity Workspace

NovaTask is an immersive, next-generation productivity workspace built with the **MERN** stack. It features **Nova**, a real-time AI voice assistant powered by the **Gemini API** that allows users to interact with their dashboard, manage tasks, update details, and navigate the workspace hands-free.

---

## ✨ Features

### 🎙️ AI Voice Assistant (Nova)
- **Natural Voice Commands**: Speak naturally to create, edit, delete, or mark tasks as completed.
- **Intelligent Navigation**: Ask Nova to open pages (e.g., "Go to settings", "Open tasks").
- **Gemini-Powered Function Calling**: Seamless conversion of spoken intent into workspace actions.
- **Local Fallback Parser**: A robust semantic parsing engine that takes over if API limits are reached or keys are missing.
- **Visual Feedback**: Interactive, breathing voice orb avatar that visualizes assistant listening states.

### 📅 Advanced Task Management
- **Interactive Kanban & List Views**: Manage tasks seamlessly with responsive visual columns.
- **Contextual Workflows**: Update tasks using voice context (e.g., editing descriptions, priority shifts, due dates).
- **Categories & Tagging**: Categorize tasks into Design, Development, Backend, Content, Meetings, or General.
- **AI Suggestions**: Dynamically generated optimization recommendations for task prioritization and workflow efficiency.
- **Bulk Actions**: Select multiple tasks to update status or delete concurrently.

### 🔐 Secure Modern Authentication
- **Passwordless Verification**: Sign up and log in via secure OTP (One-Time Password) emails powered by Nodemailer.
- **Google OAuth Integration**: Direct authentication through Google Accounts via Passport.js.
- **Robust Token Security**: Dual-token architecture using short-lived Access Tokens (JWT) and secure, `httpOnly` Refresh Tokens.
- **Security Middleware**: Native rate-limiting, CORS, cookie parsing, and Helmet security configuration.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion, TanStack React Query, Axios, Lucide React, React Router Dom v6 |
| **Backend** | Node.js, Express, MongoDB (Mongoose ODM), Passport.js, Zod (validation), Nodemailer, Morgan |
| **AI Processing** | Google Gemini API (Function Calling via `gemini-2.5-flash`), Local Regex Semantic Fallback |

---

## 📂 Project Structure

```
NovaTask/
├── backend/
│   ├── config/             # DB and Passport configurations
│   ├── controllers/        # Route controllers (Auth, Task, User, Voice)
│   ├── middleware/         # Auth protector, rate limiter, error handler
│   ├── models/             # Mongoose schemas (User, Task, OTP)
│   ├── routes/             # API Endpoints
│   ├── utils/              # JWT, token hashers, and mail senders
│   ├── validators/         # Zod schemas for input validation
│   ├── server.js           # Server entry point
│   └── .env.example        # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/     # VoiceOrb, NovaAvatar, Auth modals, etc.
│   │   ├── contexts/       # React contexts (Auth, Voice)
│   │   ├── layouts/        # Page layout wrappers
│   │   ├── pages/          # Main views (Dashboard, Tasks, Settings, Profile)
│   │   └── services/       # API integration layers
│   ├── package.json        # Frontend configuration & dependencies
│   └── vite.config.js      # Vite compilation configurations
├── package.json            # Root workspace script launcher
└── vercel.json             # Vercel deployment configuration
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** (Local instance running or MongoDB Atlas Connection String)
- **Gmail Account & App Password** (For sending OTP emails via Nodemailer)
- **Gemini API Key** (Get one from [Google AI Studio](https://aistudio.google.com/))

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NovaTask
   ```

2. **Install Workspace Dependencies**
   Run the root-level script to install dependencies for the root, backend, and frontend concurrently:
   ```bash
   npm run install-all
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the `backend/` directory and configure the variables based on [backend/.env.example](file:///c:/Users/user/Desktop/NovaTask/backend/.env.example):
   ```ini
   PORT=5000
   NODE_ENV=development
   CLIENT_URL=http://localhost:5173
   MONGODB_URI=mongodb://127.0.0.1:27017/novatask
   JWT_ACCESS_SECRET=your_jwt_access_secret_here
   JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GEMINI_API_KEY=your_gemini_api_key_here
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   ```

4. **Run the Application**
   Launch both backend and frontend servers in development mode using the root workspace command:
   ```bash
   npm run dev
   ```
   - **Frontend App**: `http://localhost:5173`
   - **Backend API**: `http://localhost:5000`

---

## 🎙️ Sample Voice Commands

Try saying the following phrases while interacting with Nova's Voice Orb:

| Category | Example Command | Action Triggered |
| :--- | :--- | :--- |
| **Navigation** | *"Go to my tasks"* or *"Open settings"* | Navigates page context instantly |
| **Creation** | *"Create task Design Landing Page project name Website"* | Creates a task card with title & details |
| **Status Update** | *"Mark task Design Landing Page as completed"* | Moves target task to the Completed/Done column |
| **Field Update** | *"Change description to update UI colors"* | Contextually edits details of the active task |
| **Priority Shift** | *"Change priority of task to high"* | Highlights tasks requiring immediate action |
| **Task Removal** | *"Delete task Design Landing Page"* | Triggers confirmation modal |
| **Session Control** | *"Log out of my workspace"* | Destroys current active tokens and logs out |

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new account (triggers verification OTP)
- `POST /api/auth/verify-otp` - Verify email OTP to activate account
- `POST /api/auth/login/send-otp` - Initiate passwordless OTP login
- `POST /api/auth/login/verify-otp` - Complete OTP login
- `POST /api/auth/refresh` - Refresh active session tokens
- `POST /api/auth/logout` - Invalidate refresh token and log out
- `GET /api/auth/google` - Initiate Google OAuth flow

### Task Management
- `GET /api/tasks` - Retrieve user tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update an existing task
- `DELETE /api/tasks/:id` - Remove a task
- `POST /api/tasks/bulk` - Apply actions (status updates or deletion) on multiple tasks
- `GET /api/tasks/ai-suggest` - Fetch task planning suggestions

### Voice Processing
- `POST /api/voice/process` - Submits a voice transcript with page context to analyze and parse using Gemini function declarations.

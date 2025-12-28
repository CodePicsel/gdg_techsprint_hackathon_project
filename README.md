
# 🌍 RiverBot

**AI-Powered Real-Time Plastic Waste Detection System**

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat&logo=firebase)](https://firebase.google.com/)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render)](https://render.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A computer vision system that detects plastic waste in real-time using AI, providing instant analytics and insights to combat environmental pollution.

[RiverBot Demo](https://riverbot.netlify.app)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [Deployment](#deployment)
- [Performance Notes](#performance-notes)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

RiverBot is an AI-powered system designed for the **GDG TechSprint Hackathon** that leverages computer vision to detect and classify plastic waste in real-time. The system provides:

- **Real-time Detection**: Instant plastic waste identification via webcam
- **Live Analytics Dashboard**: Real-time statistics and visualizations
- **Multi-type Classification**: Identifies different types of plastic waste
- **Cloud-Based Architecture**: Scalable, serverless infrastructure
- **Cost-Effective**: Runs entirely on free tier services (hackathon-friendly)

---

## ✨ Features

### 🎥 **Real-Time Camera Detection**
- Live webcam feed processing
- Bounding box visualization on detected objects
- Confidence score display
- Frame-by-frame analysis

### 📊 **Analytics Dashboard**
- **Total detections** counter
- **Distribution charts** by plastic type
- **Recent detection log** with timestamps
- **Real-time updates** using Firestore listeners

### 🧠 **AI-Powered Backend**
- Optimized for plastic waste classification
- Hosted on Render with auto-scaling
- RESTful API endpoint

### 🔥 **Firebase Integration**
- Firestore for real-time data storage
- Automatic data aggregation
- Secure, scalable NoSQL database
- Real-time synchronization across clients

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                         │
│                   (React Frontend - netlify)                 │
└─────────────┬───────────────────────────┬───────────────────┘
              │                           │
              │ 1. Image Frame            │ 3. Detection Data
              │                           │
              ▼                           ▼
    ┌──────────────────┐        ┌──────────────────┐
    │   Render.com     │        │    Firebase      │
    │   AI Backend     │        │   Firestore      │
    │   (FastAPI)      │        │   Database       │
    │                  │        │                  │
    │                  │        │  Real-time       │
    │   detect API     │        │  Aggregation     │
    └──────────────────┘        └──────────────────┘
            │                           │
            │ 2. Detection Results      │ 4. Real-time Updates
            └───────────────────────────┘
```

### Data Flow

1. **Capture**: User clicks "Detect" → Frontend captures webcam frame  
2. **Detection**: Frame sent to Render AI backend → YOLOv8 processes image  
3. **Storage**: Detection results sent to Firebase Firestore  
4. **Display**: Dashboard updates in real-time via Firestore listeners

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 18.2 with Vite
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Real-time Data**: Firebase SDK
- **Deployment**: netlify

### **AI Backend**
- **Framework**: FastAPI (Python)
- **Image Processing**: OpenCV, Pillow
- **Deployment**: Render.com (Free Tier)

### **Database & Backend Services**
- **Database**: Firebase Firestore
- **Real-time Sync**: Firestore SDK
- **Hosting**: Firebase Hosting (optional)

---

## 📦 Prerequisites

### Required Software

```bash
Node.js >= 18.0.0
npm >= 9.0.0
Python >= 3.9 (for AI backend)
Git
```

### Required Accounts (All Free Tier)

- [Render Account](https://render.com/) - AI backend hosting (optional: local run recommended for zero latency)
- [Firebase Account](https://firebase.google.com/) - Database & hosting
- [netlify Account](https://netlify.com/) - Frontend hosting (optional)

---

## 🚀 Installation

### 1. Clone Repository

```bash
git clone https://github.com/CodePicsel/gdg_techsprint_hackathon_project.git
cd gdg_techsprint_hackathon_project
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

> **Note:** For hackathon/demo purposes this repository includes a working `.env` file with demo values. You may not need to configure Firebase to see the app in action. (Keep in mind .env is published for rapid demo; in production, NEVER publish secrets.)

### 3. Firebase Setup (optional for full backend persistence)
If you want to reconfigure Firestore yourself, follow the steps in the original configuration section — otherwise the demo `.env` should work.

---

## ⚙️ Configuration

### Frontend Environment Variables

Create `frontend/.env` (if you want to override):

```bash
# Render AI Backend URL
VITE_API_URL=https://gdg-techsprint-hackathon-project.onrender.com

# Firebase Configuration (demo values already included in repo .env)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

**Important**: For a zero-latency local demo, set `VITE_API_URL` to your local backend (e.g., `http://localhost:8000`) by creating a `.env.local` file or editing `.env` temporarily.

---

## 💻 Running Locally

> **Recommended for presentations:** Run locally to avoid Render cold-start latency and ensure instant detection.

### Backend (local)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn detect_server:app --host 0.0.0.0 --port 8000
```

### Frontend (local)

```bash
cd frontend
npm install
# override API URL to local backend for instant response
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm run dev
# open http://localhost:5173
```

---

## 🌐 Deployment

### Frontend (Netlify)
Your production frontend is hosted at: https://riverbot.netlify.app

### Backend (Render)
The AI backend is hosted on Render (free tier) for quick demos. See **Performance Notes** below about free-tier behavior and how to avoid cold-start latency.

---

## ⚡ Performance Notes

**Important — Render free tier behavior (short and clear):**

- Free tier services **sleep after ~15 minutes** of inactivity.
- The **first** request after sleep triggers a startup (cold start) which commonly takes **30–60 seconds**.
- Subsequent requests are fast.

**What we recommend for a smooth demo:**

- **Pre-warm** Render 5 minutes before demo:
  ```bash
  curl https://your-app.onrender.com/health
  ```
- Or use a free uptime service (UptimeRobot) to ping every 5 minutes to keep the service awake.
- **Best option** for zero latency: run frontend + backend locally (see Running Locally above).

---

## 📖 Usage

### 1. Open the Application
- Hosted: https://riverbot.netlify.app
- Local: http://localhost:5173

### 2. Camera Detection
1. Click "Camera" tab
2. Allow camera permissions
3. Click "Detect"
   - If hosted on Render and sleepy, the first detect may take up to 30–60 seconds.
   - If running locally, detection is immediate.

---

## 📡 API Documentation

### `POST /detect`

**Request**:
- `file`: image file (JPEG/PNG)
- `conf`: confidence threshold (default: 0.35)

**Response**:
```json
{
  "boxes": [
    {
      "x": 123.4,
      "y": 56.7,
      "w": 210.3,
      "h": 180.9,
      "score": 0.92,
      "class_id": 1,
      "class_name": "plastic_bottle"
    }
  ]
}
```

---

## 🐛 Troubleshooting

- **Camera not starting**: check permissions and HTTPS
- **Detect takes long (>60s)**: backend likely sleeping on Render — pre-warm or run locally
- **Failed to save to Firestore**: demo `.env` included; if you changed values, restore or configure Firestore
- **CORS errors**: run frontend + backend locally to avoid CORS during demo

---


## 📄 License

MIT License — see `LICENSE`.

---

## 👥 Team

**Team RiverBot — GDG TechSprint Hackathon**

- GitHub: https://github.com/CodePicsel/gdg_techsprint_hackathon_project

---

**Made with care for a cleaner planet.**

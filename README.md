# 🌍 RiverBot

**AI-Powered Real-Time Plastic Waste Detection System**

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=flat&logo=firebase)](https://firebase.google.com/)
[![Render](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat&logo=render)](https://render.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A computer vision system that detects plastic waste in real-time using AI, providing instant analytics and insights to combat environmental pollution.

![RiverBot Demo](https://riverbot.netlify.app/)

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
- **Cost-Effective**: Runs entirely on free tier services

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
2. **Detection**: Frame sent to Render AI backend processes image
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

- [Render Account](https://render.com/) - AI backend hosting
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

### 3. Firebase Setup

#### 3.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name: `RiverBot` (or your choice)
4. Disable Google Analytics
5. Click "Create project"

#### 3.2 Enable Firestore

1. Click "Firestore Database" in sidebar
2. Click "Create database"
3. Select "Start in production mode"
4. Choose your location
5. Click "Enable"

#### 3.3 Get Firebase Config

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" → Click Web icon
3. Register app (nickname: `RiverBot-web`)
4. Copy the config object

#### 3.4 Initialize Firebase CLI

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize Firestore (in project root)
firebase init firestore

# Select your project
# Accept defaults for rules and indexes
```

### 4. Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

---

## ⚙️ Configuration

### Frontend Environment Variables

Create `frontend/.env`:

```bash
# Render AI Backend URL
VITE_API_URL=https://your-app-name.onrender.com

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdefghijklmnop
```

**📝 Note**: Get your Render backend URL from your Render dashboard after deploying the AI backend.

### Firestore Security Rules

The `firestore.rules` file should contain:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /detections/{document} {
      allow read: if true;
      allow write: if true;
    }
    
    match /stats/{document=**} {
      allow read: if true;
      allow write: if true;
    }
    
    match /detectionLog/{document} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

---

## 💻 Running Locally

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### Test AI Backend (Render)

Your AI backend is already deployed on Render. Test it:

```bash
curl https://your-app.onrender.com/health
```

---

## 🌐 Deployment

### Deployment - Frontend (Netlify)

**Option 1: Netlify CLI**


```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd frontend

# Production deployment
netlify deploy --prod --dir=dist
```


### Option 2: GitHub Integration (Recommended)**
1. Push to GitHub
2. Go to [Netlify](https://app.netlify.com/)
3. "New site from Git" → GitHub → your repo
4. Build command: `npm run build`
5. Publish directory: `dist`
6. Add env vars in Site settings → Environment variables


### Environment Variables on netlify

Add these in netlify Dashboard → Project Settings → Environment Variables:

```
VITE_API_URL = https://your-app.onrender.com
VITE_FIREBASE_API_KEY = your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN = your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = your-project-id
VITE_FIREBASE_STORAGE_BUCKET = your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID = your_sender_id
VITE_FIREBASE_APP_ID = your_app_id
```

---

## ⚡ Performance Notes

### Render Free Tier Behavior

**⚠️ IMPORTANT**: The AI backend is hosted on **Render's free tier**, which has specific performance characteristics:

#### Cold Start Latency

- **Service Sleep**: Free tier services sleep after **15 minutes** of inactivity
- **Wake-up Time**: First request takes **30-60 seconds** to spin up
- **Subsequent Requests**: Fast response times after initial wake-up

#### User Experience

When clicking "Detect" for the first time or after inactivity:

```
Status: "uploading frame..."        ← Instant
Status: "running AI model..."       ← 30-60 seconds (cold start)
Status: "detected X items"          ← Instant after wake-up
```

#### Upgrade Option

**Render Starter Plan**: $7/month
- No sleep/cold starts
- Always-on service
- Faster response times

### Firebase Performance

- **Firestore Reads**: <100ms latency
- **Real-time Updates**: Instant (<50ms)
- **Writes**: <200ms latency
- **No Cold Start**: Always active

---

## 📖 Usage

### 1. Open the Application

Navigate to your deployed frontend URL or `http://localhost:5173`

### 2. Camera Detection

1. Click "Camera" tab
2. Allow camera permissions when prompted
3. Click "Detect" button
4. Wait for AI processing (30-60s on first use, then instant)
5. View detected plastic items with bounding boxes

### 3. View Dashboard

1. Click "Dashboard" tab
2. See real-time statistics:
   - Total detections
   - Plastic type distribution
   - Recent detection log
3. Dashboard updates automatically as new detections occur

### 4. Interpreting Results

**Bounding Boxes**:
- Green boxes indicate detected plastic items
- Labels show plastic type and confidence score
- Example: `plastic_bottle 92%`

**Dashboard Stats**:
- **Total Detections**: Cumulative count of all detected items
- **Plastic Types**: Number of unique plastic categories found
- **Distribution**: Percentage breakdown by plastic type
- **Recent Detections**: Last 10 detection events with timestamps

---

## 📡 API Documentation

### AI Detection Endpoint (Render)

#### `POST /detect`

Processes an image and returns detected plastic objects.

**Request**:
```http
POST https://your-app.onrender.com/detect
Content-Type: multipart/form-data

Parameters:
- file: image file (JPEG/PNG)
- conf: confidence threshold (default: 0.35)
```

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

**cURL Example**:
```bash
curl -X POST https://your-app.onrender.com/detect \
  -F "file=@image.jpg" \
  -F "conf=0.35"
```

### Firestore Data Structure

#### Collections

**`detections`**
```javascript
{
  timestamp: Timestamp,
  className: string,      // "plastic_bottle"
  confidence: number,     // 0.92
  classId: number,        // 1
  bbox: {
    x: number,
    y: number,
    w: number,
    h: number
  }
}
```

**`detectionLog`**
```javascript
{
  timestamp: Timestamp,
  className: string,
  confidence: number,
  order: number          // For sorting
}
```

---

## 🐛 Troubleshooting

### Issue: "Camera not starting"

**Cause**: Browser permissions not granted

**Solution**:
1. Check browser address bar for camera icon
2. Click and allow camera access
3. Refresh page
4. Try HTTPS (required for camera on some browsers)

### Issue: "Detection takes too long (>60 seconds)"

**Cause**: Render service is in cold start

**Solution**:
1. Wait for initial wake-up (30-60 seconds)
2. Subsequent detections will be fast
3. Pre-warm service before demo (see Performance Notes)

### Issue: "Failed to save to Firestore"

**Cause**: Firebase configuration incorrect

**Solution**:
1. Check `.env` file has correct Firebase config
2. Verify Firestore database is enabled
3. Check browser console for specific error
4. Ensure Firestore rules allow writes

### Issue: "Dashboard not updating"

**Cause**: Real-time listener not connected

**Solution**:
1. Check browser console for Firebase errors
2. Verify internet connection
3. Check Firestore security rules
4. Try refreshing the page

### Issue: "Environment variables not loading"

**Cause**: Vite requires restart after `.env` changes

**Solution**:
```bash
# Stop dev server (Ctrl+C)
rm -rf node_modules/.vite  # Clear cache
npm run dev
```

### Issue: "CORS error from Render"

**Cause**: CORS not configured on backend

**Solution**: Contact backend developer or check Render logs

---

## 📊 Free Tier Limits

### Service Usage During Hackathon

| Service | Free Limit | Expected Usage | Status |
|---------|------------|----------------|--------|
| **Render** | 750 hrs/month | ~10 hours | ✅ Safe |
| **Firestore Reads** | 50K/day | ~100 | ✅ Safe |
| **Firestore Writes** | 20K/day | ~500 | ✅ Safe |
| **Firestore Storage** | 1GB | <1MB | ✅ Safe |

**Total Cost: $0** 🎉

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**GDG TechSprint Hackathon - Team RiverBot**

- GitHub: [@CodePicsel](https://github.com/CodePicsel)
- Project: [gdg_techsprint_hackathon_project](https://github.com/CodePicsel/gdg_techsprint_hackathon_project)

---

## 🙏 Acknowledgments

- **GDG TechSprint Hackathon** for the opportunity
- **Firebase** for real-time database infrastructure
- **Render** for free tier AI hosting
- **Netlify** for frontend hosting

---

## 📞 Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Search existing [GitHub Issues](https://github.com/CodePicsel/gdg_techsprint_hackathon_project/issues)
3. Open a new issue with detailed description

---

## 🔮 Future Enhancements

- [ ] Authentication system
- [ ] Multi-user support
- [ ] Export detection reports
- [ ] Mobile app (React Native)
- [ ] Historical data analytics
- [ ] Email notifications
- [ ] Integration with waste management systems

---

## 📈 Project Stats

![GitHub stars](https://img.shields.io/github/stars/CodePicsel/gdg_techsprint_hackathon_project?style=social)
![GitHub forks](https://img.shields.io/github/forks/CodePicsel/gdg_techsprint_hackathon_project?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/CodePicsel/gdg_techsprint_hackathon_project?style=social)

---

<div align="center">

**Made with ❤️ for a cleaner planet 🌍**

[⬆ Back to Top](#-RiverBot)

</div>

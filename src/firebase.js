// src/firebase.js
// -------------------------------------------------------
// 🔥 Firebase Client Initialization (STRICT MODE SAFE)
// Modular SDK (v9+) + Analytics lazy loading
// -------------------------------------------------------

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// -------------------------------------------------------
// 🔧 Firebase Configuration
// -------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyCdGBi-1nhMR3XerPS5amrAnUv6M1v9M04",
  authDomain: "slashcoder-3d1e6.firebaseapp.com",
  projectId: "slashcoder-3d1e6",
  storageBucket: "slashcoder-3d1e6.appspot.com",
  messagingSenderId: "928670782761",
  appId: "1:928670782761:web:0c8c3343aeb359da29d338",
};

// -------------------------------------------------------
// 🚀 Initialize Firebase (StrictMode-safe)
// -------------------------------------------------------
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// -------------------------------------------------------
// 🔐 Export Firebase Services
// -------------------------------------------------------
export const auth = getAuth(app);
export const db = getFirestore(app);

// -------------------------------------------------------
// 📊 Optional: Analytics (lazy load, production only)
// -------------------------------------------------------
let analytics = null;

async function initAnalytics() {
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    try {
      const { getAnalytics } = await import("firebase/analytics");
      analytics = getAnalytics(app);
    } catch (err) {
      console.warn("⚠ Analytics not initialized:", err);
    }
  }
}

initAnalytics();

export { analytics };
export default app;

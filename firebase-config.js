/**
 * Firebase Configuration for Ragna-Memory Player Count Feature
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.firebase.google.com and create a new project
 * 2. Enable Realtime Database (choose "Start in test mode" for development)
 * 3. In Project Settings, create a Web app and copy your config
 * 4. Replace the config object below with your actual Firebase credentials
 * 5. In Firebase Realtime Database, create these rules (for security):
 * 
 *    {
 *      "rules": {
 *        "activeSessions": {
 *          ".read": true,
 *          ".write": true,
 *          ".indexOn": ["sessionId"]
 *        }
 *      }
 *    }
 *
 * Note: This rule set is intentionally permissive for early development and demo purposes.
 */

const firebaseConfig = {
    apiKey: "AIzaSyCl86voAuwTDM1QmSVpqePFoJM15t8JCpk",
    authDomain: "ragna-memories.firebaseapp.com",
    databaseURL: "https://ragna-memories-default-rtdb.firebaseio.com",
    projectId: "ragna-memories",
    storageBucket: "ragna-memories.firebasestorage.app",
    messagingSenderId: "459403666259",
    appId: "1:459403666259:web:d2fb4f055f4663b280b7a6",
    measurementId: "G-JHL16BXT4N"
  };

// Firebase initialized status
window.firebaseInitialized = false;

// Initialize Firebase when the library loads
function initializeFirebase() {
    if (window.firebase && firebaseConfig.projectId !== "YOUR_PROJECT_ID") {
        try {
            firebase.initializeApp(firebaseConfig);
            window.firebaseInitialized = true;
            console.log("Firebase initialized successfully");
        } catch (error) {
            console.error("Firebase initialization failed:", error);
        }
    } else if (firebaseConfig.projectId === "YOUR_PROJECT_ID") {
        console.warn("Firebase config not set up yet. Player count tracking disabled.");
    }
}

// Call initialization when script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFirebase);
} else {
    initializeFirebase();
}

# Issue #9: Live Player Count Implementation Guide

## Overview
This implementation adds a real-time player count indicator to Ragna-Memory using Firebase Realtime Database, showing how many adventurers are currently online.

## Files Modified

1. **index.html** - Added Firebase SDK references and player count UI elements
2. **game.js** - Added session tracking logic and Firebase integration
3. **firebase-config.js** - New configuration file for Firebase credentials (NEW)

## Setup Instructions

### Step 1: Create a Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create Project" and choose a name (e.g., "ragna-memories")
3. Follow the setup wizard and create the project

### Step 2: Enable Realtime Database
1. In your Firebase project, go to **Build > Realtime Database**
2. Click "Create Database"
3. Choose **Start in test mode** (for development)
4. Select a database location (preferably closest to your users)
5. Click "Enable"

### Step 3: Configure Database Rules
1. In Realtime Database, go to the **Rules** tab
2. Replace the rules with:
```json
{
  "rules": {
    "activeSessions": {
      ".read": true,
      ".write": true,
      ".indexOn": ["sessionId"]
    }
  }
}
```
3. Click "Publish"

> Note: This rule set is intentionally permissive for this feature and is suitable for a public demo or early development. If you want more security later, restrict writes or require authentication.

### Step 4: Get Your Firebase Config
1. Go to **Project Settings** (gear icon) > **General**
2. Scroll down to "Your apps" section
3. Click "Create app" and select "Web"
4. Register the app
5. Copy the Firebase config object

### Step 5: Update firebase-config.js
1. Open `firebase-config.js` in the project
2. Replace the `firebaseConfig` object with your credentials:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",  // Copy from Firebase
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

## Features Implemented

### 1. Real-Time Player Count
- Shows active player count in two locations:
  - **Welcome screen**: "Adventurers Online" display below the title
  - **Game header**: "Online" counter next to the Rank display

### 2. Automatic Session Management
- When a player clicks "Begin Quest", a session is created in Firebase
- Sessions are automatically removed when:
  - Player leaves the page
  - Player closes the browser/tab
  - Session times out after 30 minutes (safety measure)

### 3. Session Data Tracked
- Unique session ID
- Join timestamp
- Adventurer name
- Selected rank (difficulty)

## How It Works

1. **Initialization**: When the page loads, Firebase player count tracking starts
2. **Welcome Screen**: Before starting a game, players see the live player count
3. **Starting a Quest**: When "Begin Quest" is clicked, the player's session is added to Firebase
4. **Real-Time Updates**: All players receive live updates of the player count
5. **Cleanup**: When the player navigates away or closes the page, their session is removed

## Testing

### Local Testing
1. Update `firebase-config.js` with your Firebase credentials
2. Open the game in one browser window
3. Open the game in another browser window/tab or different browser
4. Start a quest in one window
5. Observe the player count update in both windows

### Production Deployment
1. Ensure `firebase-config.js` is deployed with your project
2. The live player count will work immediately on the deployed site
3. Firebase connection is automatic with the proper config

## Troubleshooting

### Player Count Not Showing
- Ensure `firebase-config.js` has valid Firebase credentials
- Check browser console for errors (F12 > Console)
- Verify Firebase Realtime Database rules allow *.read on activeSessions

### Sessions Not Recording
- Check Firebase console to see if data is being written to `activeSessions`
- Ensure "Begin Quest" button was clicked (not just opening welcome screen)
- Check browser console for Firebase errors

### High Player Count Visible
- This is normal if database has old sessions
- Old sessions will eventually time out (30 min auto-cleanup)
- Can manually clear all sessions in Firebase console under Data > activeSessions

## Security Considerations

⚠️ **For Production**:
- Current rules allow public read access
- Consider hiding exact player count in production or using restricted rules
- Update rules to require authentication if needed:
```json
{
  "rules": {
    "activeSessions": {
      ".read": "auth != null",
      ".write": false
    }
  }
}
```

## Future Enhancements
- Filter players by rank (show separate counts per difficulty)
- Add player indicators (currently playing vs in menu)
- Store player statistics and leaderboards
- Implement messaging/chat between players
- Add server-side validation of sessions

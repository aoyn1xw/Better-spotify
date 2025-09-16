# Spotify Now Playing Web App

A modern web application that displays your currently playing Spotify track with a beautiful, dynamic interface. Built with React frontend and Node.js/Express backend, utilizing the Spotify Web API.

## Features

- **Spotify Authentication**: Secure OAuth 2.0 login flow
- **Real-time Playback**: Displays current track information in real-time
- **Dynamic Backgrounds**: Background colors change based on album art
- **Progress Tracking**: Visual progress bar with time indicators
- **Interactive Controls**: Play/pause and navigation controls
- **Lyrics Panel**: Toggleable lyrics display (mock implementation)
- **Responsive Design**: Works on all device sizes
- **Smooth Animations**: Polished UI with Framer Motion animations

## Tech Stack

- **Frontend**: React, TailwindCSS, Framer Motion
- **Backend**: Node.js, Express
- **APIs**: Spotify Web API
- **Authentication**: OAuth 2.0

## Prerequisites

- Node.js (v14 or higher)
- Spotify Developer Account
- Spotify Client ID and Client Secret

## Setup Instructions

### 1. Spotify Developer Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URIs:
   - `http://localhost:5000/callback` (for development)
   - Your production callback URL
4. Note your Client ID and Client Secret

### 2. Backend Setup

1. Create a `.env` file in the root directory:
```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SP

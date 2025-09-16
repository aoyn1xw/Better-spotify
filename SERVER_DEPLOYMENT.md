# Better Spotify - Backend Server

This is the backend server for the Better Spotify application.

## Deployment Instructions

### Option 1: Deploy to Render.com (Recommended)

1. Sign up for an account at [render.com](https://render.com)
2. Create a new Web Service
3. Connect your GitHub repository 
4. Configure the service:
   - Name: spotify-auth-server-better-spotify
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add these environment variables:
   - `SPOTIFY_CLIENT_ID`: Your Spotify app client ID
   - `SPOTIFY_CLIENT_SECRET`: Your Spotify app client secret
   - `REDIRECT_URI`: `https://spotify-auth-server-better-spotify.onrender.com/callback` (once the server is deployed)
   - `FRONTEND_URI`: `https://ayon1xw.me/Better-spotify`
   - `NODE_ENV`: `production`

### Option 2: Deploy to Heroku

1. Create a Heroku account if you don't have one
2. Install the Heroku CLI
3. Run these commands:
   ```bash
   heroku login
   heroku create better-spotify-backend
   git push heroku main
   ```
4. Set the environment variables in the Heroku dashboard

## Local Development

1. Create a `.env` file with these variables:
   ```
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   REDIRECT_URI=http://localhost:5000/callback
   FRONTEND_URI=http://localhost:3000
   ```
2. Run `npm install`
3. Run `node server.js`
4. The server will be available at http://localhost:5000

## Important Note

Make sure to update your Spotify Developer Dashboard with the correct redirect URI:
- For local development: `http://localhost:5000/callback`
- For production: `https://spotify-auth-server-better-spotify.onrender.com/callback` (or your own server URL)
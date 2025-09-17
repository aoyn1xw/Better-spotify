// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const querystring = require('querystring');
const axios = require('axios');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Configure CORS to allow requests from your frontend domain
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://ayon1xw.me/Better-spotify'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// Spotify API credentials
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
// Try hardcoded redirect URI to troubleshoot INVALID_CLIENT error
const REDIRECT_URI = 'https://better-spotify-4y6p.onrender.com/callback';
// For local development, uncomment the line below instead
// const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:5000/callback';
// Hardcode frontend URI for testing
const FRONTEND_URI = process.env.FRONTEND_URI || 'https://ayon1xw.me/Better-spotify';

// Determine if we're in production
const isProd = process.env.NODE_ENV === 'production';

// Store tokens in memory (in production, use a database)
let refreshTokens = new Set();
let currentToken = null;

// Helper function to generate random string for state
const generateRandomString = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// Helper function to get access token
const getAccessToken = async (refreshToken) => {
  const authString = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  
  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      querystring.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }),
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    return {
      access_token: response.data.access_token,
      expires_in: response.data.expires_in
    };
  } catch (error) {
    console.error('Error refreshing token:', error.response?.data || error.message);
    throw error;
  }
};

// Login route - redirects to Spotify authorization
app.get('/login', (req, res) => {
  const state = generateRandomString(16);
  const scope = 'user-read-private user-read-email user-read-playback-state user-read-currently-playing';
  
  // Super verbose logging
  console.log('=========== LOGIN ROUTE ===========');
  console.log('CLIENT_ID:', CLIENT_ID);
  console.log('CLIENT_SECRET is set:', !!CLIENT_SECRET);
  console.log('REDIRECT_URI:', REDIRECT_URI);
  console.log('Request origin:', req.headers.origin || 'No origin');
  console.log('Request referer:', req.headers.referer || 'No referer');
  console.log('==================================');
  
  // Build auth URL with querystring
  const authUrl = 'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: scope,
      redirect_uri: REDIRECT_URI,
      state: state
    });
  
  console.log('Full auth URL:', authUrl);
  
  res.redirect(authUrl);
});

// Callback route - handles Spotify's response
app.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  
  // Super verbose logging
  console.log('=========== CALLBACK ROUTE ===========');
  console.log('Code exists:', !!code);
  console.log('State exists:', !!state);
  console.log('CLIENT_ID:', CLIENT_ID);
  console.log('CLIENT_SECRET is set:', !!CLIENT_SECRET);
  console.log('REDIRECT_URI:', REDIRECT_URI);
  console.log('Query params:', req.query);
  console.log('======================================');
  
  if (state === null) {
    console.log('Error: state_mismatch - redirecting to error page');
    res.redirect(`/?${querystring.stringify({ error: 'state_mismatch' })}`);
    return;
  }
  
  try {
    const authString = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    
    console.log('Making token request with:');
    console.log('- Code:', code ? code.substring(0, 4) + '...' : 'No code');
    console.log('- Redirect URI:', REDIRECT_URI);
    console.log('- Auth header present:', !!authString);
    
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      querystring.stringify({
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      }),
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const { access_token, refresh_token, expires_in } = response.data;
    
    // Store tokens
    refreshTokens.add(refresh_token);
    currentToken = {
      access_token,
      refresh_token,
      expires_in,
      timestamp: Date.now()
    };
    
    console.log('Successfully obtained tokens');
    console.log('Redirecting to frontend:', FRONTEND_URI);
    
    // For GitHub Pages, we need to handle the redirect properly
    // GitHub Pages URLs need to correctly handle hash routing
    // Use hash fragment for parameters since GitHub Pages doesn't support server-side routing
    res.redirect(`${FRONTEND_URI}#access_token=${access_token}&refresh_token=${refresh_token}`);
  } catch (error) {
    console.error('Error getting tokens:', error.response?.data || error.message);
    // Log detailed error information
    console.error('=========== ERROR DETAILS ===========');
    if (error.response?.data) {
      console.error('Error response data:', JSON.stringify(error.response.data));
    }
    if (error.response?.status) {
      console.error('Error status code:', error.response.status);
    }
    if (error.response?.headers) {
      console.error('Error response headers:', JSON.stringify(error.response.headers));
    }
    console.error('Error stack:', error.stack);
    console.error('====================================');
    
    res.redirect(`/?${querystring.stringify({ error: 'invalid_token' })}`);
  }
});

// Refresh token route
app.post('/refresh_token', async (req, res) => {
  const { refresh_token } = req.body;
  
  if (!refreshTokens.has(refresh_token)) {
    return res.status(400).json({ error: 'Invalid refresh token' });
  }
  
  try {
    const tokenData = await getAccessToken(refresh_token);
    res.json(tokenData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Get current playback route
app.get('/currently-playing', async (req, res) => {
  const { access_token } = req.headers;
  
  if (!access_token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const response = await axios.get('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    if (error.response?.status === 204) {
      // No content - nothing currently playing
      return res.status(204).json({ message: 'No track currently playing' });
    }
    res.status(error.response?.status || 500).json({ error: 'Failed to fetch playback data' });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  // Fix for Express 5 - use named wildcard parameter
  app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Add diagnostic endpoint (REMOVE IN PRODUCTION)
app.get('/debug', (req, res) => {
  res.json({
    environment: {
      node_env: process.env.NODE_ENV || 'not set',
      port: process.env.PORT || '5000 (default)',
      is_production: isProd
    },
    spotify_config: {
      redirect_uri: REDIRECT_URI,
      frontend_uri: FRONTEND_URI,
      client_id_first_chars: CLIENT_ID ? CLIENT_ID.substring(0, 4) + '...' : 'not set',
      client_secret_set: !!CLIENT_SECRET
    },
    server_info: {
      uptime_seconds: Math.floor(process.uptime()),
      memory_usage_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      hostname: require('os').hostname()
    },
    cors_config: {
      allowed_origins: corsOptions.origin,
      credentials_allowed: corsOptions.credentials
    }
  });
});

// Add a root route with API documentation
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Better Spotify API</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            color: #1DB954;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          h2 {
            margin-top: 30px;
            color: #333;
          }
          .endpoint {
            background-color: #f5f5f5;
            padding: 10px 15px;
            border-radius: 5px;
            margin: 10px 0;
          }
          .method {
            font-weight: bold;
            color: #1DB954;
          }
        </style>
      </head>
      <body>
        <h1>Better Spotify API</h1>
        <p>This is the backend API server for the Better Spotify application.</p>
        
        <h2>Available Endpoints:</h2>
        
        <div class="endpoint">
          <p><span class="method">GET</span> /login</p>
          <p>Redirects to Spotify authorization page</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> /callback</p>
          <p>Handles the Spotify OAuth callback</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">POST</span> /refresh_token</p>
          <p>Refreshes an access token using a refresh token</p>
        </div>
        
        <div class="endpoint">
          <p><span class="method">GET</span> /currently-playing</p>
          <p>Gets the currently playing track (requires authentication)</p>
        </div>

        <p>For more information, visit the <a href="${FRONTEND_URI}">frontend application</a>.</p>
      </body>
    </html>
  `);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Using REDIRECT_URI: ${REDIRECT_URI}`);
  console.log(`Using FRONTEND_URI: ${FRONTEND_URI}`);
});

// App.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [backgroundColors, setBackgroundColors] = useState(['#1e3264', '#e65c00']);
  const [lyrics, setLyrics] = useState(null);
  const [showLyrics, setShowLyrics] = useState(false);

  // Check for tokens in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const access_token = urlParams.get('access_token');
    const refresh_token = urlParams.get('refresh_token');
    
    if (access_token && refresh_token) {
      setAccessToken(access_token);
      setRefreshToken(refresh_token);
      setIsLoggedIn(true);
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  // Fetch current playback data
  const fetchCurrentlyPlaying = async () => {
    if (!accessToken) return;
    
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/currently-playing`, {
        headers: {
          'Authorization': accessToken
        }
      });
      
      if (response.status === 204) {
        setCurrentTrack(null);
        return;
      }
      
      if (!response.ok) throw new Error('Failed to fetch playback data');
      
      const data = await response.json();
      
      if (data.item) {
        setCurrentTrack(data.item);
        setIsPlaying(data.is_playing);
        setProgress(data.progress_ms);
        setDuration(data.item.duration_ms);
        
        // Extract dominant colors from album art
        if (data.item.album.images[0]) {
          extractColorsFromImage(data.item.album.images[0].url);
        }
        
        // Mock lyrics - in a real app, you'd fetch from an API
        setLyrics([
          { time: 0, text: "♪" },
          { time: 5000, text: "This is a sample lyric line" },
          { time: 10000, text: "Another line of lyrics here" },
          { time: 15000, text: "More lyrics would appear here" },
          { time: 20000, text: "♪" }
        ]);
      }
    } catch (error) {
      console.error('Error fetching playback ', error);
    }
  };

  // Extract colors from album art (mock implementation)
  const extractColorsFromImage = (imageUrl) => {
    // In a real implementation, you would use a library like Vibrant.js
    // For this demo, we'll use a set of predefined color combinations
    const colorPalettes = [
      ['#1e3264', '#e65c00'],
      ['#8a2be2', '#ff6b6b'],
      ['#00b4d8', '#90e0ef'],
      ['#f15bb5', '#fee440'],
      ['#006d77', '#83c5be'],
      ['#e29578', '#ffddd2']
    ];
    
    const randomPalette = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
    setBackgroundColors(randomPalette);
  };

  // Refresh access token
  const refreshAccessToken = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/refresh_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      
      if (!response.ok) throw new Error('Failed to refresh token');
      
      const data = await response.json();
      setAccessToken(data.access_token);
    } catch (error) {
      console.error('Error refreshing token:', error);
      setIsLoggedIn(false);
    }
  };

  // Poll for current playback
  useEffect(() => {
    if (!isLoggedIn) return;
    
    fetchCurrentlyPlaying();
    const interval = setInterval(fetchCurrentlyPlaying, 3000);
    
    return () => clearInterval(interval);
  }, [isLoggedIn, accessToken]);

  // Update progress bar
  useEffect(() => {
    if (!isPlaying || !currentTrack) return;
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= duration) {
          clearInterval(interval);
          return duration;
        }
        return prev + 1000;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack, duration]);

  // Handle login
  const handleLogin = () => {
    window.location.href = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/login`;
  };

  // Format time (ms to mm:ss)
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Calculate progress percentage
  const progressPercentage = duration ? (progress / duration) * 100 : 0;

  // Login function is defined elsewhere in the code

  if (!isLoggedIn) {
    return (
      <div className="app-container" style={{
          background: `linear-gradient(135deg, #1e3264 0%, #e65c00 100%)`,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          padding: '20px'
        }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="login-container"
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            borderRadius: '15px',
            padding: '40px',
            textAlign: 'center',
            maxWidth: '400px',
            width: '100%'
          }}
        >
          <div style={{ marginBottom: '30px' }}>
            {/* Smaller Spotify logo */}
            <svg width="80" height="80" viewBox="0 0 24 24" style={{ margin: '0 auto 20px' }}>
              <path fill="#1DB954" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            <h1 style={{ fontSize: '28px', margin: '0 0 10px', color: 'white' }}>Better Spotify</h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '0' }}>Sign in to enhance your Spotify experience</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogin}
            style={{
              backgroundColor: '#1DB954',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              padding: '12px 30px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
              <path fill="currentColor" d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Sign in with Spotify
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen transition-all duration-1000"
      style={{
        background: `linear-gradient(135deg, ${backgroundColors[0]}, ${backgroundColors[1]})`
      }}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-white">Now Playing</h1>
          <button 
            onClick={() => setShowLyrics(!showLyrics)}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full backdrop-blur-sm transition"
          >
            {showLyrics ? 'Hide Lyrics' : 'Show Lyrics'}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {currentTrack ? (
            <motion.div
              key={currentTrack.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <motion.div 
                  className="relative"
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <img 
                    src={currentTrack.album.images[0]?.url} 
                    alt={currentTrack.album.name}
                    className="w-64 h-64 md:w-80 md:h-80 rounded-2xl shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-2xl"></div>
                </motion.div>

                <div className="flex-1 text-center md:text-left">
                  <motion.h2 
                    className="text-3xl md:text-4xl font-bold text-white mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {currentTrack.name}
                  </motion.h2>
                  
                  <motion.p 
                    className="text-xl text-white/80 mb-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {currentTrack.artists.map(artist => artist.name).join(', ')}
                  </motion.p>
                  
                  <motion.p 
                    className="text-lg text-white/60 mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {currentTrack.album.name}
                  </motion.p>

                  <div className="mb-6">
                    <div className="flex justify-between text-white/70 text-sm mb-2">
                      <span>{formatTime(progress)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-white rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 0.5 }}
                      ></motion.div>
                    </div>
                  </div>

                  <div className="flex justify-center md:justify-start space-x-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                    >
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                      </svg>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg"
                    >
                      {isPlaying ? (
                        <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                    >
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                      </svg>
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="inline-block p-6 bg-white/10 backdrop-blur-sm rounded-2xl">
                <svg className="w-16 h-16 text-white/50 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
                <h3 className="text-2xl font-semibold text-white mb-2">Nothing playing</h3>
                <p className="text-white/70">Start playing music on Spotify to see it here</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showLyrics && lyrics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-12 max-w-2xl mx-auto"
            >
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-4 text-center">Lyrics</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {lyrics.map((line, index) => (
                    <motion.p
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-white/80 text-center py-1"
                    >
                      {line.text}
                    </motion.p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;

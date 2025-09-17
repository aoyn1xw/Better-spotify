// Layout.jsx
import React from 'react';

const Layout = ({ children, backgroundColors }) => {
  return (
    <div 
      style={{
        background: `linear-gradient(135deg, ${backgroundColors[0]}, ${backgroundColors[1]})`,
        minHeight: '100vh',
        width: '100%',
        padding: '20px',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        position: 'relative'
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Layout;
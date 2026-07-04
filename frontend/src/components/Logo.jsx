import React from 'react';

const Logo = ({ className = 'w-9 h-9' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradients that form the overlapping ribbon effect */}
        <linearGradient id="logoBar1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="logoBar2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="60%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <filter id="logoShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="#09090b" floodOpacity="0.5" />
        </filter>
      </defs>
      
      {/* Back Diagonal Bar (Bottom-Left to Top-Right) */}
      <rect
        x="15"
        y="42"
        width="70"
        height="16"
        rx="8"
        transform="rotate(-45 50 50)"
        fill="url(#logoBar1)"
      />

      {/* Front Diagonal Bar (Top-Left to Bottom-Right) with Drop Shadow for overlap depth */}
      <rect
        x="15"
        y="42"
        width="70"
        height="16"
        rx="8"
        transform="rotate(45 50 50)"
        fill="url(#logoBar2)"
        filter="url(#logoShadow)"
      />
    </svg>
  );
};

export default Logo;

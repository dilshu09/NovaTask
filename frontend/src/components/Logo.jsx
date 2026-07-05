import React from 'react';

const Logo = ({ className = 'w-9 h-9' }) => {
  return (
    <img
      src="/logo.png"
      alt="NovaTask Logo"
      className={`${className} object-contain`}
    />
  );
};

export default Logo;
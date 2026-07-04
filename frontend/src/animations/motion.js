// Reusable Framer Motion Variants for Apple/Linear style animations

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

export const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } // Custom cubic-bezier for spring-like responsiveness
  },
  exit: { 
    opacity: 0, 
    y: 15,
    transition: { duration: 0.3 }
  }
};

export const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
  },
  exit: { 
    opacity: 0, 
    x: 40,
    transition: { duration: 0.3 }
  }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' }
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

export const hoverLift = {
  rest: { y: 0, scale: 1 },
  hover: { 
    y: -4, 
    scale: 1.015,
    transition: { duration: 0.2, ease: 'easeInOut' }
  }
};

export const buttonClick = {
  rest: { scale: 1 },
  tap: { scale: 0.97 }
};

// Pulse gradient animation for the AI orb
export const orbPulse = (state) => {
  if (state === 'listening') {
    return {
      scale: [1, 1.1, 0.95, 1.05, 1],
      transition: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' }
    };
  }
  if (state === 'thinking') {
    return {
      rotate: [0, 180, 360],
      scale: [1, 1.05, 1],
      transition: { repeat: Infinity, duration: 2.5, ease: 'linear' }
    };
  }
  if (state === 'completed') {
    return {
      scale: [1, 1.2, 1],
      transition: { duration: 0.5, ease: 'easeOut' }
    };
  }
  // 'ready' state: slow floating float pulse
  return {
    scale: [1, 1.03, 1],
    transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' }
  };
};

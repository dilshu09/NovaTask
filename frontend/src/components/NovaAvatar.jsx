import React, { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/* =========================================================
   SIZE CONFIGURATION
   Keep visual sizing outside the component.
========================================================= */
const SIZE_CONFIGS = {
  small: {
    container: 'w-20 h-20',
    visor: 'w-[70%] h-[36%] gap-2 px-2',
    eye: 'w-1.5 h-3.5',
  },

  medium: {
    container: 'w-40 h-40',
    visor: 'w-[70%] h-[36%] gap-4 px-4',
    eye: 'w-2.5 h-5',
  },

  large: {
    container: 'w-64 h-64',
    visor: 'w-[70%] h-[36%] gap-6 px-6',
    eye: 'w-3.5 h-7',
  },

  xlarge: {
    container: 'w-80 h-80',
    visor: 'w-[70%] h-[36%] gap-8 px-8',
    eye: 'w-4 h-8',
  },
};


/* =========================================================
   STATE CONFIGURATION
========================================================= */
const STATE_CONFIGS = {
  ready: {
    label: 'ready',

    ring:
      'border-indigo-500/80 ' +
      'shadow-[0_0_35px_rgba(99,102,241,0.45),0_0_70px_rgba(168,85,247,0.25),inset_0_0_25px_rgba(99,102,241,0.18)]',

    eye:
      'bg-cyan-300 ' +
      'shadow-[0_0_8px_#22d3ee,0_0_18px_rgba(6,182,212,0.8)]',

    aura:
      'from-indigo-500/20 via-purple-500/10 to-cyan-500/20',
  },

  listening: {
    label: 'listening',

    ring:
      'border-cyan-400 ' +
      'shadow-[0_0_40px_rgba(34,211,238,0.6),0_0_80px_rgba(6,182,212,0.3),inset_0_0_25px_rgba(34,211,238,0.2)]',

    eye:
      'bg-cyan-200 ' +
      'shadow-[0_0_10px_#67e8f9,0_0_24px_#06b6d4]',

    aura:
      'from-cyan-400/25 via-blue-500/10 to-cyan-500/20',
  },

  thinking: {
    label: 'thinking',

    ring:
      'border-purple-400 ' +
      'shadow-[0_0_40px_rgba(192,132,252,0.55),0_0_80px_rgba(168,85,247,0.3),inset_0_0_25px_rgba(168,85,247,0.2)]',

    eye:
      'bg-purple-300 ' +
      'shadow-[0_0_10px_#c084fc,0_0_24px_#a855f7]',

    aura:
      'from-purple-500/25 via-indigo-500/10 to-fuchsia-500/20',
  },

  speaking: {
    label: 'speaking',

    ring:
      'border-emerald-400 ' +
      'shadow-[0_0_40px_rgba(52,211,153,0.55),0_0_80px_rgba(16,185,129,0.25),inset_0_0_25px_rgba(52,211,153,0.2)]',

    eye:
      'bg-emerald-300 ' +
      'shadow-[0_0_10px_#6ee7b7,0_0_24px_#10b981]',

    aura:
      'from-emerald-500/25 via-cyan-500/10 to-teal-500/20',
  },

  error: {
    label: 'error',

    ring:
      'border-red-400 ' +
      'shadow-[0_0_35px_rgba(248,113,113,0.5),0_0_70px_rgba(239,68,68,0.25),inset_0_0_20px_rgba(248,113,113,0.18)]',

    eye:
      'bg-red-300 ' +
      'shadow-[0_0_10px_#fca5a5,0_0_22px_#ef4444]',

    aura:
      'from-red-500/20 via-rose-500/10 to-orange-500/15',
  },
};


/* =========================================================
   ANIMATION HELPERS
========================================================= */
const getSphereAnimation = (state, reduceMotion) => {
  if (reduceMotion) return {};

  switch (state) {
    case 'listening':
      return {
        scale: [1, 1.045, 0.985, 1.03, 1],
      };

    case 'thinking':
      return {
        scale: [1, 1.015, 1],
        rotate: [0, 1, -1, 0],
      };

    case 'speaking':
      return {
        scale: [1, 1.025, 0.99, 1.02, 1],
      };

    case 'error':
      return {
        x: [0, -2, 2, -2, 2, 0],
      };

    default:
      return {
        scale: [1, 1.015, 1],
      };
  }
};


const getSphereTransition = (state) => {
  switch (state) {
    case 'listening':
      return {
        duration: 1.4,
        repeat: Infinity,
        ease: 'easeInOut',
      };

    case 'thinking':
      return {
        duration: 2.2,
        repeat: Infinity,
        ease: 'easeInOut',
      };

    case 'speaking':
      return {
        duration: 1.1,
        repeat: Infinity,
        ease: 'easeInOut',
      };

    case 'error':
      return {
        duration: 0.45,
        repeat: 1,
      };

    default:
      return {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      };
  }
};


const getEyeAnimation = (state, reduceMotion) => {
  if (reduceMotion) return {};

  switch (state) {
    case 'listening':
      return {
        scaleY: [1, 1.15, 0.9, 1.1, 1],
        opacity: [0.8, 1, 0.85, 1],
      };

    case 'thinking':
      return {
        scaleY: [1, 0.65, 1],
        opacity: [0.45, 1, 0.45],
      };

    case 'speaking':
      return {
        scaleY: [1, 0.75, 1.2, 0.85, 1],
      };

    case 'error':
      return {
        opacity: [1, 0.35, 1, 0.35, 1],
      };

    default:
      return {
        scaleY: [1, 1, 1, 0.12, 1, 1],
      };
  }
};


const getEyeTransition = (state, eyeIndex) => {
  switch (state) {
    case 'listening':
      return {
        duration: 1.3,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: eyeIndex * 0.08,
      };

    case 'thinking':
      return {
        duration: 1.1,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: eyeIndex * 0.12,
      };

    case 'speaking':
      return {
        duration: 0.9,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: eyeIndex * 0.06,
      };

    case 'error':
      return {
        duration: 0.6,
        repeat: Infinity,
      };

    default:
      return {
        duration: 4.8,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: eyeIndex * 0.03,
      };
  }
};


/* =========================================================
   COMPONENT
========================================================= */
const NovaAvatar = ({
  size = 'medium',
  state = 'ready',
  className = '',
  showStatus = false,
}) => {
  const reduceMotion = useReducedMotion();

  const sizeConfig =
    SIZE_CONFIGS[size] ?? SIZE_CONFIGS.medium;

  const stateConfig =
    STATE_CONFIGS[state] ?? STATE_CONFIGS.ready;

  const sphereAnimation = getSphereAnimation(
    state,
    reduceMotion
  );

  const sphereTransition =
    getSphereTransition(state);

  return (
    <div
      className={`
        relative
        inline-flex
        flex-col
        items-center
        justify-center
        ${className}
      `}
    >
      {/* =====================================================
          AVATAR CONTAINER
      ===================================================== */}
      <div
        className={`
          relative
          ${sizeConfig.container}
          flex
          items-center
          justify-center
        `}
        role="img"
        aria-label={`Nova AI assistant is ${stateConfig.label}`}
      >

        {/* ===================================================
            OUTER AURA
        =================================================== */}
        <motion.div
          aria-hidden="true"
          animate={
            reduceMotion
              ? {}
              : { rotate: 360 }
          }
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: 'linear',
          }}
          className={`
            absolute
            -inset-[8%]
            rounded-full
            bg-gradient-to-tr
            ${stateConfig.aura}
            blur-2xl
            opacity-80
          `}
        />


        {/* ===================================================
            SECONDARY ORBIT RING
        =================================================== */}
        <motion.div
          aria-hidden="true"
          animate={
            reduceMotion
              ? {}
              : { rotate: -360 }
          }
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="
            absolute
            -inset-[3%]
            rounded-full
            border
            border-white/5
            border-t-white/15
            border-r-transparent
          "
        />


        {/* ===================================================
            MAIN SPHERE
        =================================================== */}
        <motion.div
          animate={sphereAnimation}
          transition={sphereTransition}
          className={`
            relative
            w-full
            h-full
            overflow-hidden
            rounded-full
            border-2
            bg-[#020205]
            flex
            items-center
            justify-center
            transition-[border-color,box-shadow]
            duration-500
            ${stateConfig.ring}
          `}
        >

          {/* Inner radial depth */}
          <div
            aria-hidden="true"
            className="
              absolute
              inset-0
              bg-[radial-gradient(circle_at_50%_40%,rgba(30,41,59,0.18),transparent_42%,rgba(0,0,0,0.8)_100%)]
            "
          />


          {/* Subtle inner atmosphere */}
          <motion.div
            aria-hidden="true"
            animate={
              reduceMotion
                ? {}
                : {
                    opacity: [0.2, 0.5, 0.2],
                    scale: [0.95, 1.05, 0.95],
                  }
            }
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`
              absolute
              inset-[12%]
              rounded-full
              bg-gradient-to-br
              ${stateConfig.aura}
              blur-xl
            `}
          />


          {/* =================================================
              VISOR
          ================================================= */}
          <div
            className={`
              relative
              z-10
              ${sizeConfig.visor}
              rounded-full
              bg-[#07070d]/95
              border
              border-white/[0.07]
              flex
              items-center
              justify-center
              shadow-[inset_0_3px_12px_rgba(0,0,0,0.9),0_4px_20px_rgba(0,0,0,0.35)]
              backdrop-blur-sm
            `}
          >

            {/* Visor reflection */}
            <div
              aria-hidden="true"
              className="
                absolute
                top-[8%]
                left-[15%]
                w-[70%]
                h-[18%]
                rounded-full
                bg-gradient-to-r
                from-transparent
                via-white/[0.06]
                to-transparent
                blur-[1px]
              "
            />


            {/* ===============================================
                EYES
            =============================================== */}
            {[0, 1].map((eyeIndex) => (
              <motion.div
                key={eyeIndex}
                animate={getEyeAnimation(
                  state,
                  reduceMotion
                )}
                transition={getEyeTransition(
                  state,
                  eyeIndex
                )}
                className={`
                  ${sizeConfig.eye}
                  rounded-full
                  origin-center
                  ${stateConfig.eye}
                `}
              />
            ))}
          </div>


          {/* =================================================
              TOP GLASS REFLECTION
          ================================================= */}
          <div
            aria-hidden="true"
            className="
              absolute
              top-[5%]
              left-[22%]
              w-[55%]
              h-[24%]
              rounded-full
              bg-gradient-to-b
              from-white/[0.10]
              via-white/[0.025]
              to-transparent
              blur-[2px]
              -rotate-12
              pointer-events-none
            "
          />


          {/* =================================================
              LOWER REFLECTION
          ================================================= */}
          <div
            aria-hidden="true"
            className="
              absolute
              bottom-[6%]
              left-[30%]
              w-[40%]
              h-[10%]
              rounded-full
              bg-white/[0.025]
              blur-md
              pointer-events-none
            "
          />

        </motion.div>
      </div>


      {/* =====================================================
          OPTIONAL STATUS LABEL
      ===================================================== */}
      {showStatus && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            mt-4
            flex
            items-center
            gap-2
            text-xs
            text-zinc-400
          "
        >
          <span
            className={`
              w-1.5
              h-1.5
              rounded-full
              ${stateConfig.eye}
            `}
          />

          <span className="capitalize">
            {stateConfig.label}
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default memo(NovaAvatar);
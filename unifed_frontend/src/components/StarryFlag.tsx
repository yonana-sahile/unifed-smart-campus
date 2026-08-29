import React from 'react';

interface StarryFlagProps {
  scale?: number;
  className?: string;
  showText?: boolean;
  poleHeightCustom?: number;
}

export const StarryFlag: React.FC<StarryFlagProps> = ({
  scale = 0.5,
  className = "",
  showText = true,
  poleHeightCustom
}) => {
  // Base dimensions scaled down appropriately
  const poleHeight = poleHeightCustom ?? Math.round(230 * scale);
  const flagWidth = Math.round(220 * scale);
  const finialSize = Math.max(9, Math.round(15 * scale));
  const poleWidth = Math.max(3.5, Math.round(6.5 * scale));

  return (
    <div className={`flex flex-col items-start select-none ${className}`}>
      <div className="flex items-start">
        {/* Flagpole structure */}
        <div className="flex flex-col items-center shrink-0">
          {/* Golden finial sphere top */}
          <div
            className="bg-gradient-to-br from-amber-300 via-amber-400 to-yellow-600 rounded-full shadow-md z-10"
            style={{ width: `${finialSize}px`, height: `${finialSize}px` }}
          />
          {/* Metallic pole */}
          <div
            className="bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500 rounded-b-sm shadow-md"
            style={{
              width: `${poleWidth}px`,
              height: `${poleHeight}px`,
              boxShadow: 'inset -1px 0 2px rgba(0,0,0,0.35)'
            }}
          />
        </div>

        {/* 3D Waving flag SVG canvas */}
        <div
          className="waving-flag-container -ml-0.5 mt-1 origin-left"
          style={{ width: `${flagWidth}px`, perspective: '900px' }}
        >
          <svg
            className="waving-flag-svg w-full h-auto block"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1200 600"
            style={{
              transformOrigin: 'left center',
              animation: 'real-wave 2.8s ease-in-out infinite alternate',
              filter: 'drop-shadow(2px 6px 8px rgba(0,0,0,0.35))'
            }}
          >
            <defs>
              <linearGradient id="flag-shading" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
                <stop offset="20%" stopColor="rgba(255,255,255,0.2)" />
                <stop offset="40%" stopColor="rgba(0,0,0,0.18)" />
                <stop offset="60%" stopColor="rgba(255,255,255,0.18)" />
                <stop offset="80%" stopColor="rgba(0,0,0,0.22)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.12)" />
              </linearGradient>
            </defs>
            <title>Flag of the Federal Democratic Republic of Ethiopia</title>

            {/* Green Stripe */}
            <rect y="0" width="1200" height="200" fill="#078930" />
            {/* Yellow Stripe */}
            <rect y="200" width="1200" height="200" fill="#FCDD09" />
            {/* Red Stripe */}
            <rect y="400" width="1200" height="200" fill="#DA121A" />

            {/* Emblem Blue Circle */}
            <circle cx="600" cy="300" r="160" fill="#0F47AF" />

            {/* Emblem Star and Rays */}
            <g transform="translate(600, 300) scale(0.85)">
              <path
                d="M0,-160 L94,129.4 L-152.1,-49.4 L152.1,-49.4 L-94,129.4 Z"
                fill="none"
                stroke="#FCDD09"
                strokeWidth="12"
                strokeLinejoin="round"
              />

              <g stroke="#FCDD09" strokeWidth="12" strokeLinecap="round">
                <line x1="50" y1="-69" x2="94" y2="-129" />
                <line x1="81" y1="26" x2="152" y2="49" />
                <line x1="0" y1="85" x2="0" y2="160" />
                <line x1="-81" y1="26" x2="-152" y2="49" />
                <line x1="-50" y1="-69" x2="-94" y2="-129" />
              </g>
            </g>

            {/* Shading overlay for realistic waving folds */}
            <rect
              y="0"
              width="1200"
              height="600"
              fill="url(#flag-shading)"
              style={{ mixBlendMode: 'overlay' }}
            />
          </svg>
        </div>
      </div>

      {/* Optional Neon text below flagpole */}
      {showText && (
        <div
          className="mt-1 text-center ethiopia-neon-text font-bold text-xs tracking-wider"
          style={{
            fontFamily: "'Segoe UI', Roboto, sans-serif",
            whiteSpace: 'nowrap',
            marginLeft: '-4px'
          }}
        >
          Secured Ethiopia • ኢትዮጵያ
        </div>
      )}

      <style>{`
        @keyframes real-wave {
          0% { transform: rotateY(-4deg) skewY(-1.5deg) skewX(1deg); }
          50% { transform: rotateY(-12deg) skewY(1deg) skewX(-1deg); }
          100% { transform: rotateY(-20deg) skewY(2.5deg) skewX(1.5deg); }
        }
        .ethiopia-neon-text {
          animation: ethiopia-glow 3s infinite alternate;
        }
        @keyframes ethiopia-glow {
          0% { color: #078930; text-shadow: 0 0 4px rgba(7, 137, 48, 0.4); }
          50% { color: #eab308; text-shadow: 0 0 4px rgba(234, 179, 8, 0.4); }
          100% { color: #dc2626; text-shadow: 0 0 4px rgba(220, 38, 38, 0.4); }
        }
      `}</style>
    </div>
  );
};

export default StarryFlag;

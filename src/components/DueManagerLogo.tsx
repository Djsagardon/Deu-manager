import React from 'react';

interface DueManagerLogoProps {
  variant?: 'full' | 'icon' | 'wordmark';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  className?: string;
  iconOnlySize?: number;
  lightText?: boolean;
}

export const DueManagerLogo: React.FC<DueManagerLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  iconOnlySize,
  lightText = false,
}) => {
  const getSizePx = () => {
    if (iconOnlySize) return iconOnlySize;
    switch (size) {
      case 'xs': return 24;
      case 'sm': return 32;
      case 'md': return 40;
      case 'lg': return 56;
      case 'xl': return 80;
      case '2xl': return 120;
      default: return 40;
    }
  };

  const px = getSizePx();

  // Official Due Manager Logo matching the uploaded reference image exactly
  const renderEmblem = () => (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: px, height: px }}
      className="shrink-0 transition-all duration-200"
    >
      {/* Outer Squircle Container with Border Outline */}
      <rect
        x="8"
        y="8"
        width="184"
        height="184"
        rx="46"
        ry="46"
        className="fill-white dark:fill-[#121212] stroke-[#2A2A2A] dark:stroke-white"
        strokeWidth="5"
      />

      {/* Main Outer Capital 'D' Loop - Black in Light Mode, White in Dark Mode */}
      <path
        d="M 68 36 H 116 C 152 36 174 58 174 100 C 174 142 152 164 116 164 H 88 V 144 H 116 C 138 144 152 130 152 100 C 152 70 138 56 116 56 H 68 V 36 Z"
        className="fill-[#121212] dark:fill-white"
      />

      {/* Indian Rupee (₹) Symbol - Top Green Bar (#18C37E) */}
      <polygon
        points="50,50 102,50 94,64 42,64"
        fill="#18C37E"
      />

      {/* Indian Rupee (₹) Symbol - White/Dark Second Horizontal Crossbar */}
      <rect
        x="42"
        y="72"
        width="56"
        height="12"
        rx="3"
        className="fill-[#121212] dark:fill-white"
      />

      {/* Indian Rupee (₹) Vertical Stem & Curved Lower Leg */}
      <path
        d="M 46 64 H 62 V 102 C 74 90 92 84 104 84 V 98 C 92 98 80 106 70 118 L 48 156 H 26 L 56 112 V 64 H 46 Z"
        className="fill-[#121212] dark:fill-white"
      />

      {/* Green Check Mark (✓) Inside the 'D' Loop (#18C37E) */}
      <path
        d="M 94 118 L 112 136 L 148 90"
        stroke="#18C37E"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderEmblem()}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {renderEmblem()}

      {variant === 'full' && (
        <div className="flex flex-col leading-none select-none">
          <div className="flex items-center font-black tracking-tight" style={{ fontSize: Math.max(14, px * 0.45) }}>
            <span className={lightText ? 'text-white' : 'text-[#121212] dark:text-white'}>Due</span>
            <span className="text-[#18C37E] ml-1.5">Manager</span>
          </div>
        </div>
      )}
    </div>
  );
};

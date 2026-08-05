import React from 'react';
import { DueManagerLogo } from './DueManagerLogo';

interface SplashScreenProps {
  statusMessage?: string;
  isReady?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  statusMessage = 'Initializing Workspace...',
  isReady = false,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-[#121212] text-white select-none overflow-hidden animate-in fade-in duration-200">
      {/* Top Spacer */}
      <div className="w-full h-8" />

      {/* Center: Official Due Manager Logo + Application Name ONLY */}
      <div className="flex flex-col items-center justify-center text-center my-auto space-y-5">
        <DueManagerLogo variant="icon" iconOnlySize={128} />

        <div className="flex items-center justify-center font-black text-4xl tracking-tight">
          <span className="text-white">Due</span>
          <span className="text-[#18C37E] ml-2">Manager</span>
        </div>
      </div>

      {/* Bottom Minimal Progress Indicator */}
      <div className="w-full max-w-xs space-y-2.5 text-center mb-6">
        <div className="w-full bg-[#1E1E1E] border border-[#2A2A2A] h-1.5 rounded-full overflow-hidden relative">
          <div
            className={`h-full bg-[#18C37E] transition-all duration-300 ${
              isReady ? 'w-full' : 'w-4/5 animate-pulse'
            }`}
          />
        </div>
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          {statusMessage}
        </p>
      </div>
    </div>
  );
};

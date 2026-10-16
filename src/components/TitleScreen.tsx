import React, { useEffect } from 'react';
import { Play, ShieldAlert, Sparkles, Target, Zap } from 'lucide-react';
import { ScenarioType } from '../types/game';
import { sound } from '../audio/synth';

interface TitleScreenProps {
  onEnterLobby: () => void;
  onQuickStartScenario: (scenario: ScenarioType) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onEnterLobby,
  onQuickStartScenario,
}) => {
  // Listen for Enter or Space to quickly start
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        sound.playPlacement();
        onEnterLobby();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnterLobby]);

  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-between p-6 sm:p-12 pointer-events-none select-none text-[#edebe8]">
      {/* Top Header / Branding Lockup */}
      <div className="flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#202228]/95 border border-[#3b3f4b] text-xs text-[#a5a39e] font-mono backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#a5a39e] animate-pulse" />
          <span>BLOKUS NEXUS // STRATEGY MULTIPLAYER</span>
        </div>

        <div className="text-right text-xs font-mono text-[#a5a39e] flex items-center gap-2">
          <span>PROMPTED STARTERS · 3 SCENARIOS · 109 MAX PTS</span>
        </div>
      </div>

      {/* Center Hero Title Lockup with Bespoke SVG */}
      <div className="max-w-2xl pointer-events-auto my-auto space-y-4">
        {/* Bespoke Geometric SVG Lockup in Soft Neutral Palette */}
        <div className="flex items-center gap-3">
          <svg className="w-10 h-10 drop-shadow-md" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="4" width="18" height="18" rx="3" fill="#4f7bb6" />
            <rect x="26" y="4" width="18" height="18" rx="3" fill="#c99648" />
            <rect x="26" y="26" width="18" height="18" rx="3" fill="#c26262" />
            <rect x="4" y="26" width="18" height="18" rx="3" fill="#4e9a7e" />
            <path d="M22 4L26 22L44 26" stroke="#edebe8" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-xs font-mono font-bold tracking-widest text-[#a5a39e] uppercase">
            Tactical Polyomino Nexus
          </span>
        </div>

        <h1 className="text-5xl sm:text-7xl font-black text-[#edebe8] tracking-tight uppercase leading-none">
          BLOKUS<span className="text-[#a5a39e]">.NEXUS</span>
        </h1>

        <p className="text-base text-[#cfcdc8] max-w-xl font-normal leading-relaxed">
          Master the four jewel territories in live multiplayer sessions. Begin with prompted foundation tiles, progress through{' '}
          <strong className="text-[#e88f8f] font-medium">Destructive Siege</strong>,{' '}
          <strong className="text-[#80cda9] font-medium">Collaborative Harmony</strong>, and the endgame{' '}
          <strong className="text-[#e8c382] font-medium">Challenge to Last Tile</strong> for 109 maximum points.
        </p>

        {/* Primary Action Button */}
        <div className="flex flex-wrap items-center gap-3 pt-3">
          <button
            onClick={() => {
              sound.playPlacement();
              onEnterLobby();
            }}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-[#363a46] hover:bg-[#434857] border border-[#4e5465] text-[#edebe8] font-semibold text-sm shadow-md transition-all hover:scale-102 cursor-pointer pointer-events-auto"
          >
            <Play className="w-4 h-4 fill-[#edebe8]" /> Enter Matchmaking Lobby
          </button>
        </div>

        {/* Quick Launch Scenario Cards */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-xl">
          <button
            onClick={() => {
              sound.playDestructiveBlock();
              onQuickStartScenario('destructive');
            }}
            className="p-3 rounded-xl bg-[#202228]/95 hover:bg-[#282b33] border border-[#3b3f4b] hover:border-[#525767] text-left transition-all backdrop-blur-md group cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-[#e88f8f] font-semibold text-xs mb-0.5">
              <ShieldAlert className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              Destructive Siege
            </div>
            <div className="text-[10px] text-[#a5a39e]">Territorial chokeholds &amp; corner denial</div>
          </button>

          <button
            onClick={() => {
              sound.playCollaborativeChime();
              onQuickStartScenario('collaborative');
            }}
            className="p-3 rounded-xl bg-[#202228]/95 hover:bg-[#282b33] border border-[#3b3f4b] hover:border-[#525767] text-left transition-all backdrop-blur-md group cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-[#80cda9] font-semibold text-xs mb-0.5">
              <Sparkles className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              Collaborative Nexus
            </div>
            <div className="text-[10px] text-[#a5a39e]">Symmetric weave &amp; shared space</div>
          </button>

          <button
            onClick={() => {
              sound.playLastTileAlert();
              onQuickStartScenario('last_tile_challenge');
            }}
            className="p-3 rounded-xl bg-[#202228]/95 hover:bg-[#282b33] border border-[#3b3f4b] hover:border-[#525767] text-left transition-all backdrop-blur-md group cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-[#e8c382] font-semibold text-xs mb-0.5">
              <Target className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              Last Tile Challenge
            </div>
            <div className="text-[10px] text-[#a5a39e]">Save 1-square Monomino for 109 pts</div>
          </button>
        </div>
      </div>

      {/* Bottom Footer Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pointer-events-auto text-xs text-[#a5a39e] font-mono border-t border-[#2d313c] pt-4">
        <div>
          <span>CONTROLS: </span>
          <span className="text-[#cfcdc8]">CLICK BOARD TO PLACE · R ROTATE · F FLIP · M MUTE</span>
        </div>
        <div>
          <span>LIVE ROOM SHARING: </span>
          <span className="text-[#80cda9]">INVITE PEERS VIA DIRECT HTML LINK</span>
        </div>
      </div>
    </div>
  );
};

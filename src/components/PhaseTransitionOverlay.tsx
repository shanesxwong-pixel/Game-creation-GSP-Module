import React, { useEffect, useState } from 'react';
import { ShieldAlert, Sparkles, Target, Zap, Flame, Users, Hourglass } from 'lucide-react';
import { ScenarioType } from '../types/game';
import { SCENARIOS } from '../game/scenarios';
import { sound } from '../audio/synth';

interface PhaseTransitionOverlayProps {
  currentScenario: ScenarioType;
  triggerKey: string | number; // unique key to re-trigger on change
  onComplete?: () => void;
}

export const PhaseTransitionOverlay: React.FC<PhaseTransitionOverlayProps> = ({
  currentScenario,
  triggerKey,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const cfg = SCENARIOS[currentScenario];

  useEffect(() => {
    // Only trigger if key is defined
    if (!triggerKey) return;

    setIsVisible(true);

    // Audio cue based on phase
    if (currentScenario === 'destructive') {
      sound.playDestructiveBlock();
    } else if (currentScenario === 'collaborative') {
      sound.playCollaborativeChime();
    } else if (currentScenario === 'last_tile_challenge') {
      sound.playLastTileAlert();
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 2400);

    return () => clearTimeout(timer);
  }, [triggerKey, currentScenario, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Dynamic Screen Edge Border Pulse (Gentle subtle pulse) */}
      {currentScenario === 'destructive' && (
        <div className="absolute inset-0 border-4 border-rose-400/30 animate-pulse opacity-40" />
      )}
      {currentScenario === 'collaborative' && (
        <div className="absolute inset-0 border-4 border-emerald-400/30 animate-pulse opacity-40" />
      )}
      {currentScenario === 'last_tile_challenge' && (
        <div className="absolute inset-0 border-4 border-amber-400/30 animate-pulse opacity-40" />
      )}

      {/* Screen Backdrop Vignette */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ${
          currentScenario === 'destructive'
            ? 'bg-rose-950/20'
            : currentScenario === 'collaborative'
            ? 'bg-emerald-950/20'
            : 'bg-amber-950/20'
        }`}
      />

      {/* Central Announcement Banner Card */}
      <div className="relative z-50 flex flex-col items-center text-center px-8 py-6 rounded-3xl backdrop-blur-xl border shadow-xl animate-in zoom-in-95 fade-in duration-300 max-w-lg mx-4 bg-[#181c28]/95 border-slate-700/60 text-slate-200">
        {/* Glow halo behind banner */}
        <div
          className="absolute -inset-1 rounded-3xl blur-xl opacity-30 pointer-events-none"
          style={{
            background:
              currentScenario === 'destructive'
                ? 'radial-gradient(circle, rgba(207,102,102,0.4) 0%, rgba(0,0,0,0) 70%)'
                : currentScenario === 'collaborative'
                ? 'radial-gradient(circle, rgba(92,169,141,0.4) 0%, rgba(0,0,0,0) 70%)'
                : 'radial-gradient(circle, rgba(212,163,89,0.4) 0%, rgba(0,0,0,0) 70%)',
          }}
        />

        {/* Phase Badge */}
        <div
          className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-medium uppercase tracking-wider mb-3 shadow-xs"
          style={{
            backgroundColor:
              currentScenario === 'destructive'
                ? 'rgba(207, 102, 102, 0.15)'
                : currentScenario === 'collaborative'
                ? 'rgba(92, 169, 141, 0.15)'
                : 'rgba(212, 163, 89, 0.15)',
            color: cfg.primaryColor,
            border: `1px solid ${cfg.primaryColor}40`,
          }}
        >
          {currentScenario === 'destructive' && <Flame className="w-4 h-4 text-rose-300" />}
          {currentScenario === 'collaborative' && <Users className="w-4 h-4 text-emerald-300" />}
          {currentScenario === 'last_tile_challenge' && <Hourglass className="w-4 h-4 text-amber-300" />}
          <span>Phase Shift Initiated</span>
        </div>

        {/* Big Impact Title */}
        <h1 className="relative text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight uppercase mb-1">
          {cfg.title}
        </h1>

        {/* Subtitle / Objective Tagline */}
        <p className="relative text-xs sm:text-sm text-slate-300 font-normal max-w-md mb-3 leading-relaxed">
          {cfg.subtitle}
        </p>

        {/* Tactical Rule Hint */}
        <div className="relative text-xs px-3.5 py-1.5 rounded-xl bg-[#141722] text-slate-400 border border-slate-800 flex items-center gap-2 font-mono">
          <Zap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{cfg.ruleExplanation}</span>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Volume2, VolumeX, ShieldAlert, Sparkles, Target, Flame, Users, Hourglass } from 'lucide-react';
import { Player, PlayerColor, ScenarioType } from '../types/game';
import { COLOR_CONFIG } from '../game/rules';
import { SCENARIOS } from '../game/scenarios';

interface ScenarioHUDProps {
  scenario: ScenarioType;
  activePlayer: Player | undefined;
  localPlayer: Player | undefined;
  turnNumber: number;
  isMuted: boolean;
  onToggleMute: () => void;
  styleMetrics: {
    destructiveScore: number;
    collaborativeScore: number;
    challengeScore: number;
    dominantStyle: ScenarioType;
  };
  onSelectScenario?: (s: ScenarioType) => void;
}

export const ScenarioHUD: React.FC<ScenarioHUDProps> = ({
  scenario,
  activePlayer,
  localPlayer,
  turnNumber,
  isMuted,
  onToggleMute,
  styleMetrics,
  onSelectScenario,
}) => {
  const cfg = SCENARIOS[scenario];
  const activeColorCfg = activePlayer ? COLOR_CONFIG[activePlayer.color] : null;
  const isMyTurn = activePlayer?.id === localPlayer?.id;

  return (
    <div className="fixed top-4 left-4 z-30 flex flex-col gap-2 pointer-events-none max-w-sm">
      {/* Main Status Cluster */}
      <div className="bg-[#202228]/95 border border-[#3b3f4b] rounded-2xl p-3 shadow-xl backdrop-blur-md pointer-events-auto text-[#edebe8]">
        {/* Top: Current Player Turn */}
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#2d313c]">
          <div className="flex items-center gap-2">
            {activeColorCfg && (
              <span
                className="w-3.5 h-3.5 rounded-full inline-block shadow-xs"
                style={{ backgroundColor: activeColorCfg.hex }}
              />
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#edebe8]">
                  {isMyTurn ? 'YOUR TURN' : activePlayer?.name || 'Turn'}
                </span>
                {isMyTurn && (
                  <span className="px-1.5 py-0.2 bg-[#233a30] text-[#80cda9] border border-[#375e4e] text-[9px] font-semibold rounded">
                    ACTIVE
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#a5a39e] font-mono">
                Round #{Math.floor((turnNumber - 1) / 4) + 1} · Turn {turnNumber}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleMute}
              className="p-1.5 rounded-lg bg-[#2b2d37] hover:bg-[#373a46] text-[#cfcdc8] transition-colors cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Scenario Header with Dynamic Visual Styling */}
        <div
          className={`p-2.5 rounded-xl border transition-all duration-300 ${
            scenario === 'destructive'
              ? 'bg-[#332222]/80 border-[#5e3838]'
              : scenario === 'collaborative'
              ? 'bg-[#1e2e27]/80 border-[#325244]'
              : 'bg-[#332c1e]/80 border-[#5e4e2e]'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className="text-[11px] font-semibold tracking-wide uppercase flex items-center gap-1.5"
              style={{ color: cfg.primaryColor }}
            >
              {scenario === 'destructive' && <ShieldAlert className="w-3.5 h-3.5" />}
              {scenario === 'collaborative' && <Sparkles className="w-3.5 h-3.5" />}
              {scenario === 'last_tile_challenge' && <Target className="w-3.5 h-3.5" />}
              {cfg.title}
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#1c1e24] text-[#cfcdc8] font-mono border border-[#343844]">
              {cfg.badge}
            </span>
          </div>
          <p className="text-[11px] text-[#cfcdc8] leading-snug">{cfg.objectiveText}</p>
        </div>

        {/* Live Dynamic Strategic Style Meters */}
        <div className="mt-2.5 pt-2 border-t border-[#2d313c]">
          <div className="flex items-center justify-between text-[10px] text-[#a5a39e] mb-1.5">
            <span className="font-medium text-[#edebe8]">Live Strategy Telemetry</span>
            <span className="text-[9px] font-mono text-[#a5a39e]">
              Style: {styleMetrics.dominantStyle.toUpperCase()}
            </span>
          </div>

          <div className="space-y-1.5">
            {/* Destructive Bar */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[9px] text-[#a5a39e] font-mono">
                <span className="flex items-center gap-1 text-[#e88f8f]">
                  <Flame className="w-2.5 h-2.5" /> Chokehold Siege
                </span>
                <span>{styleMetrics.destructiveScore}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#191b20] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#c26262] transition-all duration-700 ease-out rounded-full"
                  style={{ width: `${styleMetrics.destructiveScore}%` }}
                />
              </div>
            </div>

            {/* Collaborative Bar */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[9px] text-[#a5a39e] font-mono">
                <span className="flex items-center gap-1 text-[#80cda9]">
                  <Users className="w-2.5 h-2.5" /> Nexus Harmony
                </span>
                <span>{styleMetrics.collaborativeScore}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#191b20] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4e9a7e] transition-all duration-700 ease-out rounded-full"
                  style={{ width: `${styleMetrics.collaborativeScore}%` }}
                />
              </div>
            </div>

            {/* Challenge to Last Tile Bar */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-[9px] text-[#a5a39e] font-mono">
                <span className="flex items-center gap-1 text-[#e8c382]">
                  <Hourglass className="w-2.5 h-2.5" /> Endgame Precision
                </span>
                <span>{styleMetrics.challengeScore}%</span>
              </div>
              <div className="w-full h-1.5 bg-[#191b20] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#c99648] transition-all duration-700 ease-out rounded-full"
                  style={{ width: `${styleMetrics.challengeScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Scenario Selector Pills */}
        {onSelectScenario && (
          <div className="mt-2.5 pt-2 border-t border-[#2d313c] flex gap-1">
            {(['destructive', 'collaborative', 'last_tile_challenge'] as ScenarioType[]).map((st) => (
              <button
                key={st}
                onClick={() => onSelectScenario(st)}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  scenario === st
                    ? 'bg-[#3b3f4c] text-[#edebe8] shadow-xs'
                    : 'text-[#a5a39e] hover:text-[#edebe8] bg-[#1a1c22]'
                }`}
              >
                {st === 'destructive' ? 'Destructive' : st === 'collaborative' ? 'Nexus' : 'Last Tile'}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

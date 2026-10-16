import React, { useState } from 'react';
import { Info, Link as LinkIcon, Check, Crown, Layers, Sparkles } from 'lucide-react';
import { PlayerColor, ScenarioType } from '../types/game';
import { COLOR_CONFIG } from '../game/rules';

interface StageProgressBarProps {
  currentStage: 1 | 2 | 3;
  stageName: string;
  stageTagline: string;
  totalMovesCount: number;
  playerSquaresPlaced: number;
  localPlayerColor: PlayerColor;
  onOpenGuide: () => void;
  roomId?: string;
  scenario: ScenarioType;
}

export const StageProgressBar: React.FC<StageProgressBarProps> = ({
  currentStage,
  stageName,
  stageTagline,
  totalMovesCount,
  playerSquaresPlaced,
  localPlayerColor,
  onOpenGuide,
  roomId,
  scenario,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const colorCfg = COLOR_CONFIG[localPlayerColor];

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?room=${roomId || 'DEMO'}`
      : `?room=${roomId || 'DEMO'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[820px] w-[95%]">
      <div className="bg-[#202228]/95 border border-[#3b3f4b] rounded-2xl p-2.5 px-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs text-[#edebe8]">
        {/* Left: 3-Stage Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-[#181a1f] rounded-xl border border-[#30333d]">
            {/* Stage 1 */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                currentStage === 1
                  ? 'bg-[#314866] text-[#90b5e8] font-bold shadow-xs border border-[#4a6b94]'
                  : 'text-[#878580] opacity-70'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#4f7bb6]" />
              <span className="text-[11px]">1. Foothold</span>
            </div>

            {/* Stage 2 */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                currentStage === 2
                  ? 'bg-[#294a3d] text-[#80cda9] font-bold shadow-xs border border-[#3d6e5a]'
                  : 'text-[#878580] opacity-70'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#4e9a7e]" />
              <span className="text-[11px]">2. Crossroad</span>
            </div>

            {/* Stage 3 */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                currentStage === 3
                  ? 'bg-[#4a391e] text-[#e8c382] font-bold shadow-xs border border-[#75592d]'
                  : 'text-[#878580] opacity-70'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#c99648]" />
              <span className="text-[11px]">3. Max Points (109)</span>
            </div>
          </div>

          {/* Prompted Starters Badge */}
          {totalMovesCount <= 4 && (
            <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#272931] border border-[#3e424e] text-[10px] text-[#a5a39e]">
              <Sparkles className="w-3 h-3 text-[#dfa95c]" />
              Prompted Starters Active
            </span>
          )}
        </div>

        {/* Center: Live Points Yield */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#181a1f] px-2.5 py-1 rounded-xl border border-[#30333d]">
            <Crown className="w-3.5 h-3.5 text-[#dfa95c]" />
            <span className="text-[11px] text-[#cfcdc8]">
              Your Points:{' '}
              <strong className="text-[#edebe8] font-mono">{playerSquaresPlaced}</strong> / 89
            </span>
            <span className="text-[10px] text-[#80cda9] font-mono">
              (Max: 109 pts)
            </span>
          </div>
        </div>

        {/* Right: Guide & HTML Share Link */}
        <div className="flex items-center gap-2">
          {/* Guide Button */}
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#2b2d36] hover:bg-[#363945] text-[#edebe8] text-[11px] font-medium border border-[#3d424f] transition-colors cursor-pointer"
            title="Open Gameplay Stages and Max Points Strategy Guide"
          >
            <Info className="w-3.5 h-3.5 text-[#90b5e8]" />
            <span>Stages Guide</span>
          </button>

          {/* HTML Share Link Button */}
          <button
            onClick={handleCopyLink}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-colors cursor-pointer ${
              copiedLink
                ? 'bg-[#294a3d] text-[#80cda9] border-[#3d6e5a]'
                : 'bg-[#2b2d36] hover:bg-[#363945] text-[#cfcdc8] border-[#3d424f]'
            }`}
            title="Copy direct HTML invite link to share with others"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#80cda9]" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-3.5 h-3.5 text-[#cfcdc8]" />
                <span>Share Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

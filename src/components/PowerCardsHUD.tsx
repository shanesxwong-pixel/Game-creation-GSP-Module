import React, { useState } from 'react';
import {
  ShieldCheck,
  HeartHandshake,
  ArrowRightLeft,
  Sparkles,
  Info,
  Clock,
  Award,
} from 'lucide-react';
import { Player, PlayerColor, ScenarioType } from '../types/game';
import { sound } from '../audio/synth';

interface PowerCardsHUDProps {
  scenario: ScenarioType;
  activePlayer: Player | undefined;
  localPlayer: Player | undefined;
  isMyTurn: boolean;
  onOpenNegotiationModal: () => void;
  onPlayFaceSavingLifeline: () => void;
  onPlayMediatorBridge: () => void;
}

export const PowerCardsHUD: React.FC<PowerCardsHUDProps> = ({
  scenario,
  activePlayer,
  localPlayer,
  isMyTurn,
  onOpenNegotiationModal,
  onPlayFaceSavingLifeline,
  onPlayMediatorBridge,
}) => {
  const [expandedCard, setExpandedCard] = useState<'lifeline' | 'bridge' | null>(null);

  // If in Competitive scenario, display specific indicator that exchange/power cards are disabled
  const isCompetitive = scenario === 'competitive';

  return (
    <div className="flex flex-wrap items-center gap-2 bg-[#1b1d24]/90 backdrop-blur-md p-2 rounded-2xl border border-[#333744] shadow-lg">
      {/* Competitive Standard Mode Note */}
      {isCompetitive ? (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#252833] text-xs text-[#a5a39e]">
          <span className="w-2 h-2 rounded-full bg-[#cf6666]"></span>
          <span className="font-semibold text-[#edebe8]">Competitive Mode Active:</span>
          <span>Standard territorial gameplay (no power cards or exchange permitted).</span>
        </div>
      ) : (
        <>
          {/* Power Card 1: Face-Saving Lifeline */}
          <div className="relative">
            <button
              onClick={() => {
                if (isMyTurn) {
                  sound.playPowerCard();
                  onPlayFaceSavingLifeline();
                } else {
                  setExpandedCard(expandedCard === 'lifeline' ? null : 'lifeline');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isMyTurn
                  ? 'bg-[#22354a] border-[#4477aa] text-[#9fc4f0] hover:bg-[#29415c] shadow-md ring-1 ring-[#4477aa]/50'
                  : 'bg-[#1e212b] border-[#313543] text-[#a5a39e] hover:bg-[#272b38]'
              }`}
              title="Click to deploy Face-Saving Lifeline (Face-Negotiation Theory)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#6fa3e0]" />
              <span>Face-Saving Lifeline</span>
              {activePlayer?.politenessTokens ? (
                <span className="px-1.5 py-0.2 rounded-full bg-[#1b2b3b] text-[#9fc4f0] text-[10px] font-mono font-bold">
                  {activePlayer.politenessTokens} Tokens
                </span>
              ) : null}
            </button>

            {/* Tooltip info button */}
            <button
              onClick={() => setExpandedCard(expandedCard === 'lifeline' ? null : 'lifeline')}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#2a2e3a] text-[#a5a39e] hover:text-white flex items-center justify-center text-[10px] border border-[#3f4555] cursor-pointer"
            >
              ?
            </button>
          </div>

          {/* Power Card 2: The Mediator's Bridge */}
          <div className="relative">
            <button
              onClick={() => {
                if (isMyTurn) {
                  sound.playPowerCard();
                  onPlayMediatorBridge();
                } else {
                  setExpandedCard(expandedCard === 'bridge' ? null : 'bridge');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isMyTurn
                  ? 'bg-[#213a30] border-[#3d775e] text-[#80cda9] hover:bg-[#28463a] shadow-md ring-1 ring-[#3d775e]/50'
                  : 'bg-[#1e212b] border-[#313543] text-[#a5a39e] hover:bg-[#272b38]'
              }`}
              title="Click to deploy The Mediator's Bridge (Winner's Triangle)"
            >
              <HeartHandshake className="w-3.5 h-3.5 text-[#80cda9]" />
              <span>The Mediator’s Bridge</span>
              {activePlayer?.mediatorTokens ? (
                <span className="px-1.5 py-0.2 rounded-full bg-[#172c23] text-[#80cda9] text-[10px] font-mono font-bold">
                  {activePlayer.mediatorTokens} Tokens
                </span>
              ) : null}
            </button>

            {/* Tooltip info button */}
            <button
              onClick={() => setExpandedCard(expandedCard === 'bridge' ? null : 'bridge')}
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#2a2e3a] text-[#a5a39e] hover:text-white flex items-center justify-center text-[10px] border border-[#3f4555] cursor-pointer"
            >
              ?
            </button>
          </div>

          {/* 1-Minute Negotiation Exchange Launcher */}
          <button
            onClick={() => {
              sound.playTilePickup();
              onOpenNegotiationModal();
            }}
            disabled={!isMyTurn}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isMyTurn
                ? 'bg-[#3b3323] border-[#7d612e] text-[#e3b469] hover:bg-[#483e2b] shadow-md ring-1 ring-[#7d612e]/50'
                : 'bg-[#1e212b] border-[#313543] text-[#6c707d] opacity-60 cursor-not-allowed'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#e3b469]" />
            <span>Negotiate Exchange (60s Timer)</span>
          </button>
        </>
      )}

      {/* Expanded Theory Card Popover */}
      {expandedCard && (
        <div className="absolute bottom-16 left-4 z-50 w-80 bg-[#1e2129] border border-[#3b4050] rounded-2xl p-4 shadow-2xl text-xs text-[#d0ceca] animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#2d313d]">
            <span className="font-bold text-[#edebe8] flex items-center gap-1.5">
              {expandedCard === 'lifeline' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#6fa3e0]" />
                  The Face-Saving Lifeline
                </>
              ) : (
                <>
                  <HeartHandshake className="w-4 h-4 text-[#80cda9]" />
                  The Mediator’s Bridge
                </>
              )}
            </span>
            <button
              onClick={() => setExpandedCard(null)}
              className="text-[#8e92a0] hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          {expandedCard === 'lifeline' ? (
            <div className="space-y-2 text-[11px] leading-relaxed">
              <p>
                <strong>Thematic Concept:</strong> Face-Negotiation Theory &amp; Strategic De-escalation. Shifts away from toxic corner traps to grant adversaries dignity and negative face (autonomy).
              </p>
              <p>
                <strong>Trigger &amp; Acceptance:</strong> Leave an open corner escape route. Opponent is bound to play their next tile there.
              </p>
              <p>
                <strong>Player Reward:</strong> Earns 1 <em>Politeness Token</em> (-3 penalty squares deduction from endgame score).
              </p>
              <div className="p-2 rounded-lg bg-[#16181f] border border-[#2b2f3d] font-mono text-[10px] text-[#9fc4f0]">
                "True power lies not in annihilating your adversary, but in granting them the dignity to retreat."
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-[11px] leading-relaxed">
              <p>
                <strong>Thematic Concept:</strong> Karpman's Drama Triangle to Choy's Winner's Triangle (Assertive/Vulnerable/Caring).
              </p>
              <p>
                <strong>The Mechanic:</strong> Place a tile specifically constructing a physical escape pathway out for a trapped opponent.
              </p>
              <p>
                <strong>Mutual Benefit:</strong> Opponent escapes; you earn 1 <em>Mediator's Token</em> AND an immediate <strong>Bonus Action</strong> to place a 2nd tile this turn!
              </p>
              <div className="p-2 rounded-lg bg-[#16181f] border border-[#2b2f3d] font-mono text-[10px] text-[#80cda9]">
                "Transforming conflict into mutual growth and co-created pathways."
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { X, Award, Target, Flame, Users, Sparkles, CheckCircle2, ChevronRight, Crown, Lightbulb } from 'lucide-react';
import { Player, PlayerColor, ScenarioType } from '../types/game';
import { COLOR_CONFIG } from '../game/rules';

interface StageGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: ScenarioType;
  players: Player[];
  currentBoard: (PlayerColor | null)[][];
  history: import('../types/game').PlacedPiece[];
  localPlayerColor: PlayerColor;
}

export const StageGuideModal: React.FC<StageGuideModalProps> = ({
  isOpen,
  onClose,
  scenario,
  players,
  currentBoard,
  history,
  localPlayerColor,
}) => {
  if (!isOpen) return null;

  // Calculate live player points & monomino status
  const playerStats = players.map((p) => {
    let squaresPlaced = 0;
    for (let r = 0; r < 20; r++) {
      for (let c = 0; c < 20; c++) {
        if (currentBoard[r][c] === p.color) squaresPlaced++;
      }
    }
    const playerMoves = history.filter((m) => m.playerId === p.id || m.color === p.color);
    const monominoUsed = playerMoves.some((m) => m.pieceId === 'I1');
    const piecesRemaining = 21 - playerMoves.length;
    const squaresRemaining = 89 - squaresPlaced;

    // Potential max points: 89 base + 15 all placed + (monomino preserved ? 5 : 0)
    const potentialMax = monominoUsed && piecesRemaining > 0 ? 104 : 109;
    const progressPercent = Math.min(100, Math.round((squaresPlaced / 89) * 100));

    return {
      player: p,
      squaresPlaced,
      piecesRemaining,
      squaresRemaining,
      monominoUsed,
      potentialMax,
      progressPercent,
    };
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#14161b]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#21232a] border border-[#3c404b] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-auto text-[#eceae6]">
        {/* Modal Header */}
        <div className="p-5 bg-[#1b1d23] border-b border-[#343842] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2a2d36] border border-[#3f434f] flex items-center justify-center text-[#d4a359]">
              <Crown className="w-5 h-5 text-[#dfa95c]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#edebe8]">Gameplay Stages &amp; Max Points Guide</h2>
              <p className="text-xs text-[#a5a39e]">
                Master the 3 gameplay stages and manage your arsenal all the way to 109 maximum achievable points
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#2a2d36] hover:bg-[#343842] text-[#cfcdc8] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm">
          {/* Section 1: The 3 Gameplay Stages Made Simple */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9d9b96] mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#7ecba9]" />
              The 3 Natural Gameplay Stages
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Stage 1 */}
              <div className="p-3.5 rounded-xl bg-[#272a33] border border-[#3c414e] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#90b5e8] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#4f7bb6]" />
                    Stage 1
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1b1d23] text-[#cfcdc8] border border-[#343842]">
                    Turns 1–5
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-[#edebe8]">Opening Foothold</h4>
                <p className="text-xs text-[#b8b6b0] leading-relaxed">
                  Start with prompted starter tiles already deployed on corner squares. Branch outward toward the center using heavy 5-square pentominos.
                </p>
                <div className="text-[11px] text-[#90b5e8] bg-[#1d222d] p-2 rounded-lg border border-[#2f3d52]">
                  <strong>Key Goal:</strong> Establish diagonal anchors before rival lines meet.
                </div>
              </div>

              {/* Stage 2 */}
              <div className="p-3.5 rounded-xl bg-[#272a33] border border-[#3c414e] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#80cda9] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#4e9a7e]" />
                    Stage 2
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1b1d23] text-[#cfcdc8] border border-[#343842]">
                    Turns 6–14
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-[#edebe8]">Strategic Crossroad</h4>
                <p className="text-xs text-[#b8b6b0] leading-relaxed">
                  The board tightens. Execute destructive cutoffs, weave collaborative corner bridges, or maneuver through enemy diagonal crevices.
                </p>
                <div className="text-[11px] text-[#80cda9] bg-[#1a2722] p-2 rounded-lg border border-[#2d4d3f]">
                  <strong>Key Goal:</strong> Place 4-square and 5-square pieces. Keep small tiles in reserve.
                </div>
              </div>

              {/* Stage 3 */}
              <div className="p-3.5 rounded-xl bg-[#272a33] border border-[#3c414e] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#e8c382] flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#c99648]" />
                    Stage 3
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1b1d23] text-[#cfcdc8] border border-[#343842]">
                    Turns 15–21
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-[#edebe8]">Endgame Maximizer</h4>
                <p className="text-xs text-[#b8b6b0] leading-relaxed">
                  Fit small 2-3 square pieces into narrow pockets. Conserve your 1-square Monomino to be placed as your final 21st move!
                </p>
                <div className="text-[11px] text-[#e8c382] bg-[#292318] p-2 rounded-lg border border-[#4d3d24]">
                  <strong>Key Goal:</strong> Place every piece for +15, plus Monomino finale for +20 bonus!
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: How Maximum Points (109 Pts) Works */}
          <div className="p-4 rounded-xl bg-[#1b1d23] border border-[#343842] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#dfa95c] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#dfa95c]" />
                Maximum Achievable Points Breakdown
              </h3>
              <span className="text-xs font-mono font-bold text-[#dfa95c] px-2 py-0.5 rounded bg-[#2b2518] border border-[#524125]">
                Peak: 109 Points
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-[#242730] border border-[#363a45]">
                <div className="font-semibold text-[#edebe8] mb-1">1. Base Squares: 89 Pts</div>
                <p className="text-[#a5a39e] leading-snug">
                  Each square of your 21 pieces placed onto the board scores 1 point (12×5 + 5×4 + 2×3 + 1×2 + 1×1 = 89 pts).
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-[#242730] border border-[#363a45]">
                <div className="font-semibold text-[#80cda9] mb-1">2. All-Placed Bonus: +15 Pts</div>
                <p className="text-[#a5a39e] leading-snug">
                  Successfully fitting all 21 polyomino pieces onto the board awards an immediate +15 bonus (total 104 pts).
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-[#242730] border border-[#363a45]">
                <div className="font-semibold text-[#e8c382] mb-1">3. Monomino Finale: +20 Pts</div>
                <p className="text-[#a5a39e] leading-snug">
                  If the 1-square Monomino is saved and played as your final 21st piece, the bonus elevates to +20 (Total 109 max pts!).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#252832] border border-[#3a3e4b] text-xs text-[#cfcdc8]">
              <Lightbulb className="w-4 h-4 text-[#dfa95c] shrink-0 mt-0.5" />
              <div>
                <strong className="text-[#edebe8]">Pro Strategy Tip:</strong> Always deploy your largest 5-square pieces (Pentominos) early in Stages 1 and 2. Because large pieces need open corridors, playing them first ensures you never get stuck with bulky pieces later!
              </div>
            </div>
          </div>

          {/* Section 3: Live Player Points Status */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9d9b96] mb-3 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-[#90b5e8]" />
              Live Match Arsenal &amp; Points Tracker
            </h3>

            <div className="space-y-2">
              {playerStats.map((stat) => {
                const cfg = COLOR_CONFIG[stat.player.color];
                const isLocal = stat.player.color === localPlayerColor;

                return (
                  <div
                    key={stat.player.id}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isLocal
                        ? 'bg-[#272b36] border-[#4a5163]'
                        : 'bg-[#22242c] border-[#343842]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full inline-block shrink-0 shadow-xs"
                        style={{ backgroundColor: cfg.hex }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#edebe8]">{stat.player.name}</span>
                          {isLocal && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#364259] text-[#90b5e8] font-semibold">
                              YOU
                            </span>
                          )}
                          {stat.player.isBot && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#2a2d36] text-[#a5a39e]">
                              AI BOT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#a5a39e]">
                          {stat.squaresPlaced} / 89 squares placed · {stat.piecesRemaining} pieces left
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <div className="text-[10px] text-[#9d9b96]">Current Yield</div>
                        <div className="font-bold text-[#edebe8]">{stat.squaresPlaced} pts ({stat.progressPercent}%)</div>
                      </div>

                      <div>
                        <div className="text-[10px] text-[#9d9b96]">Max Possible</div>
                        <div className="font-bold text-[#dfa95c]">{stat.potentialMax} pts</div>
                      </div>

                      <div className="hidden sm:block text-right">
                        <div className="text-[10px] text-[#9d9b96]">Monomino Finale</div>
                        <div className={stat.monominoUsed ? 'text-[#a5a39e]' : 'text-[#80cda9] font-semibold'}>
                          {stat.monominoUsed ? 'Used early' : 'Active (+20 eligible)'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#1b1d23] border-t border-[#343842] flex items-center justify-between text-xs">
          <span className="text-[#9d9b96]">
            Press <strong>R</strong> to rotate piece · <strong>F</strong> to flip · <strong>M</strong> to mute audio
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#363a46] hover:bg-[#434857] text-[#edebe8] font-semibold transition-colors cursor-pointer"
          >
            Got it, Return to Game
          </button>
        </div>
      </div>
    </div>
  );
};

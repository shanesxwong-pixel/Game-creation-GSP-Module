import React, { useState } from 'react';
import {
  RotateCw,
  FlipHorizontal,
  ChevronDown,
  ChevronUp,
  SkipForward,
  ShieldAlert,
  Sparkles,
  Target,
  ArrowUpDown,
  Crown,
} from 'lucide-react';
import { ALL_PIECES } from '../game/pieces';
import { PieceDef, PlayerColor, ScenarioType } from '../types/game';
import { COLOR_CONFIG } from '../game/rules';

interface PieceTrayProps {
  playerColor: PlayerColor;
  availablePieceIds: string[];
  selectedPieceId: string | null;
  selectedMatrix: number[][] | null;
  onSelectPiece: (piece: PieceDef) => void;
  onRotatePiece: () => void;
  onFlipPiece: () => void;
  onPassTurn: () => void;
  isMyTurn: boolean;
  scenario: ScenarioType;
}

export const PieceTray: React.FC<PieceTrayProps> = ({
  playerColor,
  availablePieceIds,
  selectedPieceId,
  selectedMatrix,
  onSelectPiece,
  onRotatePiece,
  onFlipPiece,
  onPassTurn,
  isMyTurn,
  scenario,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSizeFilter, setActiveSizeFilter] = useState<number | 'all'>('all');
  const [sortByPointsDesc, setSortByPointsDesc] = useState(true);

  const colorCfg = COLOR_CONFIG[playerColor];
  let availablePieces = ALL_PIECES.filter((p) => availablePieceIds.includes(p.id));

  // Sort by point value (5 down to 1) for managing toward maximum points
  if (sortByPointsDesc) {
    availablePieces = [...availablePieces].sort((a, b) => b.size - a.size);
  }

  const filteredPieces =
    activeSizeFilter === 'all'
      ? availablePieces
      : availablePieces.filter((p) => p.size === activeSizeFilter);

  const totalRemainingSquares = availablePieces.reduce((acc, p) => acc + p.size, 0);
  const totalPlacedSquares = 89 - totalRemainingSquares;
  const isMonominoSaved = availablePieceIds.includes('I1');

  return (
    <div
      className="fixed bottom-3 left-1/2 -translate-x-1/2 w-full max-w-[980px] px-3 z-30 transition-transform duration-300 pointer-events-auto"
      style={{
        transform: isCollapsed ? 'translate(-50%, calc(100% - 38px))' : 'translate(-50%, 0)',
      }}
    >
      {/* Top Collapse & Points Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#202228]/95 border-t border-x border-[#3b3f4b] rounded-t-xl text-xs backdrop-blur-md shadow-xl text-[#edebe8]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-semibold text-[#edebe8]">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shadow-xs"
              style={{ backgroundColor: colorCfg.hex }}
            />
            {colorCfg.name} Arsenal
          </span>

          <span className="text-[#a5a39e]">
            {availablePieces.length} pieces left ·{' '}
            <strong className="text-[#edebe8] font-mono">{totalPlacedSquares}</strong> / 89 pts
            placed
          </span>

          {/* Monomino Bonus Status Tag */}
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.2 rounded-full bg-[#272931] border border-[#3e424e]">
            <Crown className="w-3 h-3 text-[#dfa95c]" />
            {isMonominoSaved ? (
              <span className="text-[#80cda9]">Monomino Finale Saved (+20 Bonus Eligible)</span>
            ) : (
              <span className="text-[#a5a39e]">Monomino used early</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Scenario Badge */}
          {scenario === 'destructive' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#382323] text-[#e88f8f] border border-[#523333] font-mono text-[11px]">
              <ShieldAlert className="w-3 h-3 text-[#e88f8f]" />
              Destructive Siege
            </span>
          )}
          {scenario === 'collaborative' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#20332c] text-[#80cda9] border border-[#2d4d3f] font-mono text-[11px]">
              <Sparkles className="w-3 h-3 text-[#80cda9]" />
              Nexus Harmony
            </span>
          )}
          {scenario === 'last_tile_challenge' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#383020] text-[#e8c382] border border-[#544425] font-mono text-[11px]">
              <Target className="w-3 h-3 text-[#dfa95c]" />
              Endgame Gambit
            </span>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#2c2f38] hover:bg-[#373b45] text-[#cfcdc8] text-[11px] transition-colors cursor-pointer"
            title="Toggle Tray (or press H)"
          >
            {isCollapsed ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Show Tray
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> Hide
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Tray Body */}
      <div className="bg-[#202228]/95 border border-[#3b3f4b] rounded-b-xl p-3 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Left: Active piece manipulation & preview */}
          <div className="flex items-center gap-3 bg-[#181a20]/90 p-2.5 rounded-xl border border-[#30333d] shrink-0">
            <div className="w-16 h-16 bg-[#21232b] rounded-lg border border-[#3b3f4b] flex items-center justify-center p-1 relative overflow-hidden">
              {selectedMatrix ? (
                <div
                  className="grid gap-0.5"
                  style={{
                    gridTemplateColumns: `repeat(${selectedMatrix[0].length}, minmax(0, 1fr))`,
                  }}
                >
                  {selectedMatrix.map((row, r) =>
                    row.map((val, c) => (
                      <div
                        key={`${r}-${c}`}
                        className={`w-2.5 h-2.5 rounded-2xs transition-all ${
                          val === 1 ? 'shadow-xs border border-white/20' : 'opacity-0'
                        }`}
                        style={{
                          backgroundColor: val === 1 ? colorCfg.hex : 'transparent',
                        }}
                      />
                    ))
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-[#878580] text-center leading-tight">
                  Pick a piece
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex gap-1.5">
                <button
                  onClick={onRotatePiece}
                  disabled={!selectedMatrix || !isMyTurn}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#2b2e37] hover:bg-[#373b46] disabled:opacity-40 text-[#edebe8] text-xs rounded-lg font-medium transition-colors cursor-pointer"
                  title="Rotate 90° Clockwise [R]"
                >
                  <RotateCw className="w-3 h-3 text-[#cfcdc8]" />
                  <span>Rot (R)</span>
                </button>
                <button
                  onClick={onFlipPiece}
                  disabled={!selectedMatrix || !isMyTurn}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#2b2e37] hover:bg-[#373b46] disabled:opacity-40 text-[#edebe8] text-xs rounded-lg font-medium transition-colors cursor-pointer"
                  title="Flip Horizontal [F]"
                >
                  <FlipHorizontal className="w-3 h-3 text-[#cfcdc8]" />
                  <span>Flip (F)</span>
                </button>
              </div>

              <button
                onClick={onPassTurn}
                disabled={!isMyTurn}
                className="flex items-center justify-center gap-1 px-2.5 py-1 bg-[#3a2727] hover:bg-[#4a3232] border border-[#593939] disabled:opacity-30 text-[#e88f8f] text-xs rounded-lg font-medium transition-colors cursor-pointer"
                title="Pass Turn when no legal moves remain"
              >
                <SkipForward className="w-3 h-3" />
                <span>Pass Turn</span>
              </button>
            </div>
          </div>

          {/* Center: Filter Tabs by Point Value */}
          <div className="flex items-center gap-1 bg-[#181a20]/90 p-1 rounded-xl border border-[#30333d] shrink-0 text-xs">
            <button
              onClick={() => setActiveSizeFilter('all')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer text-[11px] ${
                activeSizeFilter === 'all'
                  ? 'bg-[#3b3f4c] text-[#edebe8] font-semibold'
                  : 'text-[#a5a39e] hover:text-[#edebe8]'
              }`}
            >
              All ({availablePieces.length})
            </button>
            {[5, 4, 3, 2, 1].map((size) => {
              const count = availablePieces.filter((p) => p.size === size).length;
              return (
                <button
                  key={size}
                  onClick={() => setActiveSizeFilter(size)}
                  className={`px-2 py-1 rounded-lg transition-colors cursor-pointer text-[11px] flex items-center gap-0.5 ${
                    activeSizeFilter === size
                      ? 'bg-[#3b3f4c] text-[#edebe8] font-semibold'
                      : 'text-[#a5a39e] hover:text-[#edebe8]'
                  }`}
                  title={`Filter ${size}-point pieces`}
                >
                  <span>{size}pt</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}

            {/* Sort Toggle */}
            <button
              onClick={() => setSortByPointsDesc(!sortByPointsDesc)}
              className={`p-1 rounded-lg transition-colors cursor-pointer ml-1 ${
                sortByPointsDesc ? 'text-[#dfa95c] bg-[#292419]' : 'text-[#878580]'
              }`}
              title="Toggle Points Sorting (High to Low to prioritize maximum score)"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Scrollable Pieces Shelf with Point Labels */}
          <div className="flex-1 overflow-x-auto flex items-center gap-2 py-1 px-1 min-h-[66px] scrollbar-thin scrollbar-thumb-[#363a45]">
            {filteredPieces.map((piece) => {
              const isSelected = selectedPieceId === piece.id;
              const isMonomino = piece.id === 'I1';

              return (
                <button
                  key={piece.id}
                  onClick={() => onSelectPiece(piece)}
                  disabled={!isMyTurn}
                  className={`shrink-0 p-1.5 rounded-xl border transition-all relative ${
                    isSelected
                      ? 'bg-[#2b2e38] border-[#8a91a3] shadow-md ring-1 ring-[#8a91a3]'
                      : isMonomino
                      ? 'bg-[#26231a] border-[#5e4f2b] hover:border-[#8f753e]'
                      : 'bg-[#1b1d24] border-[#30333e] hover:border-[#424755] hover:bg-[#232630]'
                  } ${!isMyTurn ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {isMonomino && (
                    <Crown className="w-2.5 h-2.5 text-[#dfa95c] absolute -top-1 -right-1" />
                  )}

                  <div
                    className="grid gap-0.5 mx-auto"
                    style={{
                      gridTemplateColumns: `repeat(${piece.matrix[0].length}, minmax(0, 1fr))`,
                    }}
                  >
                    {piece.matrix.map((row, r) =>
                      row.map((val, c) => (
                        <div
                          key={`${r}-${c}`}
                          className={`w-2 h-2 rounded-2xs ${
                            val === 1
                              ? isSelected
                                ? 'bg-[#edebe8]'
                                : isMonomino
                                ? 'bg-[#dfa95c]'
                                : 'bg-[#9da2b0]'
                              : 'opacity-0'
                          }`}
                        />
                      ))
                    )}
                  </div>

                  <div className="text-[9px] font-mono text-center mt-1 text-[#a5a39e]">
                    {piece.size} pt{piece.size > 1 ? 's' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

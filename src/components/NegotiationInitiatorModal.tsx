import React, { useState } from 'react';
import { X, ArrowRightLeft, Clock, Sparkles } from 'lucide-react';
import { Player, PlayerColor, RoomState } from '../types/game';
import { ALL_PIECES } from '../game/pieces';
import { COLOR_CONFIG } from '../game/rules';

interface NegotiationInitiatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: RoomState;
  activePlayerColor: PlayerColor;
  onInitiate: (targetId: string, offeredPieceId: string, requestedPieceId: string) => void;
}

export const NegotiationInitiatorModal: React.FC<NegotiationInitiatorModalProps> = ({
  isOpen,
  onClose,
  room,
  activePlayerColor,
  onInitiate,
}) => {
  if (!isOpen) return null;

  const opponents = room.players.filter((p) => p.color !== activePlayerColor);
  const [selectedTargetId, setSelectedTargetId] = useState<string>(opponents[0]?.id || '');
  const [offeredPieceId, setOfferedPieceId] = useState<string>('L4');
  const [requestedPieceId, setRequestedPieceId] = useState<string>('T4');

  const selectedOpponent = opponents.find((p) => p.id === selectedTargetId) || opponents[0];

  // Active player's unplaced pieces
  const myPlayedIds = room.history
    .filter((h) => h.color === activePlayerColor)
    .map((h) => h.pieceId);
  const myAvailablePieces = ALL_PIECES.filter((p) => !myPlayedIds.includes(p.id));

  // Opponent's unplaced pieces
  const oppPlayedIds = room.history
    .filter((h) => h.color === selectedOpponent?.color)
    .map((h) => h.pieceId);
  const oppAvailablePieces = ALL_PIECES.filter((p) => !oppPlayedIds.includes(p.id));

  const handleLaunch = () => {
    if (!selectedTargetId || !offeredPieceId || !requestedPieceId) return;
    onInitiate(selectedTargetId, offeredPieceId, requestedPieceId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#121418]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1e2129] border border-[#3b4050] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-b from-[#262933] to-[#1e2129] border-b border-[#313543] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#294237] border border-[#44715c] flex items-center justify-center text-[#80cda9]">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#edebe8]">Initiate 1-Minute Tile Negotiation</h3>
              <p className="text-[11px] text-[#9a9eab]">
                Propose a tile shape swap to overcome deadlocks. 60-second timer will start immediately!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#2b2f3d] text-[#8e92a0] hover:text-[#edebe8] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {/* Step 1: Select Opponent */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a5a39e] font-mono mb-2">
              1. Select Negotiation Partner
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {opponents.map((opp) => {
                const cfg = COLOR_CONFIG[opp.color];
                const isSelected = opp.id === selectedTargetId;
                return (
                  <button
                    key={opp.id}
                    onClick={() => setSelectedTargetId(opp.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#29323a] border-[#4f7bb6] ring-1 ring-[#4f7bb6]'
                        : 'bg-[#181a20] border-[#2d313c] hover:bg-[#21242d]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cfg.hex }}
                      ></span>
                      <span className="text-xs font-bold text-[#edebe8] truncate">
                        {opp.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Offered Piece */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a5a39e] font-mono mb-2">
              2. Your Piece to Offer
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-2 bg-[#171920] rounded-xl border border-[#2b2e3a]">
              {myAvailablePieces.map((p) => {
                const isSelected = offeredPieceId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setOfferedPieceId(p.id)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#283e33] border-[#4e886e] text-[#80cda9]'
                        : 'bg-[#20222a] border-[#313542] text-[#c0c2cc] hover:bg-[#272a35]'
                    }`}
                  >
                    {p.id} ({p.size}p)
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Requested Piece */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#a5a39e] font-mono mb-2">
              3. Desired Piece from Partner
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-36 overflow-y-auto p-2 bg-[#171920] rounded-xl border border-[#2b2e3a]">
              {oppAvailablePieces.map((p) => {
                const isSelected = requestedPieceId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setRequestedPieceId(p.id)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#3d3322] border-[#8a6b32] text-[#d2983b]'
                        : 'bg-[#20222a] border-[#313542] text-[#c0c2cc] hover:bg-[#272a35]'
                    }`}
                  >
                    {p.id} ({p.size}p)
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pedagogical Note */}
          <div className="p-3 rounded-xl bg-[#171a22] border border-[#2a2e3a] text-[11px] text-[#9aa0b0] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#80cda9] shrink-0" />
            <span>
              Once initiated, a strict <strong>60-second countdown</strong> will begin. If the timer reaches 0 without acceptance, the turn forfeits immediately to the next player!
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#16181f] border-t border-[#313543] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#252833] hover:bg-[#2e323f] text-xs font-semibold text-[#edebe8] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleLaunch}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#376551] hover:bg-[#41765e] border border-[#4c896e] text-xs font-bold text-white transition-all shadow-md cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            Start 1-Minute Negotiation Window
          </button>
        </div>
      </div>
    </div>
  );
};

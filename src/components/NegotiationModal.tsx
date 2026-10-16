import React, { useEffect, useState, useRef } from 'react';
import {
  Clock,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Users,
} from 'lucide-react';
import { ActiveNegotiation, PlayerColor, RoomState } from '../types/game';
import { COLOR_CONFIG } from '../game/rules';
import { sound } from '../audio/synth';

interface NegotiationModalProps {
  negotiation: ActiveNegotiation;
  room: RoomState;
  localPlayerColor: PlayerColor;
  onAccept: () => void;
  onDecline: () => void;
  onTimeout: () => void;
}

export const NegotiationModal: React.FC<NegotiationModalProps> = ({
  negotiation,
  room,
  localPlayerColor,
  onAccept,
  onDecline,
  onTimeout,
}) => {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(() =>
    Math.max(0, negotiation.expiresAt - Date.now())
  );
  const lastSecondTickedRef = useRef<number>(-1);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, negotiation.expiresAt - Date.now());
      setTimeLeftMs(remaining);

      // Play tick sound every second
      const secondsLeft = Math.floor(remaining / 1000);
      if (secondsLeft !== lastSecondTickedRef.current && secondsLeft >= 0) {
        lastSecondTickedRef.current = secondsLeft;
        sound.playTimerTick(secondsLeft <= 10);
      }

      if (remaining <= 0) {
        clearInterval(timer);
        sound.playNegotiationTimeout();
        onTimeout();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [negotiation.expiresAt, onTimeout]);

  const totalDuration = 60000;
  const progressPercent = Math.min(100, Math.max(0, (timeLeftMs / totalDuration) * 100));
  const secondsLeft = (timeLeftMs / 1000).toFixed(1);
  const isUrgent = timeLeftMs < 15000;

  const initiatorCfg = COLOR_CONFIG[negotiation.initiatorColor];
  const targetCfg = COLOR_CONFIG[negotiation.targetColor];

  // In hotseat or multi-tab, either the target player or the host can respond
  const canRespond = true;

  return (
    <div className="fixed inset-0 z-50 bg-[#121418]/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1e2129] border border-[#3b4050] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top 60-Second Countdown Meter */}
        <div className="relative bg-[#16181f] p-4 border-b border-[#2d313d]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock
                className={`w-5 h-5 ${
                  isUrgent ? 'text-[#cf6666] animate-bounce' : 'text-[#80cda9] animate-pulse'
                }`}
              />
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-[#a5a39e]">
                Autonomous Negotiation Window
              </span>
            </div>
            <div
              className={`font-mono text-lg font-black ${
                isUrgent ? 'text-[#cf6666]' : 'text-[#80cda9]'
              }`}
            >
              {secondsLeft}s
            </div>
          </div>

          {/* Shrinking time bar */}
          <div className="w-full h-2.5 bg-[#252833] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-100 rounded-full ${
                isUrgent ? 'bg-[#cf6666]' : timeLeftMs < 30000 ? 'bg-[#d2983b]' : 'bg-[#80cda9]'
              }`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-1.5 text-[10px] text-[#7d818f] font-mono">
            <span>60-Second Mutual Accord Timer</span>
            <span>If timer expires: Turn forfeited to next player!</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <div className="text-center">
            <h3 className="text-base font-bold text-[#edebe8] flex items-center justify-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-[#80cda9]" />
              Tile Position &amp; Shape Exchange Proposed
            </h3>
            <p className="text-xs text-[#a5a39e] mt-1">
              Rationale of negotiation: exchanging spatial polyominos to break territorial gridlock and escape Karpman's Drama Triangle.
            </p>
          </div>

          {/* Exchange Visuals */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#171920] border border-[#2c303c] items-center">
            {/* Offering Side */}
            <div className="p-3 rounded-xl bg-[#20232b] border border-[#2f333f] text-center">
              <span className="text-[10px] font-mono text-[#7d818f] uppercase">Offer From</span>
              <div className="flex items-center justify-center gap-1.5 mt-1 mb-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: initiatorCfg.hex }}
                ></span>
                <span className="text-xs font-bold text-[#edebe8]">{negotiation.initiatorName}</span>
              </div>
              <div className="px-3 py-2 rounded-lg bg-[#272b36] border border-[#3c4252] font-mono text-sm font-bold text-[#80cda9]">
                Piece [{negotiation.offeredPieceId}]
              </div>
            </div>

            {/* Requested Side */}
            <div className="p-3 rounded-xl bg-[#20232b] border border-[#2f333f] text-center">
              <span className="text-[10px] font-mono text-[#7d818f] uppercase">Requested From</span>
              <div className="flex items-center justify-center gap-1.5 mt-1 mb-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: targetCfg.hex }}
                ></span>
                <span className="text-xs font-bold text-[#edebe8]">{negotiation.targetName}</span>
              </div>
              <div className="px-3 py-2 rounded-lg bg-[#272b36] border border-[#3c4252] font-mono text-sm font-bold text-[#d2983b]">
                Piece [{negotiation.requestedPieceId}]
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#22252f] border border-[#323644] text-[11px] text-[#9ca0ad] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[#d2983b] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#edebe8]">Pedagogical Rationale:</strong> In negotiation theory, fixed positions lead to stalemate. Trading asymmetric shapes provides both actors with legal corner maneuvers while resetting mutual trust.
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 bg-[#16181f] border-t border-[#2d313d] flex items-center justify-end gap-3">
          <button
            onClick={() => {
              sound.playPlacement();
              onDecline();
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#292c37] hover:bg-[#323644] border border-[#3d4253] text-xs font-semibold text-[#edebe8] transition-colors cursor-pointer"
          >
            <XCircle className="w-4 h-4 text-[#cf6666]" />
            Decline Negotiation
          </button>

          {canRespond && (
            <button
              onClick={() => {
                sound.playNegotiationAccord();
                onAccept();
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#3b6753] hover:bg-[#457861] border border-[#4e886e] text-xs font-bold text-white transition-all shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#80cda9]" />
              Accept Exchange &amp; Mutual Accord
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

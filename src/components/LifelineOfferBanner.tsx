import React from 'react';
import { ShieldCheck, Check, X, AlertCircle } from 'lucide-react';
import { RoomState } from '../types/game';
import { COLOR_CONFIG } from '../game/rules';
import { sound } from '../audio/synth';

interface LifelineOfferBannerProps {
  offer: RoomState['activeLifelineOffer'];
  room: RoomState;
  onAccept: () => void;
  onDecline: () => void;
}

export const LifelineOfferBanner: React.FC<LifelineOfferBannerProps> = ({
  offer,
  room,
  onAccept,
  onDecline,
}) => {
  if (!offer) return null;

  const proposer = room.players.find((p) => p.id === offer.proposerId);
  const target = room.players.find((p) => p.id === offer.targetId);

  const proposerCfg = proposer ? COLOR_CONFIG[proposer.color] : null;
  const targetCfg = target ? COLOR_CONFIG[target.color] : null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 animate-in fade-in slide-in-from-top-4">
      <div className="bg-[#1f222b]/95 border border-[#4d7cbb] rounded-2xl p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#20364d] border border-[#3b6391] flex items-center justify-center text-[#7cb1f2] shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-bold text-[#7cb1f2] tracking-wider">
                Face-Saving Lifeline Offered
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#172738] text-[#90c0fa] border border-[#2c4766] font-mono">
                Face-Negotiation Theory
              </span>
            </div>

            <p className="text-xs text-[#edebe8] mt-1 font-semibold">
              <span style={{ color: proposerCfg?.hex }}>{proposer?.name}</span> offered{' '}
              <span style={{ color: targetCfg?.hex }}>{target?.name}</span> a diplomatic escape route at corner ({offer.corner.row}, {offer.corner.col})!
            </p>

            <p className="text-[11px] text-[#9ca1af] mt-1 leading-snug">
              <strong>Condition:</strong> If accepted, {target?.name} must play their next tile into this open corner. {proposer?.name} immediately earns 1 Politeness Token (-3 endgame penalty deduction).
            </p>

            <div className="flex items-center gap-2.5 mt-3">
              <button
                onClick={() => {
                  sound.playNegotiationAccord();
                  onAccept();
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#335d45] hover:bg-[#3d6e52] border border-[#4a8463] text-xs font-bold text-white transition-all shadow-md cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 text-[#80cda9]" />
                Accept Lifeline (-3 Token for {proposer?.name})
              </button>

              <button
                onClick={() => {
                  sound.playPlacement();
                  onDecline();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#282b36] hover:bg-[#313543] border border-[#3d4253] text-xs font-semibold text-[#a5a9b8] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-[#cf6666]" />
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

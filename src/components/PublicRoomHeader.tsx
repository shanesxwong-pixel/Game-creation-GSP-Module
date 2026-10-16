import React, { useState } from 'react';
import {
  Users,
  Copy,
  Check,
  RotateCcw,
  Bot,
  User,
  Shield,
  HeartHandshake,
  Swords,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';
import { Player, PlayerColor, RoomState, ScenarioType } from '../types/game';
import { COLOR_CONFIG } from '../game/rules';
import { SCENARIOS } from '../game/scenarios';
import { sound } from '../audio/synth';

interface PublicRoomHeaderProps {
  room: RoomState;
  activePlayer: Player | undefined;
  activeControlColor: PlayerColor;
  onChangeScenario: (sc: ScenarioType) => void;
  onClaimSeat: (color: PlayerColor) => void;
  onToggleBot: (color: PlayerColor) => void;
  onResetMatch: () => void;
}

export const PublicRoomHeader: React.FC<PublicRoomHeaderProps> = ({
  room,
  activePlayer,
  activeControlColor,
  onChangeScenario,
  onClaimSeat,
  onToggleBot,
  onResetMatch,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const currentScenario = room.scenario;

  const serverUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?room=PUBLIC`
      : 'https://ais-dev-...run.app/?room=PUBLIC';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(serverUrl);
    setCopiedLink(true);
    sound.playTilePickup();
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <header className="w-full bg-[#171920]/95 border-b border-[#2d313d] px-3 py-2 z-20 flex flex-col gap-2">
      {/* Top Row: Title, Link, Scenarios, and Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Public Room Banner */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#283244] border border-[#3b4c68] flex items-center justify-center text-[#8eb2ea] font-bold text-xs shadow-sm">
            4P
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#edebe8] tracking-wide">
                Unified Public Arena
              </span>
              <span className="w-2 h-2 rounded-full bg-[#80cda9] animate-pulse"></span>
              <span className="text-[10px] text-[#80cda9] font-mono">Live Server Link</span>
            </div>
            <div className="text-[10px] text-[#8a8e9d] hidden sm:block">
              One shared public room · All 4 players human-controllable
            </div>
          </div>
        </div>

        {/* 3 Integrated Scenario Switchers */}
        <div className="flex items-center bg-[#1e2129] p-1 rounded-xl border border-[#2f3340] gap-1">
          {/* Competitive (Standard Gameplay) */}
          <button
            onClick={() => {
              sound.playRotate();
              onChangeScenario('competitive');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentScenario === 'competitive' || currentScenario === 'destructive'
                ? 'bg-[#3b2929] text-[#e08989] border border-[#5e3c3c] shadow-sm'
                : 'text-[#8a8e9d] hover:text-[#edebe8]'
            }`}
            title="Competitive: Standard Blokus Gameplay with no exchange cards"
          >
            <Swords className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Competitive (Standard)</span>
            <span className="md:hidden">Standard</span>
          </button>

          {/* Face-Saving & De-escalation */}
          <button
            onClick={() => {
              sound.playRotate();
              onChangeScenario('face_saving');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentScenario === 'face_saving' || currentScenario === 'last_tile_challenge'
                ? 'bg-[#213247] text-[#8eb5e6] border border-[#375479] shadow-sm'
                : 'text-[#8a8e9d] hover:text-[#edebe8]'
            }`}
            title="Face-Saving & Strategic De-escalation: Face-Negotiation Theory & Politeness Tokens"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Face-Saving</span>
            <span className="md:hidden">Face-Save</span>
          </button>

          {/* The Mediator's Bridge (Winner's Triangle) */}
          <button
            onClick={() => {
              sound.playRotate();
              onChangeScenario('mediator_bridge');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentScenario === 'mediator_bridge' || currentScenario === 'collaborative'
                ? 'bg-[#223930] text-[#80cda9] border border-[#3b6b55] shadow-sm'
                : 'text-[#8a8e9d] hover:text-[#edebe8]'
            }`}
            title="The Mediator’s Bridge: Winner's Triangle & 1-Minute Tile Negotiation"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mediator’s Bridge</span>
            <span className="md:hidden">Negotiate</span>
          </button>
        </div>

        {/* Link Copy & Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#232631] hover:bg-[#2b2f3d] border border-[#343846] text-xs font-semibold text-[#edebe8] transition-colors cursor-pointer"
            title="Copy Public Server Link for students and teachers"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#80cda9]" />
                <span className="text-[#80cda9] text-[11px]">Link Copied!</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-3.5 h-3.5 text-[#80cda9]" />
                <span className="text-[11px]">Copy Server Link</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              if (window.confirm('Reset arena for a fresh 4-player game?')) {
                onResetMatch();
              }
            }}
            className="p-1.5 rounded-xl bg-[#232631] hover:bg-[#2b2f3d] border border-[#343846] text-[#8a8e9d] hover:text-[#edebe8] transition-colors cursor-pointer"
            title="Reset Arena"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Row: 4 Player Seat Stations */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {room.players.map((p) => {
          const cfg = COLOR_CONFIG[p.color];
          const isTurn = activePlayer?.id === p.id;
          const isSelected = activeControlColor === p.color;

          return (
            <div
              key={p.color}
              className={`px-2.5 py-1.5 rounded-xl border transition-all flex items-center justify-between gap-1.5 ${
                isTurn
                  ? 'bg-[#232733] border-[#4f7bb6] ring-1 ring-[#4f7bb6]/40 shadow-sm'
                  : 'bg-[#1b1d24] border-[#292d37]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: cfg.hex }}
                ></span>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#edebe8] truncate flex items-center gap-1">
                    {p.name}
                    {isTurn && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#80cda9] inline-block animate-ping"></span>
                    )}
                  </div>
                  <div className="text-[9px] text-[#7d818f] font-mono">
                    {p.isBot ? 'AI Bot' : 'Human'} · {p.politenessTokens > 0 ? `${p.politenessTokens}P ` : ''}{p.mediatorTokens > 0 ? `${p.mediatorTokens}M` : ''}
                  </div>
                </div>
              </div>

              {/* Controls: Toggle Bot / Take Control */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onToggleBot(p.color)}
                  className={`p-1 rounded-lg border text-[10px] transition-colors cursor-pointer ${
                    p.isBot
                      ? 'bg-[#282d3b] border-[#394155] text-[#8eb5e6] hover:bg-[#32394a]'
                      : 'bg-[#25362d] border-[#3a5848] text-[#80cda9] hover:bg-[#2d4337]'
                  }`}
                  title={p.isBot ? 'Switch to Human Controlled' : 'Switch to AI Bot'}
                >
                  {p.isBot ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                </button>

                <button
                  onClick={() => onClaimSeat(p.color)}
                  className={`px-1.5 py-0.5 rounded-lg border text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#3b4458] border-[#5a6a8c] text-white'
                      : 'bg-[#20222a] border-[#2d313c] text-[#8a8e9d] hover:text-[#edebe8]'
                  }`}
                  title="Control this player"
                >
                  {isSelected ? 'Active' : 'Play'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </header>
  );
};

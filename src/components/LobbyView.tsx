import React, { useState } from 'react';
import {
  Users,
  Play,
  Bot,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Target,
  Copy,
  Check,
  Zap,
  Globe,
  Link as LinkIcon,
  ExternalLink,
} from 'lucide-react';
import { PlayerColor, RoomState, ScenarioType } from '../types/game';
import { COLOR_CONFIG } from '../game/rules';
import { SCENARIOS } from '../game/scenarios';
import { sound } from '../audio/synth';

interface LobbyViewProps {
  room: RoomState | null;
  localPlayerId: string;
  onCreateRoom: (name: string, scenario: ScenarioType, maxPlayers: 2 | 4, color: PlayerColor) => void;
  onJoinRoom: (roomId: string, color?: PlayerColor) => void;
  onQuickMatch: () => void;
  onAddBot: (personality?: 'destructive' | 'collaborative' | 'balanced' | 'puzzle_master') => void;
  onRemovePlayer: (playerId: string) => void;
  onChangeScenario: (scenario: ScenarioType) => void;
  onTogglePromptedTiles?: (enabled: boolean) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onBackToTitle: () => void;
  isWsConnected: boolean;
  playerName: string;
  setPlayerName: (name: string) => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  localPlayerId,
  onCreateRoom,
  onJoinRoom,
  onQuickMatch,
  onAddBot,
  onRemovePlayer,
  onChangeScenario,
  onTogglePromptedTiles,
  onStartGame,
  onLeaveRoom,
  onBackToTitle,
  isWsConnected,
  playerName,
  setPlayerName,
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'create'>('browse');
  const [customRoomId, setCustomRoomId] = useState('');
  const [roomNameInput, setRoomNameInput] = useState('Nexus Arena');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('collaborative');
  const [selectedMaxPlayers, setSelectedMaxPlayers] = useState<2 | 4>(4);
  const [selectedColor, setSelectedColor] = useState<PlayerColor>('blue');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Mock available public rooms
  const publicRooms = [
    {
      id: 'BLOK-4081',
      name: 'Siege Arena',
      scenario: 'destructive' as ScenarioType,
      players: 2,
      max: 4,
      host: 'Valkyrie',
    },
    {
      id: 'BLOK-7729',
      name: 'Harmonic Geometry',
      scenario: 'collaborative' as ScenarioType,
      players: 3,
      max: 4,
      host: 'Zephyr',
    },
    {
      id: 'BLOK-1904',
      name: 'Monomino Showdown',
      scenario: 'last_tile_challenge' as ScenarioType,
      players: 1,
      max: 2,
      host: 'Oracle',
    },
  ];

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?room=${room?.roomId || 'DEMO'}`
      : `?room=${room?.roomId || 'DEMO'}`;

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!room) return;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const localPlayer = room?.players.find((p) => p.id === localPlayerId);
  const isHost = localPlayer?.isHost;

  return (
    <div className="fixed inset-0 z-40 bg-[#16181d]/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#202228] border border-[#3b3f4b] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in zoom-in-95 duration-250 text-[#edebe8]">
        {/* Soft Neutral Header */}
        <div className="p-6 bg-[#1a1c22]/90 border-b border-[#2d313c] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#282b33] border border-[#373b46] flex items-center justify-center text-[#cfcdc8]">
              <Globe className="w-5 h-5 text-[#a5a39e]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#edebe8]">Blokus Matchmaking &amp; Lobby</h2>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isWsConnected ? 'bg-[#4e9a7e]' : 'bg-[#c99648]'
                  }`}
                  title={isWsConnected ? 'WebSocket Online' : 'P2P Cross-Tab Mode'}
                />
              </div>
              <p className="text-xs text-[#a5a39e]">
                Live multiplayer sessions across 3 strategic scenarios in a soft, comfortable environment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your Call-sign"
              className="px-3 py-1.5 bg-[#262830] border border-[#3b3f4b] rounded-xl text-xs text-[#edebe8] placeholder-[#7d7a75] focus:outline-hidden focus:border-[#585e70] font-medium"
            />
          </div>
        </div>

        {/* IN-ROOM WAITING AREA */}
        {room ? (
          <div className="p-6 space-y-5">
            {/* Room Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#1b1d24] border border-[#2d313c]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[#edebe8]">{room.roomName}</span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#272a33] hover:bg-[#343844] text-[11px] font-mono text-[#cfcdc8] border border-[#3b3f4c] transition-colors"
                    title="Click to copy room code"
                  >
                    <span>{room.roomId}</span>
                    {copiedCode ? <Check className="w-3 h-3 text-[#80cda9]" /> : <Copy className="w-3 h-3 text-[#a5a39e]" />}
                  </button>
                </div>
                <div className="text-xs text-[#a5a39e] mt-1 flex items-center gap-2">
                  <span>Capacity: {room.players.length} / {room.maxPlayers} Players</span>
                  <span>·</span>
                  <span className="text-[#edebe8] font-medium uppercase font-mono">
                    Mode: {room.scenario.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Scenario Toggle in Room */}
              {isHost && (
                <div className="flex gap-1 bg-[#262932] p-1 rounded-xl border border-[#373b47]">
                  {(['destructive', 'collaborative', 'last_tile_challenge'] as ScenarioType[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => onChangeScenario(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        room.scenario === st
                          ? 'bg-[#3b3f4c] text-[#edebe8] shadow-xs'
                          : 'text-[#a5a39e] hover:text-[#edebe8]'
                      }`}
                    >
                      {st === 'destructive' ? 'Destructive' : st === 'collaborative' ? 'Nexus' : 'Last Tile'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direct HTML Share Link */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-[#1a1c22] border border-[#2d313c] text-xs text-[#cfcdc8]">
              <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                <LinkIcon className="w-3.5 h-3.5 text-[#a5a39e] shrink-0" />
                <span className="text-[#a5a39e] font-mono text-[11px] shrink-0">Direct HTML Link:</span>
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[#90b5e8] hover:text-[#b4d2fb] underline truncate text-[11px] inline-flex items-center gap-1"
                  title="Direct HTML join link for this match"
                >
                  <span className="truncate">{shareUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                </a>
              </div>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-[#272a33] hover:bg-[#343844] text-[#edebe8] text-xs font-medium border border-[#3b3f4c] shrink-0 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-[#80cda9]" /> : <Copy className="w-3.5 h-3.5 text-[#a5a39e]" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy HTML Link'}</span>
              </button>
            </div>

            {/* Prompted Starter Tiles Setting */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#1a1c22] border border-[#2d313c] text-xs">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#dfa95c]" />
                <div>
                  <span className="font-semibold text-[#edebe8]">Prompted Starter Foundation Tiles</span>
                  <p className="text-[11px] text-[#a5a39e]">
                    Players start with their first corner tile already placed on the board for a faster opening and simpler learning curve.
                  </p>
                </div>
              </div>
              {isHost ? (
                <button
                  onClick={() => onTogglePromptedTiles?.(!room.startWithPromptedTiles)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    room.startWithPromptedTiles !== false
                      ? 'bg-[#294a3d] text-[#80cda9] border-[#3d6e5a]'
                      : 'bg-[#282b34] text-[#a5a39e] border-[#3c414f]'
                  }`}
                >
                  {room.startWithPromptedTiles !== false ? 'Enabled (Default)' : 'Disabled'}
                </button>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded bg-[#272a33] text-[#80cda9] font-mono">
                  {room.startWithPromptedTiles !== false ? 'Enabled' : 'Disabled'}
                </span>
              )}
            </div>

            {/* Players Slots List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#a5a39e] uppercase tracking-wider">
                  Connected Commanders ({room.players.length}/{room.maxPlayers})
                </span>
                {isHost && room.players.length < room.maxPlayers && (
                  <button
                    onClick={() => onAddBot()}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#272a33] hover:bg-[#343844] text-[#edebe8] text-xs font-medium rounded-lg border border-[#3b3f4c] transition-colors cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5 text-[#a5a39e]" /> + Add AI Strategist
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {room.players.map((p) => {
                  const colorInfo = COLOR_CONFIG[p.color];
                  const isMe = p.id === localPlayerId;

                  return (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-2xl bg-[#1b1d24] border border-[#2d313c] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-full shadow-sm"
                          style={{ backgroundColor: colorInfo.hex }}
                        />
                        <div>
                          <div className="text-sm font-semibold text-[#edebe8] flex items-center gap-1.5">
                            {p.name}
                            {isMe && <span className="text-[10px] text-[#90b5e8] font-mono">(You)</span>}
                            {p.isHost && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#383020] text-[#e8c382] border border-[#524125]">
                                HOST
                              </span>
                            )}
                            {p.isBot && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#282b33] text-[#a5a39e] border border-[#383c48]">
                                BOT
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#a5a39e] font-mono">
                            {colorInfo.name} · {p.botPersonality || 'Ready'}
                          </div>
                        </div>
                      </div>

                      {isHost && !isMe && (
                        <button
                          onClick={() => onRemovePlayer(p.id)}
                          className="text-xs text-[#e88f8f] hover:text-[#f2a5a5] px-2 py-1 rounded-lg bg-[#272020] border border-[#4d3232] cursor-pointer"
                        >
                          Kick
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Empty Slots */}
                {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="p-3.5 rounded-2xl border border-dashed border-[#343844] flex items-center justify-center text-[#7d7a75] text-xs gap-2"
                  >
                    <Users className="w-4 h-4 opacity-40" />
                    <span>Awaiting player or bot...</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-[#2d313c] flex items-center justify-between">
              <button
                onClick={onLeaveRoom}
                className="px-4 py-2 rounded-xl bg-[#272a33] hover:bg-[#343844] text-[#cfcdc8] text-xs font-semibold transition-colors cursor-pointer"
              >
                Leave Room
              </button>

              <div className="flex items-center gap-3">
                {isHost ? (
                  <button
                    onClick={() => {
                      sound.playPlacement();
                      onStartGame();
                    }}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#363a46] hover:bg-[#434857] text-[#edebe8] text-sm font-bold shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-[#edebe8]" /> Launch Match
                  </button>
                ) : (
                  <span className="text-xs text-[#a5a39e] font-mono">
                    Awaiting host to launch match...
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* LOBBY BROWSER & CREATOR */
          <div className="p-6 space-y-6">
            {/* Quick Match Banner */}
            <div className="p-4 rounded-2xl bg-[#1b1d24] border border-[#2d313c] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-[#edebe8] font-bold text-sm">
                  <Zap className="w-4 h-4 text-[#dfa95c]" /> Seamless Matchmaking
                </div>
                <p className="text-xs text-[#a5a39e] max-w-md">
                  Jump directly into an active game session with prompted foundation tiles or match against tactical commanders.
                </p>
              </div>

              <button
                onClick={() => {
                  sound.playTilePickup();
                  onQuickMatch();
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#363a46] hover:bg-[#434857] text-[#edebe8] text-xs font-bold shadow-sm transition-all hover:scale-102 shrink-0 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-[#edebe8]" /> Quick Match
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#2d313c] gap-4">
              <button
                onClick={() => setActiveTab('browse')}
                className={`pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'browse'
                    ? 'border-[#9da2b0] text-[#edebe8]'
                    : 'border-transparent text-[#a5a39e] hover:text-[#edebe8]'
                }`}
              >
                Browse Public Lobbies
              </button>
              <button
                onClick={() => setActiveTab('create')}
                className={`pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === 'create'
                    ? 'border-[#9da2b0] text-[#edebe8]'
                    : 'border-transparent text-[#a5a39e] hover:text-[#edebe8]'
                }`}
              >
                Create Custom Match
              </button>
            </div>

            {activeTab === 'browse' ? (
              <div className="space-y-4">
                {/* Direct Room Code Join */}
                <div className="flex gap-2 p-3 bg-[#1b1d24] rounded-xl border border-[#2d313c]">
                  <input
                    type="text"
                    value={customRoomId}
                    onChange={(e) => setCustomRoomId(e.target.value.toUpperCase())}
                    placeholder="Enter Room Code (e.g. BLOK-4081)"
                    className="flex-1 px-3 py-1.5 bg-[#252831] border border-[#373b47] rounded-lg text-xs text-[#edebe8] placeholder-[#7d7a75] font-mono"
                  />
                  <button
                    onClick={() => {
                      if (customRoomId.trim()) {
                        onJoinRoom(customRoomId.trim());
                      }
                    }}
                    disabled={!customRoomId.trim()}
                    className="px-4 py-1.5 bg-[#363a46] hover:bg-[#434857] disabled:opacity-40 text-[#edebe8] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Join
                  </button>
                </div>

                {/* Available Public Rooms */}
                <div className="space-y-2.5">
                  {publicRooms.map((r) => {
                    const cfg = SCENARIOS[r.scenario];
                    return (
                      <div
                        key={r.id}
                        className="p-3.5 rounded-2xl bg-[#1b1d24] border border-[#2d313c] hover:border-[#3d4250] flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                            style={{
                              backgroundColor: `${cfg.primaryColor}15`,
                              borderColor: `${cfg.primaryColor}35`,
                            }}
                          >
                            {r.scenario === 'destructive' && <ShieldAlert className="w-5 h-5 text-[#e88f8f]" />}
                            {r.scenario === 'collaborative' && <Sparkles className="w-5 h-5 text-[#80cda9]" />}
                            {r.scenario === 'last_tile_challenge' && <Target className="w-5 h-5 text-[#dfa95c]" />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#edebe8] flex items-center gap-2">
                              {r.name}
                              <span className="text-[10px] font-mono text-[#a5a39e]">#{r.id}</span>
                            </div>
                            <div className="text-xs text-[#a5a39e] font-mono mt-0.5">
                              Host: {r.host} · {r.players}/{r.max} Players · Mode: {cfg.title}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => onJoinRoom(r.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#272a33] hover:bg-[#363a46] text-[#edebe8] rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                          Join <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* CREATE CUSTOM ROOM */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#cfcdc8] mb-1">
                    Arena Name
                  </label>
                  <input
                    type="text"
                    value={roomNameInput}
                    onChange={(e) => setRoomNameInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#1b1d24] border border-[#2d313c] rounded-xl text-xs text-[#edebe8]"
                  />
                </div>

                {/* Scenario Selection */}
                <div>
                  <label className="block text-xs font-semibold text-[#cfcdc8] mb-2">
                    Select Strategic Scenario Style
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['destructive', 'collaborative', 'last_tile_challenge'] as ScenarioType[]).map(
                      (st) => {
                        const cfg = SCENARIOS[st];
                        const isSelected = selectedScenario === st;
                        return (
                          <div
                            key={st}
                            onClick={() => setSelectedScenario(st)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#272a33] border-[#7d8496] shadow-sm'
                                : 'bg-[#1b1d24] border-[#2d313c] hover:border-[#3d4250]'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className="text-xs font-bold"
                                style={{ color: cfg.primaryColor }}
                              >
                                {cfg.title}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#181a20] text-[#a5a39e] font-mono">
                                {cfg.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#a5a39e] leading-snug line-clamp-2">
                              {cfg.subtitle}
                            </p>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Player count & Color */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#cfcdc8] mb-1.5">
                      Max Commanders
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedMaxPlayers(2)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          selectedMaxPlayers === 2
                            ? 'bg-[#363a46] text-[#edebe8]'
                            : 'bg-[#1b1d24] border border-[#2d313c] text-[#a5a39e]'
                        }`}
                      >
                        2 Players (Duo)
                      </button>
                      <button
                        onClick={() => setSelectedMaxPlayers(4)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          selectedMaxPlayers === 4
                            ? 'bg-[#363a46] text-[#edebe8]'
                            : 'bg-[#1b1d24] border border-[#2d313c] text-[#a5a39e]'
                        }`}
                      >
                        4 Players (Classic)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#cfcdc8] mb-1.5">
                      Your Polyomino Jewel Color
                    </label>
                    <div className="flex gap-2">
                      {(['blue', 'yellow', 'red', 'green'] as PlayerColor[]).map((c) => (
                        <button
                          key={c}
                          onClick={() => setSelectedColor(c)}
                          className={`w-8 h-8 rounded-full border-2 transition-transform cursor-pointer ${
                            selectedColor === c ? 'scale-110 border-white shadow-sm' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: COLOR_CONFIG[c].hex }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    sound.playPlacement();
                    onCreateRoom(roomNameInput, selectedScenario, selectedMaxPlayers, selectedColor);
                  }}
                  className="w-full py-2.5 bg-[#363a46] hover:bg-[#434857] text-[#edebe8] rounded-xl text-xs font-bold shadow-sm transition-colors mt-2 cursor-pointer"
                >
                  Create &amp; Enter Lobby
                </button>
              </div>
            )}

            {/* Back Button */}
            <div className="pt-2 border-t border-[#2d313c] flex justify-start">
              <button
                onClick={onBackToTitle}
                className="text-xs text-[#a5a39e] hover:text-[#edebe8] cursor-pointer"
              >
                ← Back to Title
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

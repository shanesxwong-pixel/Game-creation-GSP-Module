import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ChevronDown, ChevronUp, Bell, Zap } from 'lucide-react';
import { ChatMessage } from '../types/game';
import { COLOR_CONFIG } from '../game/rules';
import { sound } from '../audio/synth';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, isEmote?: boolean) => void;
  localPlayerId: string;
}

const QUICK_CHATS = [
  'Prompted starters active!',
  'Weaving across center!',
  'Watch your diagonal flanks!',
  'Saving my Monomino!',
  'Pushing for 109 max points!',
  'Good move!',
];

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  localPlayerId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(messages.length);

  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      const latest = messages[messages.length - 1];
      if (latest && latest.senderId !== localPlayerId) {
        sound.playChatPing();
        if (!isOpen) {
          setUnreadCount((c) => c + 1);
        }
      }
    }
    prevCountRef.current = messages.length;

    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, localPlayerId]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputVal.trim()) return;
    onSendMessage(inputVal.trim());
    setInputVal('');
  };

  const handleQuickChat = (phrase: string) => {
    onSendMessage(phrase, true);
  };

  return (
    <div className="fixed top-16 right-4 z-30 pointer-events-auto flex flex-col items-end">
      {/* Toggle button */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-2 bg-[#202228]/95 hover:bg-[#282b33] border border-[#3b3f4b] rounded-xl shadow-lg text-[#edebe8] text-xs font-medium transition-all cursor-pointer backdrop-blur-md"
      >
        <div className="relative">
          <MessageSquare className="w-4 h-4 text-[#a5a39e]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#c26262] text-white rounded-full text-[9px] font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
        <span>Comms</span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {/* Popout Panel */}
      {isOpen && (
        <div className="mt-2 w-80 sm:w-96 bg-[#202228]/95 border border-[#3b3f4b] rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[480px] backdrop-blur-md text-[#edebe8]">
          {/* Header */}
          <div className="px-3.5 py-2.5 bg-[#1a1c22]/90 border-b border-[#2d313c] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#edebe8] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#dfa95c]" /> Tactical Comms Channel
            </span>
            <span className="text-[10px] text-[#a5a39e] font-mono">Live Session</span>
          </div>

          {/* Quick Chat Pills */}
          <div className="px-2.5 py-1.5 bg-[#181a20]/70 border-b border-[#2d313c] flex items-center gap-1 overflow-x-auto scrollbar-none">
            {QUICK_CHATS.map((phrase) => (
              <button
                key={phrase}
                onClick={() => handleQuickChat(phrase)}
                className="shrink-0 px-2.5 py-0.5 rounded-full bg-[#272a33] hover:bg-[#343845] hover:text-[#edebe8] text-[10px] text-[#cfcdc8] border border-[#383d4a] transition-colors cursor-pointer"
              >
                {phrase}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-3 overflow-y-auto space-y-2 min-h-[220px] max-h-[300px] text-xs scrollbar-thin scrollbar-thumb-[#363a45]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#878580] text-center py-6">
                <Bell className="w-6 h-6 mb-1 opacity-40" />
                <p>No messages yet. Send a quick signal!</p>
              </div>
            ) : (
              messages.map((m) => {
                if (m.isSystem) {
                  return (
                    <div
                      key={m.id}
                      className="px-2.5 py-1 rounded-lg bg-[#181a20] border border-[#2d313c] text-[11px] text-[#a5a39e] text-center font-mono leading-snug"
                    >
                      {m.text}
                    </div>
                  );
                }

                const isMe = m.senderId === localPlayerId;
                const colorInfo = m.senderColor ? COLOR_CONFIG[m.senderColor] : null;

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {colorInfo && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: colorInfo.hex }}
                        />
                      )}
                      <span className="text-[10px] text-[#a5a39e] font-medium">
                        {isMe ? 'You' : m.senderName}
                      </span>
                      <span className="text-[9px] text-[#706e6a]">
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div
                      className={`px-3 py-1.5 rounded-xl max-w-[85%] break-words leading-relaxed ${
                        isMe
                          ? 'bg-[#3b5d8c] text-[#edebe8] rounded-br-xs'
                          : m.isEmote
                          ? 'bg-[#2d271c] border border-[#59492b] text-[#e8c382] rounded-bl-xs'
                          : 'bg-[#272a33] text-[#edebe8] border border-[#383d4a] rounded-bl-xs'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="p-2 bg-[#181a20] border-t border-[#2d313c] flex gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Send message to lobby..."
              className="flex-1 px-3 py-1.5 bg-[#202228] border border-[#373b47] rounded-lg text-xs text-[#edebe8] placeholder-[#7d7a75] focus:outline-hidden focus:border-[#585e70]"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="px-3 py-1.5 bg-[#373a46] hover:bg-[#454957] disabled:opacity-40 text-[#edebe8] rounded-lg transition-colors flex items-center justify-center cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

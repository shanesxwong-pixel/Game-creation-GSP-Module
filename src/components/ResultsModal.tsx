import React, { useState } from 'react';
import {
  Trophy,
  Award,
  RefreshCw,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  FileText,
  HeartHandshake,
  TrendingDown,
} from 'lucide-react';
import { PlayerScoreReport, ScenarioType } from '../types/game';
import { COLOR_CONFIG } from '../game/rules';
import { SCENARIOS } from '../game/scenarios';

interface ResultsModalProps {
  reports: PlayerScoreReport[];
  scenario: ScenarioType;
  onRematch: () => void;
  onReturnToLobby: () => void;
  roomId?: string;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  reports,
  scenario,
  onRematch,
  onReturnToLobby,
  roomId,
}) => {
  const [activeTab, setActiveTab] = useState<'report_card' | 'theory_notes' | 'percentage'>('report_card');
  const [copiedReport, setCopiedReport] = useState(false);
  const scenarioConfig = SCENARIOS[scenario];

  const winner = reports.find((r) => r.isWinner) || reports[0];
  const winnerColorCfg = winner ? COLOR_CONFIG[winner.color] : null;

  // Generate downloadable/printable text report
  const generateReportCardText = () => {
    let text = `========================================================\n`;
    text += `         BLOKUS NEXUS: ENDGAME REPORT CARD              \n`;
    text += `    Translating Communication Theories into Strategy    \n`;
    text += `========================================================\n`;
    text += `Scenario: ${scenarioConfig.title}\n`;
    text += `Room: ${roomId || 'PUBLIC'}\n`;
    text += `Date: ${new Date().toLocaleString()}\n\n`;

    text += `--- 1. STANDARD LEDGER ---\n`;
    reports.forEach((rep) => {
      text += `* ${rep.playerName} (${rep.color.toUpperCase()}): ${rep.squaresRemainingCount} unplaced squares | Placed: ${rep.placedSquares}/89 squares | Traditional Score: ${rep.traditionalScore} pts\n`;
    });

    text += `\n--- 2. THE DIPLOMACY LOG ---\n`;
    reports.forEach((rep) => {
      text += `* ${rep.playerName} (${rep.color.toUpperCase()}):\n`;
      text += `  - Politeness Tokens Earned: ${rep.politenessTokens} (-${rep.politenessScoreDeduction} penalty squares deducted)\n`;
      text += `  - Mediator's Tokens Earned: ${rep.mediatorTokens} (Mutual-benefit bridges built)\n`;
      text += `  - Completed Negotiations: ${rep.negotiationsCompleted}\n`;
    });

    text += `\n--- 3. PSYCHOLOGICAL MILESTONES (Checklist) ---\n`;
    reports.forEach((rep) => {
      text += `* ${rep.playerName} (${rep.color.toUpperCase()}):\n`;
      text += `  [${rep.milestones.faceSaved ? 'X' : ' '}] "Face Saved" (Accepted diplomatic lifeline & preserved autonomy)\n`;
      text += `  [${rep.milestones.escapedDramaTriangle ? 'X' : ' '}] "Escaped the Drama Triangle" (Built or traversed Mediator's Bridge)\n`;
      text += `  [${rep.milestones.negotiatedAccord ? 'X' : ' '}] "Autonomous 1-Min Accord" (Negotiated tile exchange under 60s)\n`;
    });

    text += `\n--- 4. FINAL ADJUSTED STANDINGS ---\n`;
    reports.forEach((rep, idx) => {
      text += `${idx + 1}. ${rep.playerName} (${rep.color.toUpperCase()}) ${rep.isWinner ? '[TRUE WINNER]' : ''}\n`;
      text += `   Formula: ${rep.formulaExplanation}\n`;
      text += `   Adjusted Penalty Squares Remaining: ${rep.penaltySquaresAdjusted}\n`;
      text += `   Final Adjusted Score: ${rep.finalAdjustedScore} pts\n`;
    });

    text += `\nBehavioral Psychology Summary: Winner achieved highest collaborative and face-saving strategic efficiency.\n`;
    return text;
  };

  const handleDownloadReport = () => {
    const reportText = generateReportCardText();
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Blokus_Negotiation_Report_Card_${roomId || 'PUBLIC'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyReport = () => {
    const reportText = generateReportCardText();
    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#14161a]/90 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto text-[#edebe8]">
      <div className="bg-[#1f2228] border border-[#373b47] rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-250">
        {/* Header Ribbon */}
        <div className="p-6 bg-gradient-to-b from-[#282b35] to-[#1f2228] border-b border-[#373b47] relative">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border border-white/10"
                style={{
                  backgroundColor: winnerColorCfg ? winnerColorCfg.hex : '#4f7bb6',
                }}
              >
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider font-mono text-[#a5a39e] font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#80cda9] inline-block animate-pulse"></span>
                  Official Match Report Card · {scenarioConfig.title}
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-[#edebe8] flex items-center gap-2">
                  {winner?.playerName} Crowned Victor!
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2b2f3a] hover:bg-[#343946] border border-[#3f4555] text-xs font-semibold text-[#edebe8] transition-colors cursor-pointer"
                title="Download printable report card"
              >
                <Download className="w-3.5 h-3.5 text-[#80cda9]" />
                Download Report
              </button>
              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2b2f3a] hover:bg-[#343946] border border-[#3f4555] text-xs font-semibold text-[#edebe8] transition-colors cursor-pointer"
                title="Copy report to clipboard"
              >
                {copiedReport ? <Check className="w-3.5 h-3.5 text-[#80cda9]" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedReport ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#2d313c] bg-[#1a1c22]/80 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('report_card')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'report_card'
                ? 'border-[#80cda9] text-[#80cda9]'
                : 'border-transparent text-[#a5a39e] hover:text-[#edebe8]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Endgame Game Report Card
          </button>
          <button
            onClick={() => setActiveTab('theory_notes')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'theory_notes'
                ? 'border-[#80cda9] text-[#80cda9]'
                : 'border-transparent text-[#a5a39e] hover:text-[#edebe8]'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            Communication Theories Translated
          </button>
          <button
            onClick={() => setActiveTab('percentage')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'percentage'
                ? 'border-[#80cda9] text-[#80cda9]'
                : 'border-transparent text-[#a5a39e] hover:text-[#edebe8]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Spatial Percentages
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto max-h-[500px] space-y-6">
          {activeTab === 'report_card' && (
            <div className="space-y-6">
              {/* Section 1: Standard Ledger */}
              <div className="bg-[#181a20] border border-[#2f333e] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3 border-b border-[#2a2d36] pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#a5a39e] font-mono flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#4d7cbb]"></span>
                    1. Standard Ledger (Basic Blokus Unplaced Squares)
                  </h3>
                  <span className="text-[11px] text-[#787c88]">89 Total Initial Squares</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {reports.map((rep) => {
                    const colorCfg = COLOR_CONFIG[rep.color];
                    return (
                      <div
                        key={rep.playerId}
                        className="p-3 rounded-xl bg-[#20232b] border border-[#2d313c] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: colorCfg.hex }}
                          ></span>
                          <div>
                            <div className="text-xs font-bold text-[#edebe8]">{rep.playerName}</div>
                            <div className="text-[10px] text-[#9a9eab]">
                              Placed {rep.placedSquares}/89 squares ({rep.piecesRemainingCount} pieces left)
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-black font-mono text-[#d27d7d]">
                            {rep.squaresRemainingCount} unplaced
                          </div>
                          <div className="text-[10px] text-[#787c88] font-mono">
                            Score: {rep.traditionalScore}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: The Diplomacy Log */}
              <div className="bg-[#181a20] border border-[#2f333e] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3 border-b border-[#2a2d36] pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#a5a39e] font-mono flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#80cda9]"></span>
                    2. The Diplomacy Log (Politeness &amp; Mediator Tokens)
                  </h3>
                  <span className="text-[11px] text-[#80cda9]">-3 squares per Politeness Token</span>
                </div>

                <div className="space-y-2.5">
                  {reports.map((rep) => {
                    const colorCfg = COLOR_CONFIG[rep.color];
                    return (
                      <div
                        key={rep.playerId}
                        className="p-3 rounded-xl bg-[#20232b] border border-[#2d313c] flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: colorCfg.hex }}
                          ></span>
                          <span className="text-xs font-bold text-[#edebe8]">{rep.playerName}</span>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono">
                          <div className="flex items-center gap-1.5 bg-[#171920] px-2.5 py-1 rounded-lg border border-[#2c303c]">
                            <span className="text-[#a5a39e]">Politeness Tokens:</span>
                            <span className="font-bold text-[#80cda9]">
                              {rep.politenessTokens} (-{rep.politenessScoreDeduction} penalty sq)
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 bg-[#171920] px-2.5 py-1 rounded-lg border border-[#2c303c]">
                            <span className="text-[#a5a39e]">Mediator's Tokens:</span>
                            <span className="font-bold text-[#d2983b]">
                              {rep.mediatorTokens} (Bridges built)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Psychological Milestones */}
              <div className="bg-[#181a20] border border-[#2f333e] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3 border-b border-[#2a2d36] pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#a5a39e] font-mono flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#d2983b]"></span>
                    3. Psychological Milestones (Checklist Achievements)
                  </h3>
                  <span className="text-[11px] text-[#787c88]">Communication Theory Validation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {reports.map((rep) => {
                    const colorCfg = COLOR_CONFIG[rep.color];
                    return (
                      <div
                        key={rep.playerId}
                        className="p-3.5 rounded-xl bg-[#20232b] border border-[#2d313c] space-y-2"
                      >
                        <div className="flex items-center gap-2 pb-1.5 border-b border-[#2a2d36]">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: colorCfg.hex }}
                          ></span>
                          <span className="text-xs font-bold text-[#edebe8]">{rep.playerName}</span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          {/* Face Saved */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-4 h-4 rounded border flex items-center justify-center font-bold text-[10px] ${
                                rep.milestones.faceSaved
                                  ? 'bg-[#254636] border-[#448b67] text-[#80cda9]'
                                  : 'bg-[#181a20] border-[#363a46] text-[#555a68]'
                              }`}
                            >
                              {rep.milestones.faceSaved ? '✓' : ''}
                            </span>
                            <span
                              className={
                                rep.milestones.faceSaved ? 'text-[#edebe8] font-medium' : 'text-[#747885]'
                              }
                            >
                              "Face Saved" (Accepted lifeline &amp; preserved dignity)
                            </span>
                          </div>

                          {/* Escaped Drama Triangle */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-4 h-4 rounded border flex items-center justify-center font-bold text-[10px] ${
                                rep.milestones.escapedDramaTriangle
                                  ? 'bg-[#254636] border-[#448b67] text-[#80cda9]'
                                  : 'bg-[#181a20] border-[#363a46] text-[#555a68]'
                              }`}
                            >
                              {rep.milestones.escapedDramaTriangle ? '✓' : ''}
                            </span>
                            <span
                              className={
                                rep.milestones.escapedDramaTriangle
                                  ? 'text-[#edebe8] font-medium'
                                  : 'text-[#747885]'
                              }
                            >
                              "Escaped the Drama Triangle" (Built/used Mediator's Bridge)
                            </span>
                          </div>

                          {/* 1-Min Accord */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-4 h-4 rounded border flex items-center justify-center font-bold text-[10px] ${
                                rep.milestones.negotiatedAccord
                                  ? 'bg-[#254636] border-[#448b67] text-[#80cda9]'
                                  : 'bg-[#181a20] border-[#363a46] text-[#555a68]'
                              }`}
                            >
                              {rep.milestones.negotiatedAccord ? '✓' : ''}
                            </span>
                            <span
                              className={
                                rep.milestones.negotiatedAccord
                                  ? 'text-[#edebe8] font-medium'
                                  : 'text-[#747885]'
                              }
                            >
                              "Autonomous Negotiation" (Exchanged tile under 60s)
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: Final Adjusted Standings */}
              <div className="bg-[#181a20] border border-[#2f333e] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3 border-b border-[#2a2d36] pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#a5a39e] font-mono flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#80cda9]"></span>
                    4. Final Adjusted Standings (Formula Deductions Applied)
                  </h3>
                  <span className="text-[11px] text-[#80cda9] font-mono">
                    Adjusted Score = Base + (Politeness × 3) + (Mediator × 4)
                  </span>
                </div>

                <div className="space-y-3">
                  {reports.map((rep, idx) => {
                    const colorCfg = COLOR_CONFIG[rep.color];
                    return (
                      <div
                        key={rep.playerId}
                        className={`p-4 rounded-xl border transition-all ${
                          rep.isWinner
                            ? 'bg-[#232a2f] border-[#406857] shadow-lg ring-1 ring-[#406857]/50'
                            : 'bg-[#20232b] border-[#2d313c]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-[#181a20] text-[#a5a39e] font-mono text-xs flex items-center justify-center font-bold">
                              #{idx + 1}
                            </span>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3.5 h-3.5 rounded-full"
                                style={{ backgroundColor: colorCfg.hex }}
                              ></span>
                              <span className="text-sm font-bold text-[#edebe8] flex items-center gap-2">
                                {rep.playerName}
                                {rep.isWinner && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#204032] text-[#80cda9] text-[10px] font-bold border border-[#37694f]">
                                    TRUE WINNER
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-black font-mono text-[#80cda9]">
                              {rep.finalAdjustedScore} pts
                            </div>
                            <div className="text-[10px] text-[#9a9eab] font-mono">
                              Adj Penalty Sq: {rep.penaltySquaresAdjusted}
                            </div>
                          </div>
                        </div>

                        <div className="p-2 rounded-lg bg-[#181a20] border border-[#2b2f3a] text-xs font-mono text-[#9da2b0] flex items-center justify-between">
                          <span>Applied Calculation:</span>
                          <span className="text-[#edebe8] font-semibold">{rep.formulaExplanation}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'theory_notes' && (
            <div className="space-y-4 text-xs leading-relaxed text-[#c6c8ce]">
              <div className="p-4 rounded-2xl bg-[#181a20] border border-[#2f333e]">
                <h4 className="text-sm font-bold text-[#80cda9] mb-1.5 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#80cda9]" />
                  Strategy 1: The Face-Saving Lifeline (Face-Negotiation Theory)
                </h4>
                <p className="text-[#a5a39e] mb-2">
                  Based on Stella Ting-Toomey’s Face-Negotiation Theory. In standard territorial games, players often devolve into a toxic "Blocker" mentality, trapping adversaries and causing social humiliation. By deploying the Face-Saving Lifeline, Player A grants the opponent autonomy (negative face) and dignity (positive face) by leaving an open corner. When Player B accepts, Player A is rewarded with a Politeness Token (-3 penalty deduction).
                </p>
                <div className="p-2.5 rounded-xl bg-[#20232b] border border-[#2d313c] text-[11px] font-mono text-[#d2983b]">
                  "True power lies not in annihilating your adversary, but in granting them the dignity to retreat."
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#181a20] border border-[#2f333e]">
                <h4 className="text-sm font-bold text-[#4d7cbb] mb-1.5 flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-[#4d7cbb]" />
                  Strategy 2: The Mediator’s Bridge (Karpman’s to Choy’s Winner’s Triangle)
                </h4>
                <p className="text-[#a5a39e] mb-2">
                  Transcends Karpman’s Drama Triangle (Persecutor/Victim/Rescuer), where blocking feels punitive and rescue feels patronizing. Acey Choy’s Winner's Triangle reframes interaction into Assertive, Vulnerable, and Caring partnership. When Player A builds a physical pathway out of a dead-end, both players benefit: Opponent escapes, while Player A receives a Mediator’s Token and an immediate bonus tile placement!
                </p>
                <div className="p-2.5 rounded-xl bg-[#20232b] border border-[#2d313c] text-[11px] font-mono text-[#4d7cbb]">
                  "Transforming zero-sum deadlocks into mutual growth through deliberate structural bridges."
                </div>
              </div>
            </div>
          )}

          {activeTab === 'percentage' && (
            <div className="space-y-3">
              {reports.map((rep) => {
                const colorCfg = COLOR_CONFIG[rep.color];
                return (
                  <div key={rep.playerId} className="p-3.5 rounded-xl bg-[#181a20] border border-[#2f333e]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colorCfg.hex }}></span>
                        <span className="text-xs font-bold text-[#edebe8]">{rep.playerName}</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#80cda9]">{rep.percentageCompleted}% completed</span>
                    </div>
                    <div className="w-full h-2 bg-[#262933] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${rep.percentageCompleted}%`,
                          backgroundColor: colorCfg.hex,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-[#787c88] mt-1.5 font-mono">
                      <span>{rep.placedSquares} / 89 squares</span>
                      <span>Board Share: {rep.boardSharePercentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#181a20] border-t border-[#373b47] flex items-center justify-between">
          <button
            onClick={onReturnToLobby}
            className="px-4 py-2 rounded-xl bg-[#262a34] hover:bg-[#303542] text-xs font-semibold text-[#edebe8] transition-colors cursor-pointer border border-[#3b404f]"
          >
            Reset Arena
          </button>
          <button
            onClick={onRematch}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3f6553] hover:bg-[#48735e] text-xs font-bold text-white transition-all shadow-md cursor-pointer border border-[#52816b]"
          >
            <RefreshCw className="w-4 h-4" />
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

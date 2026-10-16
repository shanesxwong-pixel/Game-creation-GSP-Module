import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ThreeBoard } from './components/ThreeBoard';
import { PublicRoomHeader } from './components/PublicRoomHeader';
import { PowerCardsHUD } from './components/PowerCardsHUD';
import { NegotiationModal } from './components/NegotiationModal';
import { NegotiationInitiatorModal } from './components/NegotiationInitiatorModal';
import { LifelineOfferBanner } from './components/LifelineOfferBanner';
import { PieceTray } from './components/PieceTray';
import { ChatBox } from './components/ChatBox';
import { ScenarioHUD } from './components/ScenarioHUD';
import { StageProgressBar } from './components/StageProgressBar';
import { StageGuideModal } from './components/StageGuideModal';
import { PhaseTransitionOverlay } from './components/PhaseTransitionOverlay';
import { ResultsModal } from './components/ResultsModal';
import { ALL_PIECES, flipMatrixHorizontal, rotateMatrixClockwise } from './game/pieces';
import { createEmptyBoard, validatePlacement, getGameplayStageInfo } from './game/rules';
import { computeGameScores } from './game/scoring';
import { analyzeMoveStyle } from './game/scenarios';
import { multiplayer, NetworkEvent } from './network/multiplayer';
import { sound } from './audio/synth';
import {
  ActiveNegotiation,
  ChatMessage,
  PieceDef,
  PlacedPiece,
  PlayerColor,
  PlayerScoreReport,
  RoomState,
  ScenarioType,
} from './types/game';

export default function App() {
  const [room, setRoom] = useState<RoomState>(() => multiplayer.currentRoom || multiplayer.initPublicRoom());
  const [activeControlColor, setActiveControlColor] = useState<PlayerColor>('blue');
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<PlacedPiece[]>(() => room.history || []);

  // Selected piece for placement
  const [selectedPieceId, setSelectedPieceId] = useState<string | null>('I1');
  const [selectedMatrix, setSelectedMatrix] = useState<number[][] | null>([[1]]);

  // Sound mute state
  const [isMuted, setIsMuted] = useState(sound.isMuted);

  // Transition overlay state
  const [transitionTriggerKey, setTransitionTriggerKey] = useState<number>(0);
  const [activeScenario, setActiveScenario] = useState<ScenarioType>(room.scenario);

  // Modals state
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isNegotiationInitiatorOpen, setIsNegotiationInitiatorOpen] = useState(false);

  // Subscribe to multiplayer network events
  useEffect(() => {
    const unsubscribe = multiplayer.subscribe((event: NetworkEvent) => {
      if (event.type === 'connected') {
        setIsWsConnected(event.isWsConnected);
      } else if (event.type === 'room_state_update') {
        setRoom({ ...event.state });
        if (event.state.scenario !== activeScenario) {
          setActiveScenario(event.state.scenario);
          setTransitionTriggerKey(Date.now());
        }
        if (event.state.history) {
          setHistory([...event.state.history]);
        }
      } else if (event.type === 'chat_message') {
        setChatMessages((prev) => [...prev, event.message]);
      } else if (event.type === 'move_placed') {
        setHistory((prev) => {
          if (prev.some((m) => m.id === event.move.id)) return prev;
          return [...prev, event.move];
        });
        sound.playPlacement();
      } else if (event.type === 'player_passed') {
        setRoom((prev) => ({ ...prev, turnIndex: event.nextTurnIndex }));
      } else if (event.type === 'game_over') {
        setRoom({ ...event.state });
        sound.playVictoryFanfare();
      } else if (event.type === 'negotiation_update') {
        setRoom((prev) => ({ ...prev, activeNegotiation: event.negotiation }));
      } else if (event.type === 'lifeline_update') {
        setRoom((prev) => ({ ...prev, activeLifelineOffer: event.offer }));
      }
    });

    return () => unsubscribe();
  }, [activeScenario]);

  // Reconstruct board grid from move history
  const currentBoard = useMemo(() => {
    let b = createEmptyBoard();
    for (const move of history) {
      for (let r = 0; r < move.matrix.length; r++) {
        for (let c = 0; c < move.matrix[0].length; c++) {
          if (move.matrix[r][c] === 1) {
            b[move.row + r][move.col + c] = move.color;
          }
        }
      }
    }
    return b;
  }, [history]);

  // Current active player and active control player
  const activePlayer = room.players[room.turnIndex];
  // In classroom / hotseat demonstration mode, any human seat can play on their turn!
  const isMyTurn = Boolean(activePlayer && (!activePlayer.isBot || activePlayer.color === activeControlColor));
  const currentColor: PlayerColor = activePlayer ? activePlayer.color : activeControlColor;

  // Available pieces for current playing player
  const currentPlayedPieceIds = useMemo(() => {
    return history.filter((m) => m.color === currentColor).map((m) => m.pieceId);
  }, [history, currentColor]);

  const currentAvailablePieceIds = useMemo(() => {
    return ALL_PIECES.map((p) => p.id).filter((id) => !currentPlayedPieceIds.includes(id));
  }, [currentPlayedPieceIds]);

  // Squares placed so far by current color
  const playerSquaresPlaced = useMemo(() => {
    let count = 0;
    for (let r = 0; r < 20; r++) {
      for (let c = 0; c < 20; c++) {
        if (currentBoard[r][c] === currentColor) count++;
      }
    }
    return count;
  }, [currentBoard, currentColor]);

  // Gameplay Stage computation
  const stageInfo = useMemo(() => {
    return getGameplayStageInfo(history.length);
  }, [history.length]);

  // Strategic telemetry metrics
  const styleMetrics = useMemo(() => {
    if (history.length === 0) {
      return {
        destructiveScore: 20,
        collaborativeScore: 65,
        challengeScore: 15,
        dominantStyle: activeScenario,
      };
    }

    let dSum = 0;
    let cSum = 0;
    let chSum = 0;

    for (const m of history) {
      const a = analyzeMoveStyle(currentBoard, m.matrix, m.row, m.col, m.color, 15);
      dSum += a.destructiveScore;
      cSum += a.collaborativeScore;
      chSum += a.challengeScore;
    }

    const count = Math.max(1, history.length);
    const avgD = Math.min(100, Math.round(dSum / count));
    const avgC = Math.min(100, Math.round(cSum / count));
    const avgCh = Math.min(100, Math.round(chSum / count));

    let dom: ScenarioType = 'mediator_bridge';
    if (avgD >= avgC && avgD >= avgCh) dom = 'competitive';
    else if (avgCh >= avgC && avgCh > avgD) dom = 'face_saving';

    return {
      destructiveScore: avgD,
      collaborativeScore: avgC,
      challengeScore: avgCh,
      dominantStyle: dom,
    };
  }, [history, currentBoard, activeScenario]);

  // Automatically update active selected piece if previous was played
  useEffect(() => {
    if (selectedPieceId && currentPlayedPieceIds.includes(selectedPieceId)) {
      const nextPiece = ALL_PIECES.find((p) => currentAvailablePieceIds.includes(p.id));
      if (nextPiece) {
        setSelectedPieceId(nextPiece.id);
        setSelectedMatrix(nextPiece.matrix);
      } else {
        setSelectedPieceId(null);
        setSelectedMatrix(null);
      }
    }
  }, [currentPlayedPieceIds, selectedPieceId, currentAvailablePieceIds]);

  // Handle piece selection
  const handleSelectPiece = (piece: PieceDef) => {
    sound.playTilePickup();
    setSelectedPieceId(piece.id);
    setSelectedMatrix(piece.matrix);
  };

  // Rotate piece
  const handleRotatePiece = useCallback(() => {
    if (!selectedMatrix) return;
    sound.playRotate();
    setSelectedMatrix(rotateMatrixClockwise(selectedMatrix));
  }, [selectedMatrix]);

  // Flip piece
  const handleFlipPiece = useCallback(() => {
    if (!selectedMatrix) return;
    sound.playRotate();
    setSelectedMatrix(flipMatrixHorizontal(selectedMatrix));
  }, [selectedMatrix]);

  // Pass turn
  const handlePassTurn = () => {
    if (!activePlayer || !isMyTurn) return;
    sound.playTilePickup();
    multiplayer.passTurn(activePlayer.id);
  };

  // Cell Click / Placement Handler
  const handleCellClick = (row: number, col: number) => {
    if (!isMyTurn || !selectedPieceId || !selectedMatrix || !activePlayer) return;

    // Check if player has an obligated corner from accepting a Face-Saving Lifeline
    if (activePlayer.obligatedCorner) {
      const obl = activePlayer.obligatedCorner;
      // Check if selectedMatrix covers or touches the obligated corner
      let coversObligated = false;
      for (let r = 0; r < selectedMatrix.length; r++) {
        for (let c = 0; c < selectedMatrix[0].length; c++) {
          if (selectedMatrix[r][c] === 1 && row + r === obl.row && col + c === obl.col) {
            coversObligated = true;
          }
        }
      }
      if (!coversObligated) {
        sound.playInvalid();
        multiplayer.sendSystemChat(
          `Face-Saving Accord: You accepted a lifeline and must place your next piece into corner (${obl.row}, ${obl.col})!`
        );
        return;
      }
    }

    const validation = validatePlacement(
      currentBoard,
      selectedMatrix,
      row,
      col,
      activePlayer.color
    );

    if (!validation.valid) {
      sound.playInvalid();
      multiplayer.sendSystemChat(`Invalid placement: ${validation.reason || 'rules violated'}`);
      return;
    }

    // Place move
    multiplayer.placeMove(
      selectedPieceId,
      selectedMatrix,
      row,
      col,
      activePlayer.color
    );
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'r' || e.key === 'R') {
        handleRotatePiece();
      } else if (e.key === 'f' || e.key === 'F') {
        handleFlipPiece();
      } else if (e.key === 'm' || e.key === 'M') {
        const muted = sound.toggleMute();
        setIsMuted(muted);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRotatePiece, handleFlipPiece]);

  // Scenario selection handler
  const handleScenarioChange = (st: ScenarioType) => {
    setActiveScenario(st);
    setTransitionTriggerKey(Date.now());
    multiplayer.setScenario(st);
  };

  // Seat claiming / Switching
  const handleClaimSeat = (color: PlayerColor) => {
    setActiveControlColor(color);
    multiplayer.claimSeat(color);
    sound.playTilePickup();
  };

  // Toggle Bot / Human
  const handleToggleBot = (color: PlayerColor) => {
    multiplayer.toggleSeatController(color);
    sound.playTilePickup();
  };

  // Reset Match
  const handleResetMatch = () => {
    multiplayer.resetMatch(activeScenario, true);
    setHistory([...(multiplayer.currentRoom?.history || [])]);
    setTransitionTriggerKey(Date.now());
  };

  // Power Card 1: Play Face-Saving Lifeline
  const handlePlayFaceSavingLifeline = () => {
    if (!activePlayer) return;
    const opponents = room.players.filter((p) => p.color !== activePlayer.color);
    const target = opponents[0];
    if (!target) return;

    // Designate escape route corner
    const escapeCorner = { row: 9, col: 9 };
    multiplayer.offerFaceSavingLifeline(target.id, escapeCorner);
  };

  // Power Card 2: Play Mediator's Bridge
  const handlePlayMediatorBridge = () => {
    if (!activePlayer || !selectedPieceId || !selectedMatrix) return;
    // Activate bridge bonus action
    multiplayer.executeMediatorBridge(selectedPieceId, selectedMatrix, 10, 10, activePlayer.color);
  };

  // Negotiation Launch
  const handleLaunchNegotiation = (targetId: string, offeredPieceId: string, requestedPieceId: string) => {
    multiplayer.initiateNegotiation(targetId, offeredPieceId, requestedPieceId);
  };

  // Score reports for Endgame Report Card
  const scoreReports: PlayerScoreReport[] = useMemo(() => {
    return computeGameScores(room.players, currentBoard, history);
  }, [room.players, currentBoard, history]);

  const isGameOver = room.status === 'ended';

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#181a20] font-sans relative text-[#edebe8] flex flex-col">
      {/* Unified Public Room Top Header Bar */}
      <PublicRoomHeader
        room={room}
        activePlayer={activePlayer}
        activeControlColor={activeControlColor}
        onChangeScenario={handleScenarioChange}
        onClaimSeat={handleClaimSeat}
        onToggleBot={handleToggleBot}
        onResetMatch={handleResetMatch}
      />

      {/* Main Interactive 3D Canvas Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* 3D Board Viewport */}
        <div className="absolute inset-0 z-0">
          <ThreeBoard
            board={currentBoard}
            selectedPieceMatrix={selectedMatrix}
            selectedColor={currentColor}
            scenario={activeScenario}
            history={history}
            onCellClick={handleCellClick}
            isInteractive={isMyTurn && !isGameOver}
          />
        </div>

        {/* Dynamic Phase Shift Transition Overlay */}
        <PhaseTransitionOverlay
          currentScenario={activeScenario}
          triggerKey={transitionTriggerKey}
        />

        {/* Active Face-Saving Lifeline Offer Banner */}
        {room.activeLifelineOffer && (
          <LifelineOfferBanner
            offer={room.activeLifelineOffer}
            room={room}
            onAccept={() => multiplayer.respondToLifeline(true)}
            onDecline={() => multiplayer.respondToLifeline(false)}
          />
        )}

        {/* 1-Minute Negotiation Countdown Modal */}
        {room.activeNegotiation && (
          <NegotiationModal
            negotiation={room.activeNegotiation}
            room={room}
            localPlayerColor={activeControlColor}
            onAccept={() => multiplayer.acceptNegotiation()}
            onDecline={() => multiplayer.declineNegotiation()}
            onTimeout={() => multiplayer.timeoutNegotiation()}
          />
        )}

        {/* Negotiation Setup Modal */}
        <NegotiationInitiatorModal
          isOpen={isNegotiationInitiatorOpen}
          onClose={() => setIsNegotiationInitiatorOpen(false)}
          room={room}
          activePlayerColor={currentColor}
          onInitiate={handleLaunchNegotiation}
        />

        {/* Top Progress & Points Header */}
        <div className="absolute top-2 left-4 right-4 z-10 pointer-events-none">
          <div className="pointer-events-auto max-w-2xl mx-auto">
            <StageProgressBar
              currentStage={stageInfo.stageNumber}
              stageName={stageInfo.name}
              stageTagline={stageInfo.tagline}
              totalMovesCount={history.length}
              playerSquaresPlaced={playerSquaresPlaced}
              localPlayerColor={currentColor}
              onOpenGuide={() => setIsGuideModalOpen(true)}
              roomId={room.roomId}
              scenario={activeScenario}
            />
          </div>
        </div>

        {/* Left Tactical HUD */}
        <ScenarioHUD
          scenario={activeScenario}
          activePlayer={activePlayer}
          localPlayer={room.players.find((p) => p.color === activeControlColor)}
          turnNumber={history.length + 1}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(sound.toggleMute())}
          styleMetrics={styleMetrics}
          onSelectScenario={handleScenarioChange}
        />

        {/* Right Live Comms Chat */}
        <ChatBox
          messages={chatMessages}
          onSendMessage={(txt, isEmote) => multiplayer.sendChatMessage(txt, isEmote)}
          localPlayerId={multiplayer.localPlayerId}
        />

        {/* Floating Power Cards Console (Top of Piece Tray) */}
        <div className="absolute bottom-28 left-4 z-10">
          <PowerCardsHUD
            scenario={activeScenario}
            activePlayer={activePlayer}
            localPlayer={room.players.find((p) => p.color === activeControlColor)}
            isMyTurn={isMyTurn}
            onOpenNegotiationModal={() => setIsNegotiationInitiatorOpen(true)}
            onPlayFaceSavingLifeline={handlePlayFaceSavingLifeline}
            onPlayMediatorBridge={handlePlayMediatorBridge}
          />
        </div>

        {/* Bottom Collapsible Piece Tray */}
        <PieceTray
          playerColor={currentColor}
          availablePieceIds={currentAvailablePieceIds}
          selectedPieceId={selectedPieceId}
          selectedMatrix={selectedMatrix}
          onSelectPiece={handleSelectPiece}
          onRotatePiece={handleRotatePiece}
          onFlipPiece={handleFlipPiece}
          onPassTurn={handlePassTurn}
          isMyTurn={isMyTurn}
          scenario={activeScenario}
        />

        {/* Gameplay Stages & Max Points Modal Guide */}
        <StageGuideModal
          isOpen={isGuideModalOpen}
          onClose={() => setIsGuideModalOpen(false)}
          scenario={activeScenario}
          players={room.players}
          currentBoard={currentBoard}
          history={history}
          localPlayerColor={currentColor}
        />

        {/* Official Endgame Game Report Card Modal */}
        {isGameOver && (
          <ResultsModal
            reports={scoreReports}
            scenario={activeScenario}
            onRematch={handleResetMatch}
            onReturnToLobby={handleResetMatch}
            roomId={room.roomId}
          />
        )}
      </div>
    </div>
  );
}

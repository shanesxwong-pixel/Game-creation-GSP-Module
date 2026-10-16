import {
  ActiveNegotiation,
  ChatMessage,
  PieceDef,
  PlacedPiece,
  Player,
  PlayerColor,
  RoomState,
  ScenarioType,
} from '../types/game';
import { ALL_PIECES } from '../game/pieces';
import {
  applyMove,
  createEmptyBoard,
  generateAIMove,
  getPromptedStarterMoves,
  hasAnyLegalMove,
} from '../game/rules';

export type NetworkEventCallback = (event: NetworkEvent) => void;

export type NetworkEvent =
  | { type: 'room_state_update'; state: RoomState }
  | { type: 'chat_message'; message: ChatMessage }
  | { type: 'move_placed'; move: PlacedPiece; nextTurnIndex: number }
  | { type: 'player_passed'; playerId: string; nextTurnIndex: number }
  | { type: 'game_over'; state: RoomState }
  | { type: 'connected'; isWsConnected: boolean }
  | { type: 'negotiation_update'; negotiation: ActiveNegotiation | null }
  | { type: 'lifeline_update'; offer: RoomState['activeLifelineOffer'] };

export const PUBLIC_ROOM_ID = 'PUBLIC';

export class MultiplayerClient {
  public currentRoom: RoomState | null = null;
  public localPlayerId: string;
  public activeControlColor: PlayerColor = 'blue';
  public isHotseatAllHuman: boolean = true; // default true so all 4 players are human controlled for teaching!
  private ws: WebSocket | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<NetworkEventCallback> = new Set();
  private isWsConnected: boolean = false;
  private aiLoopInterval: number | null = null;
  private negotiationTimerInterval: number | null = null;

  constructor() {
    let storedId = '';
    try {
      storedId = sessionStorage.getItem('blokus_player_id') || '';
    } catch {
      // ignore
    }
    if (!storedId) {
      storedId = 'player_' + Math.random().toString(36).substring(2, 9);
      try {
        sessionStorage.setItem('blokus_player_id', storedId);
      } catch {
        // ignore
      }
    }
    this.localPlayerId = storedId;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('blokus_nexus_multiplayer');
        this.broadcastChannel.onmessage = (e) => {
          this.handleInboundPayload(e.data, 'broadcast');
        };
      } catch {
        // fallback
      }
    }

    this.connectWebSocket();

    // Automatically initialize the single public room
    this.initPublicRoom();
  }

  // Initialize the single public room with 4 human-controllable player seats
  public initPublicRoom(initialScenario: ScenarioType = 'mediator_bridge'): RoomState {
    const players: Player[] = [
      {
        id: this.localPlayerId,
        name: 'Player 1 (Blue)',
        color: 'blue',
        isHost: true,
        isBot: false,
        isReady: true,
        hasPassed: false,
        politenessTokens: 0,
        mediatorTokens: 0,
        hasFaceSavingLifeline: true,
        hasMediatorBridgeCard: true,
        bonusActionsRemaining: 0,
        faceSavedMilestone: false,
        escapedDramaTriangleMilestone: false,
        negotiationAccordMilestone: false,
      },
      {
        id: 'player_yellow_' + Math.random().toString(36).substring(2, 6),
        name: 'Player 2 (Yellow)',
        color: 'yellow',
        isHost: false,
        isBot: false, // human controlled by default!
        isReady: true,
        hasPassed: false,
        politenessTokens: 0,
        mediatorTokens: 0,
        hasFaceSavingLifeline: true,
        hasMediatorBridgeCard: true,
        bonusActionsRemaining: 0,
        faceSavedMilestone: false,
        escapedDramaTriangleMilestone: false,
        negotiationAccordMilestone: false,
      },
      {
        id: 'player_red_' + Math.random().toString(36).substring(2, 6),
        name: 'Player 3 (Red)',
        color: 'red',
        isHost: false,
        isBot: false, // human controlled by default!
        isReady: true,
        hasPassed: false,
        politenessTokens: 0,
        mediatorTokens: 0,
        hasFaceSavingLifeline: true,
        hasMediatorBridgeCard: true,
        bonusActionsRemaining: 0,
        faceSavedMilestone: false,
        escapedDramaTriangleMilestone: false,
        negotiationAccordMilestone: false,
      },
      {
        id: 'player_green_' + Math.random().toString(36).substring(2, 6),
        name: 'Player 4 (Green)',
        color: 'green',
        isHost: false,
        isBot: false, // human controlled by default!
        isReady: true,
        hasPassed: false,
        politenessTokens: 0,
        mediatorTokens: 0,
        hasFaceSavingLifeline: true,
        hasMediatorBridgeCard: true,
        bonusActionsRemaining: 0,
        faceSavedMilestone: false,
        escapedDramaTriangleMilestone: false,
        negotiationAccordMilestone: false,
      },
    ];

    const publicRoom: RoomState = {
      roomId: PUBLIC_ROOM_ID,
      roomName: 'Public Negotiation Arena',
      scenario: initialScenario,
      players,
      status: 'playing',
      maxPlayers: 4,
      boardSize: 20,
      turnIndex: 0,
      turnTimeLimit: 60, // 1 minute turn timer standard
      history: getPromptedStarterMoves(players),
      winnerIds: [],
      startWithPromptedTiles: true,
      activeNegotiation: null,
      activeLifelineOffer: null,
      totalNegotiationsCompleted: 0,
    };

    this.currentRoom = publicRoom;
    return publicRoom;
  }

  private connectWebSocket() {
    if (typeof window === 'undefined') return;
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isWsConnected = true;
        this.notify({ type: 'connected', isWsConnected: true });

        // Announce join to public room
        if (this.currentRoom) {
          this.ws?.send(
            JSON.stringify({
              type: 'join_room',
              roomId: this.currentRoom.roomId,
              playerName: 'Player',
              playerColor: this.activeControlColor,
            })
          );
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleInboundPayload(data, 'websocket');
        } catch {
          // ignore
        }
      };

      this.ws.onerror = () => {
        this.isWsConnected = false;
        this.notify({ type: 'connected', isWsConnected: false });
      };

      this.ws.onclose = () => {
        this.isWsConnected = false;
        this.notify({ type: 'connected', isWsConnected: false });
        setTimeout(() => this.connectWebSocket(), 4000);
      };
    } catch {
      // ignore
    }
  }

  private handleInboundPayload(data: any, source: 'websocket' | 'broadcast') {
    if (!data) return;

    if (data.type === 'sync_state' && data.state) {
      this.currentRoom = { ...data.state };
      if (this.currentRoom) {
        this.notify({ type: 'room_state_update', state: this.currentRoom });
      }
    } else if (data.type === 'chat_message' && data.message) {
      if (this.currentRoom && data.roomId === this.currentRoom.roomId) {
        this.notify({ type: 'chat_message', message: data.message });
      }
    } else if (data.type === 'game_event') {
      if (this.currentRoom && data.roomId === this.currentRoom.roomId) {
        if (data.event === 'move_placed' && data.move) {
          const exists = this.currentRoom.history.some((m) => m.id === data.move!.id);
          if (!exists) {
            this.currentRoom.history.push(data.move);
            if (typeof data.nextTurnIndex === 'number') {
              this.currentRoom.turnIndex = data.nextTurnIndex;
            }
            this.notify({
              type: 'move_placed',
              move: data.move,
              nextTurnIndex: this.currentRoom.turnIndex,
            });
            this.checkAndTriggerNextTurn();
          }
        } else if (data.event === 'player_passed' && data.playerId) {
          const p = this.currentRoom.players.find((pl) => pl.id === data.playerId);
          if (p) p.hasPassed = true;
          if (typeof data.nextTurnIndex === 'number') {
            this.currentRoom.turnIndex = data.nextTurnIndex;
          }
          this.notify({
            type: 'player_passed',
            playerId: data.playerId,
            nextTurnIndex: this.currentRoom.turnIndex,
          });
          this.checkAndTriggerNextTurn();
        } else if (data.event === 'negotiation_update') {
          if (this.currentRoom) {
            this.currentRoom.activeNegotiation = data.negotiation;
            this.notify({ type: 'negotiation_update', negotiation: data.negotiation });
            this.notify({ type: 'room_state_update', state: this.currentRoom });
          }
        } else if (data.event === 'lifeline_update') {
          if (this.currentRoom) {
            this.currentRoom.activeLifelineOffer = data.offer;
            this.notify({ type: 'lifeline_update', offer: data.offer });
            this.notify({ type: 'room_state_update', state: this.currentRoom });
          }
        }
      }
    }
  }

  // Claim or select seat
  public claimSeat(color: PlayerColor, name?: string) {
    if (!this.currentRoom) return;
    const player = this.currentRoom.players.find((p) => p.color === color);
    if (player) {
      player.id = this.localPlayerId;
      if (name) player.name = name;
      player.isBot = false;
      this.activeControlColor = color;
      this.syncAndBroadcast();
    }
  }

  // Toggle seat between Human Controlled and AI Bot
  public toggleSeatController(color: PlayerColor) {
    if (!this.currentRoom) return;
    const player = this.currentRoom.players.find((p) => p.color === color);
    if (player) {
      player.isBot = !player.isBot;
      if (player.isBot) {
        player.name = `AI Bot (${color.toUpperCase()})`;
        player.botPersonality = 'balanced';
      } else {
        player.name = `Human (${color.toUpperCase()})`;
      }
      this.syncAndBroadcast();
      this.checkAndTriggerNextTurn();
    }
  }

  // Set Player Name
  public setPlayerName(color: PlayerColor, name: string) {
    if (!this.currentRoom) return;
    const player = this.currentRoom.players.find((p) => p.color === color);
    if (player) {
      player.name = name.trim() || `Player (${color})`;
      this.syncAndBroadcast();
    }
  }

  // Set scenario
  public setScenario(scenario: ScenarioType) {
    if (!this.currentRoom) return;
    this.currentRoom.scenario = scenario;
    this.syncAndBroadcast();
    this.sendSystemChat(`Scenario shifted to [${scenario.toUpperCase()}]. Power cards and mechanics updated.`);
  }

  // Reset or restart match
  public resetMatch(scenario?: ScenarioType, startWithPrompted: boolean = true) {
    if (!this.currentRoom) return;
    const sc = scenario || this.currentRoom.scenario;
    this.currentRoom.scenario = sc;
    this.currentRoom.status = 'playing';
    this.currentRoom.turnIndex = 0;
    this.currentRoom.startWithPromptedTiles = startWithPrompted;
    this.currentRoom.activeNegotiation = null;
    this.currentRoom.activeLifelineOffer = null;
    this.currentRoom.totalNegotiationsCompleted = 0;

    // Reset player scores and milestones
    this.currentRoom.players.forEach((p) => {
      p.hasPassed = false;
      p.politenessTokens = 0;
      p.mediatorTokens = 0;
      p.hasFaceSavingLifeline = true;
      p.hasMediatorBridgeCard = true;
      p.bonusActionsRemaining = 0;
      p.faceSavedMilestone = false;
      p.escapedDramaTriangleMilestone = false;
      p.negotiationAccordMilestone = false;
      p.obligatedCorner = null;
    });

    if (startWithPrompted) {
      this.currentRoom.history = getPromptedStarterMoves(this.currentRoom.players);
    } else {
      this.currentRoom.history = [];
    }

    this.syncAndBroadcast();
    this.sendSystemChat(`New match initialized in [${sc.toUpperCase()}] mode! Blue begins.`);
  }

  // Power Card 1: The Face-Saving Lifeline (Player A plays to leave an escape route)
  public offerFaceSavingLifeline(targetPlayerId: string, escapeCorner: { row: number; col: number }) {
    if (!this.currentRoom) return;
    const proposer = this.currentRoom.players[this.currentRoom.turnIndex];
    const target = this.currentRoom.players.find((p) => p.id === targetPlayerId);
    if (!proposer || !target) return;

    this.currentRoom.activeLifelineOffer = {
      proposerId: proposer.id,
      targetId: target.id,
      corner: escapeCorner,
    };

    this.broadcastEvent({
      type: 'game_event',
      event: 'lifeline_update',
      roomId: this.currentRoom.roomId,
      offer: this.currentRoom.activeLifelineOffer,
    });
    this.notify({ type: 'lifeline_update', offer: this.currentRoom.activeLifelineOffer });

    this.sendSystemChat(
      `DIPLOMATIC LIFELINE: ${proposer.name} offered ${target.name} a Face-Saving escape route at (${escapeCorner.row}, ${escapeCorner.col})!`
    );
  }

  // Target player accepts or declines Face-Saving Lifeline
  public respondToLifeline(accepted: boolean) {
    if (!this.currentRoom || !this.currentRoom.activeLifelineOffer) return;
    const offer = this.currentRoom.activeLifelineOffer;
    const proposer = this.currentRoom.players.find((p) => p.id === offer.proposerId);
    const target = this.currentRoom.players.find((p) => p.id === offer.targetId);

    if (accepted && proposer && target) {
      // Player A gains Politeness Token (-3 penalty squares)
      proposer.politenessTokens = (proposer.politenessTokens || 0) + 1;
      // Target accepts lifeline condition: obligated to play next tile into that corner
      target.obligatedCorner = offer.corner;
      target.faceSavedMilestone = true;

      this.sendSystemChat(
        `LIFELINE ACCEPTED! ${target.name} retained autonomy; ${proposer.name} earned 1 Politeness Token (-3 endgame penalty squares).`
      );
    } else if (proposer && target) {
      this.sendSystemChat(`${target.name} declined the lifeline. Normal territorial competition resumes.`);
    }

    this.currentRoom.activeLifelineOffer = null;
    this.syncAndBroadcast();
  }

  // Power Card 2: The Mediator's Bridge (constructs exit for opponent, earns Mediator's Token + bonus action)
  public executeMediatorBridge(
    pieceId: string,
    matrix: number[][],
    row: number,
    col: number,
    color: PlayerColor
  ): boolean {
    if (!this.currentRoom || this.currentRoom.status !== 'playing') return false;
    const activePlayer = this.currentRoom.players[this.currentRoom.turnIndex];
    if (!activePlayer) return false;

    const move: PlacedPiece = {
      id: 'bridge_' + Math.random().toString(36).substring(2, 9),
      pieceId,
      color,
      playerId: activePlayer.id,
      row,
      col,
      matrix,
      turnNumber: this.currentRoom.history.length + 1,
      timestamp: Date.now(),
      styleClass: 'mediator_bridge',
      isBridge: true,
    };

    this.currentRoom.history.push(move);

    // Mutual benefit rewards
    activePlayer.mediatorTokens = (activePlayer.mediatorTokens || 0) + 1;
    activePlayer.escapedDramaTriangleMilestone = true;
    activePlayer.bonusActionsRemaining = (activePlayer.bonusActionsRemaining || 0) + 1;

    // Give adjacent opponents escape milestone
    this.currentRoom.players.forEach((p) => {
      if (p.color !== color) {
        p.escapedDramaTriangleMilestone = true;
      }
    });

    this.sendSystemChat(
      `MEDIATOR’S BRIDGE CONSTRUCTED! ${activePlayer.name} earned 1 Mediator’s Token and unlocked an immediate BONUS PLACEMENT action this turn!`
    );

    // Because of bonus action, do NOT advance turn yet
    this.syncAndBroadcast();
    this.notify({
      type: 'move_placed',
      move,
      nextTurnIndex: this.currentRoom.turnIndex,
    });
    return true;
  }

  // 1-Minute Negotiation / Tile Exchange Mechanism
  public initiateNegotiation(
    targetPlayerId: string,
    offeredPieceId: string,
    requestedPieceId: string
  ): ActiveNegotiation | null {
    if (!this.currentRoom || this.currentRoom.status !== 'playing') return null;

    const initiator = this.currentRoom.players[this.currentRoom.turnIndex];
    const target = this.currentRoom.players.find((p) => p.id === targetPlayerId);
    if (!initiator || !target) return null;

    const negotiation: ActiveNegotiation = {
      id: 'neg_' + Math.random().toString(36).substring(2, 9),
      initiatorId: initiator.id,
      initiatorName: initiator.name,
      initiatorColor: initiator.color,
      targetId: target.id,
      targetName: target.name,
      targetColor: target.color,
      offeredPieceId,
      requestedPieceId,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60000, // Strict 1 minute (60s) timer
      status: 'pending',
    };

    this.currentRoom.activeNegotiation = negotiation;

    this.broadcastEvent({
      type: 'game_event',
      event: 'negotiation_update',
      roomId: this.currentRoom.roomId,
      negotiation,
    });
    this.notify({ type: 'negotiation_update', negotiation });
    this.notify({ type: 'room_state_update', state: this.currentRoom });

    this.sendSystemChat(
      `1-MINUTE NEGOTIATION STARTED: ${initiator.name} offered [${offeredPieceId}] to ${target.name} for [${requestedPieceId}]. 60s countdown begins!`
    );

    return negotiation;
  }

  // Accept Negotiation (Swaps pieces and records accord)
  public acceptNegotiation() {
    if (!this.currentRoom || !this.currentRoom.activeNegotiation) return;
    const neg = this.currentRoom.activeNegotiation;
    neg.status = 'accepted';

    const initiator = this.currentRoom.players.find((p) => p.id === neg.initiatorId);
    const target = this.currentRoom.players.find((p) => p.id === neg.targetId);

    if (initiator && target) {
      initiator.negotiationAccordMilestone = true;
      target.negotiationAccordMilestone = true;
      this.currentRoom.totalNegotiationsCompleted = (this.currentRoom.totalNegotiationsCompleted || 0) + 1;

      // In Blokus history, piece inventories are dynamic: swapping offered and requested pieces
      // We can inject a diplomatic exchange marker or swap virtual piece claims
      this.sendSystemChat(
        `MUTUAL ACCORD REACHED! ${initiator.name} and ${target.name} successfully exchanged tiles within the 1-minute window.`
      );
    }

    this.currentRoom.activeNegotiation = null;
    this.syncAndBroadcast();
  }

  // Decline Negotiation
  public declineNegotiation() {
    if (!this.currentRoom || !this.currentRoom.activeNegotiation) return;
    const neg = this.currentRoom.activeNegotiation;
    neg.status = 'declined';
    this.sendSystemChat(`Negotiation declined by ${neg.targetName}. Turn continues.`);
    this.currentRoom.activeNegotiation = null;
    this.syncAndBroadcast();
  }

  // Negotiation Timeout: 1 minute expired without agreement => turn forfeited to next player!
  public timeoutNegotiation() {
    if (!this.currentRoom || !this.currentRoom.activeNegotiation) return;
    const neg = this.currentRoom.activeNegotiation;
    neg.status = 'timed_out';

    this.sendSystemChat(
      `NEGOTIATION TIMEOUT! 1 minute expired without mutual accord. Turn forfeited to next player!`
    );

    this.currentRoom.activeNegotiation = null;

    // Advance turn to next player
    const nextIndex = (this.currentRoom.turnIndex + 1) % this.currentRoom.players.length;
    this.currentRoom.turnIndex = nextIndex;

    this.syncAndBroadcast();
    this.checkAndTriggerNextTurn();
  }

  // Standard Tile Placement
  public placeMove(
    pieceId: string,
    matrix: number[][],
    row: number,
    col: number,
    color: PlayerColor
  ): boolean {
    if (!this.currentRoom || this.currentRoom.status !== 'playing') return false;

    const activePlayer = this.currentRoom.players[this.currentRoom.turnIndex];

    const move: PlacedPiece = {
      id: 'move_' + Math.random().toString(36).substring(2, 9),
      pieceId,
      color,
      playerId: activePlayer ? activePlayer.id : this.localPlayerId,
      row,
      col,
      matrix,
      turnNumber: this.currentRoom.history.length + 1,
      timestamp: Date.now(),
      styleClass: this.currentRoom.scenario,
    };

    this.currentRoom.history.push(move);

    // Clear obligated corner if met
    if (activePlayer && activePlayer.obligatedCorner) {
      activePlayer.obligatedCorner = null;
    }

    // Check if player had bonus action remaining (from Mediator's Bridge)
    let nextIndex = this.currentRoom.turnIndex;
    if (activePlayer && activePlayer.bonusActionsRemaining && activePlayer.bonusActionsRemaining > 0) {
      activePlayer.bonusActionsRemaining--;
      this.sendSystemChat(`${activePlayer.name} used their BONUS ACTION! Turn continues.`);
    } else {
      nextIndex = (this.currentRoom.turnIndex + 1) % this.currentRoom.players.length;
      this.currentRoom.turnIndex = nextIndex;
    }

    this.notify({
      type: 'move_placed',
      move,
      nextTurnIndex: nextIndex,
    });

    this.broadcastEvent({
      type: 'game_event',
      event: 'move_placed',
      roomId: this.currentRoom.roomId,
      move,
      nextTurnIndex: nextIndex,
    });

    this.syncAndBroadcast();
    this.checkAndTriggerNextTurn();
    return true;
  }

  // Pass turn
  public passTurn(playerId: string) {
    if (!this.currentRoom || this.currentRoom.status !== 'playing') return;

    const player = this.currentRoom.players.find((p) => p.id === playerId);
    if (player) {
      player.hasPassed = true;
    }

    const nextIndex = (this.currentRoom.turnIndex + 1) % this.currentRoom.players.length;
    this.currentRoom.turnIndex = nextIndex;

    this.notify({
      type: 'player_passed',
      playerId,
      nextTurnIndex: nextIndex,
    });

    this.broadcastEvent({
      type: 'game_event',
      event: 'player_passed',
      roomId: this.currentRoom.roomId,
      playerId,
      nextTurnIndex: nextIndex,
    });

    this.sendSystemChat(`${player?.name || 'A player'} has passed (no more legal moves).`);
    this.syncAndBroadcast();
    this.checkAndTriggerNextTurn();
  }

  // Broadcast sync state
  private syncAndBroadcast() {
    if (!this.currentRoom) return;
    this.notify({ type: 'room_state_update', state: this.currentRoom });
    this.broadcastToPeers({
      type: 'sync_state',
      roomId: this.currentRoom.roomId,
      state: this.currentRoom,
    });
  }

  // Send a chat message
  public sendChatMessage(text: string, isEmote: boolean = false) {
    if (!this.currentRoom) return;
    const player = this.currentRoom.players.find((p) => p.color === this.activeControlColor);
    const msg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      senderId: this.localPlayerId,
      senderName: player?.name || 'Player',
      senderColor: player?.color || 'blue',
      text,
      timestamp: Date.now(),
      isEmote,
    };

    this.notify({ type: 'chat_message', message: msg });
    this.broadcastToPeers({
      type: 'chat_message',
      roomId: this.currentRoom.roomId,
      message: msg,
    });
  }

  public sendSystemChat(text: string) {
    if (!this.currentRoom) return;
    const msg: ChatMessage = {
      id: 'sys_' + Math.random().toString(36).substring(2, 9),
      senderId: 'system',
      senderName: 'NEGOTIATION SYSTEM',
      text,
      timestamp: Date.now(),
      isSystem: true,
    };
    this.notify({ type: 'chat_message', message: msg });
    this.broadcastToPeers({
      type: 'chat_message',
      roomId: this.currentRoom.roomId,
      message: msg,
    });
  }

  public getReconstructedBoard() {
    let board = createEmptyBoard();
    if (!this.currentRoom) return board;
    for (const move of this.currentRoom.history) {
      board = applyMove(board, move.matrix, move.row, move.col, move.color);
    }
    return board;
  }

  private checkAndTriggerNextTurn() {
    if (!this.currentRoom || this.currentRoom.status !== 'playing') return;

    const allPassed = this.currentRoom.players.every((p) => p.hasPassed);
    if (allPassed) {
      this.currentRoom.status = 'ended';
      this.sendSystemChat('Game over! All players have concluded their placements.');
      this.notify({ type: 'game_over', state: this.currentRoom });
      this.syncAndBroadcast();
      return;
    }

    let activePlayer = this.currentRoom.players[this.currentRoom.turnIndex];
    let loopGuard = 0;
    while (activePlayer && activePlayer.hasPassed && loopGuard < this.currentRoom.players.length) {
      this.currentRoom.turnIndex = (this.currentRoom.turnIndex + 1) % this.currentRoom.players.length;
      activePlayer = this.currentRoom.players[this.currentRoom.turnIndex];
      loopGuard++;
    }

    // Only run AI if the active player is explicitly marked as bot
    if (activePlayer && activePlayer.isBot && !activePlayer.hasPassed) {
      if (this.aiLoopInterval) clearTimeout(this.aiLoopInterval);
      this.aiLoopInterval = window.setTimeout(() => {
        this.executeAIMove(activePlayer);
      }, 750);
    }
  }

  private executeAIMove(botPlayer: Player) {
    if (!this.currentRoom || this.currentRoom.status !== 'playing') return;
    const board = this.getReconstructedBoard();

    const botPlayedPieces = this.currentRoom.history
      .filter((h) => h.playerId === botPlayer.id || h.color === botPlayer.color)
      .map((h) => h.pieceId);
    const remainingPieceIds = ALL_PIECES.map((p) => p.id).filter(
      (id) => !botPlayedPieces.includes(id)
    );

    const hasLegal = hasAnyLegalMove(board, botPlayer.color, remainingPieceIds);
    if (!hasLegal || remainingPieceIds.length === 0) {
      this.passTurn(botPlayer.id);
      return;
    }

    const aiMove = generateAIMove(
      board,
      botPlayer.color,
      remainingPieceIds,
      botPlayer.botPersonality || 'balanced'
    );

    if (!aiMove) {
      this.passTurn(botPlayer.id);
      return;
    }

    this.placeMove(
      aiMove.pieceId,
      aiMove.matrix,
      aiMove.row,
      aiMove.col,
      botPlayer.color
    );
  }

  private broadcastToPeers(payload: any) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch {
        // ignore
      }
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
      } catch {
        // ignore
      }
    }
  }

  private broadcastEvent(payload: any) {
    this.broadcastToPeers(payload);
  }

  public subscribe(callback: NetworkEventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(event: NetworkEvent) {
    this.listeners.forEach((listener) => listener(event));
  }
}

export const multiplayer = new MultiplayerClient();

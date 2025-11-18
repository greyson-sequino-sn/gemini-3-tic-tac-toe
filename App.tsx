import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Board } from './components/Board';
import { GameControls } from './components/GameControls';
import { OnlineSetup } from './components/OnlineSetup';
import { Player, GameMode } from './types';
import { INITIAL_BOARD } from './constants';
import { calculateWinner } from './services/gameLogic';
import { getAIMove } from './services/geminiService';
import { Sparkles, BrainCircuit, Trophy, Bot, Wifi } from 'lucide-react';
import { Peer, DataConnection } from 'peerjs';

const App: React.FC = () => {
  // Game State
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.LOCAL_PVP);
  const [difficulty, setDifficulty] = useState<string>('easy');
  const [board, setBoard] = useState<Player[]>(INITIAL_BOARD);
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  
  // AI State
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [aiComment, setAiComment] = useState<string | null>(null);
  
  // Scores
  const [scores, setScores] = useState({ player1: 0, player2: 0, draws: 0 });

  // Online State
  const [peerId, setPeerId] = useState<string | null>(null);
  const [connection, setConnection] = useState<DataConnection | null>(null);
  const [isOnlineConnected, setIsOnlineConnected] = useState(false);
  const [myOnlineRole, setMyOnlineRole] = useState<Player>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const peerRef = useRef<Peer | null>(null);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset Logic
  const resetGame = useCallback((isOnlineReset = false) => {
    setBoard(INITIAL_BOARD);
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    setAiComment(null);
    setIsThinking(false);

    if (gameMode === GameMode.ONLINE && connection && !isOnlineReset) {
      connection.send({ type: 'RESET' });
    }
  }, [gameMode, connection]);

  // Peer Lifecycle Management
  useEffect(() => {
    if (gameMode === GameMode.ONLINE) {
      let retryCount = 0;
      const maxRetries = 5;
      let mounted = true;

      const initializePeer = () => {
        if (!mounted) return;

        // Cleanup existing if needed
        if (peerRef.current) {
            peerRef.current.destroy();
        }

        // Generate a random 5-character ID to reduce collisions on public server
        // Using a simpler character set to avoid confusion (no 0/O, 1/I/l)
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let customId = '';
        for (let i = 0; i < 5; i++) {
          customId += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        const newPeer = new Peer(customId, {
          debug: 1,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });

        newPeer.on('open', (id) => {
          if (!mounted) return;
          console.log('My peer ID is: ' + id);
          setPeerId(id);
          setConnectionError(null);
          retryCount = 0;
        });

        newPeer.on('connection', (conn) => {
          if (!mounted) return;
          console.log('Incoming connection');
          setupConnection(conn, 'X'); // If I receive connection, I am Host (X)
        });

        newPeer.on('disconnected', () => {
          console.log('Disconnected from signalling server.');
          // Workaround for PeerJS not auto-reconnecting to signalling server
          if (newPeer && !newPeer.destroyed && mounted) {
            setTimeout(() => {
                if (newPeer && !newPeer.destroyed && mounted) {
                    console.log('Attempting reconnect to signalling server...');
                    newPeer.reconnect();
                }
            }, 2000);
          }
        });

        newPeer.on('close', () => {
            console.log('Peer connection closed.');
            if (mounted) {
                setPeerId(null);
                setConnectionError('Connection closed. Please refresh.');
            }
        });

        newPeer.on('error', (err: any) => {
          if (!mounted) return;
          console.error('Peer error:', err);
          
          const errType = err.type;
          const errMessage = err.message || '';

          if (errType === 'unavailable-id') {
            // ID collision, retry with new ID
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`ID collision, retrying... (${retryCount}/${maxRetries})`);
              newPeer.destroy();
              setTimeout(initializePeer, 500);
            } else {
              setConnectionError('Could not generate a unique ID. Please refresh.');
            }
          } else if (errType === 'peer-unavailable') {
            setConnectionError('Peer not found. Check the code and try again.');
            setIsConnecting(false);
            if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
            }
          } else if (errType === 'network' || errMessage.includes('Lost connection')) {
             // Silently try to reconnect if network drops
             if (newPeer && !newPeer.destroyed) {
                 console.log('Network glitch, trying to reconnect...');
                 newPeer.reconnect();
             } else {
                 setConnectionError('Connection lost. Please check your internet.');
             }
          } else {
            setConnectionError(`Error: ${errMessage || 'Unknown error'}`);
            setIsConnecting(false);
            if (connectionTimeoutRef.current) {
                clearTimeout(connectionTimeoutRef.current);
            }
          }
        });

        peerRef.current = newPeer;
      };

      initializePeer();

      // Cleanup
      return () => {
        mounted = false;
        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
        if (peerRef.current) {
          peerRef.current.destroy();
          peerRef.current = null;
        }
        setPeerId(null);
        setConnection(null);
        setIsOnlineConnected(false);
        setMyOnlineRole(null);
        setConnectionError(null);
        setIsConnecting(false);
      };
    }
  }, [gameMode]);

  const setupConnection = (conn: DataConnection, role: Player) => {
    setConnectionError(null);
    // Important: Do NOT set isConnecting(false) here. Wait for 'open' or 'error'.
    
    // Clean up existing connection if any
    if (connection) {
      connection.close();
    }

    conn.on('open', () => {
      console.log('Connection opened');
      // Clear timeout if it exists
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      setConnection(conn);
      setIsOnlineConnected(true);
      setMyOnlineRole(role);
      setIsConnecting(false);
      
      // Start fresh game
      setBoard(INITIAL_BOARD);
      setIsXNext(true);
      setWinner(null);
      setWinningLine(null);
      setScores({ player1: 0, player2: 0, draws: 0 });
    });

    conn.on('data', (data: any) => {
      console.log('Received data', data);
      if (data.type === 'MOVE') {
        setBoard(prev => {
          const newBoard = [...prev];
          newBoard[data.index] = data.player;
          return newBoard;
        });
        // Ensure the turn switches correctly
        setIsXNext(data.player === 'X' ? false : true);
      } else if (data.type === 'RESET') {
        setBoard(INITIAL_BOARD);
        setIsXNext(true);
        setWinner(null);
        setWinningLine(null);
      }
    });

    conn.on('close', () => {
      console.log('Connection closed');
      setConnection(null);
      setIsOnlineConnected(false);
      setMyOnlineRole(null);
      setConnectionError('Opponent disconnected');
      setIsConnecting(false);
    });
    
    conn.on('error', (err) => {
        console.error("Data connection error", err);
        // Don't hard fail on transient errors unless we are still connecting
        if (isConnecting) {
            setConnectionError('Connection failed.');
            setIsConnecting(false);
        }
    });
  };

  const connectToPeer = (remotePeerId: string) => {
    if (!peerRef.current || !remotePeerId) return;
    
    setIsConnecting(true);
    setConnectionError(null);
    
    const cleanId = remotePeerId.trim().toUpperCase();
    
    // Connect to the remote peer
    const conn = peerRef.current.connect(cleanId, {
        reliable: true
    });

    // Safety timeout
    if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    connectionTimeoutRef.current = setTimeout(() => {
        setIsConnecting(prev => {
            if (prev) { // Only if still connecting
                setConnectionError('Connection timed out. The host might be offline or unreachable.');
                return false;
            }
            return prev;
        });
    }, 10000); // 10 second timeout
    
    setupConnection(conn, 'O'); // If I connect, I am Guest (O)
  };

  // Mode Change Handler
  const handleModeChange = (mode: GameMode) => {
    if (mode === gameMode) return;
    setGameMode(mode);
    // Reset scores when switching major modes
    setScores({ player1: 0, player2: 0, draws: 0 });
    resetGame();
  };

  const handleDifficultyChange = (diff: string) => {
    setDifficulty(diff);
    resetGame();
  };

  // Update Scores
  useEffect(() => {
    if (winner) {
      setScores(prev => {
        if (winner === 'X') return { ...prev, player1: prev.player1 + 1 };
        if (winner === 'O') return { ...prev, player2: prev.player2 + 1 };
        if (winner === 'DRAW') return { ...prev, draws: prev.draws + 1 };
        return prev;
      });
    }
  }, [winner]);

  // Check for winner on board change
  useEffect(() => {
    const result = calculateWinner(board);
    setWinner(result.winner);
    setWinningLine(result.line);
  }, [board]);

  // AI Turn Effect
  useEffect(() => {
    const makeAIMove = async () => {
      if (
        gameMode === GameMode.VS_AI &&
        !isXNext && 
        !winner && 
        !isThinking
      ) {
        setIsThinking(true);
        try {
          await new Promise(resolve => setTimeout(resolve, 600));
          const response = await getAIMove(board, difficulty);
          
          if (response.moveIndex >= 0 && response.moveIndex < 9 && board[response.moveIndex] === null) {
            const newBoard = [...board];
            newBoard[response.moveIndex] = 'O';
            setBoard(newBoard);
            setIsXNext(true);
            setAiComment(response.comment);
          }
        } catch (err) {
          console.error("AI Failed to move", err);
        } finally {
          setIsThinking(false);
        }
      }
    };

    makeAIMove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, isXNext, winner, gameMode, difficulty]); 

  // Handle Click
  const handleClick = (i: number) => {
    // Basic checks
    if (board[i] || winner) return;

    // AI Turn check
    if (gameMode === GameMode.VS_AI && !isXNext && isThinking) return;

    // Online Turn check
    if (gameMode === GameMode.ONLINE) {
      if (!isOnlineConnected) return;
      const isMyTurn = (isXNext && myOnlineRole === 'X') || (!isXNext && myOnlineRole === 'O');
      if (!isMyTurn) return;
    }

    const currentPlayer = isXNext ? 'X' : 'O';
    const newBoard = [...board];
    newBoard[i] = currentPlayer;
    setBoard(newBoard);
    setIsXNext(!isXNext);

    // Send move if online
    if (gameMode === GameMode.ONLINE && connection) {
      connection.send({ type: 'MOVE', index: i, player: currentPlayer });
    }
  };

  // Main Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex flex-col items-center justify-center p-4 sm:p-8">
      <header className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/30">
          <Sparkles className="w-5 h-5 text-indigo-400 mr-2" />
          <span className="text-indigo-300 font-medium text-sm tracking-wide">POWERED BY GEMINI 2.5</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 mb-2">
          Tic Tac Toe
        </h1>
        <p className="text-slate-400">
          {gameMode === GameMode.VS_AI ? 'Challenge the AI Intelligence' : 
           gameMode === GameMode.ONLINE ? 'Online Multiplayer' : 'Local Multiplayer Battle'}
        </p>
      </header>

      <main className="flex flex-col lg:flex-row items-start gap-8 sm:gap-12 w-full max-w-5xl justify-center">
        
        {/* Left Column: Board & Status */}
        <div className="flex flex-col items-center gap-6 flex-1 w-full">
          <div className="relative">
            <Board 
              squares={board} 
              onClick={handleClick} 
              winningLine={winningLine}
              disabled={
                !!winner || 
                (gameMode === GameMode.VS_AI && !isXNext) ||
                (gameMode === GameMode.ONLINE && (!isOnlineConnected || (isXNext && myOnlineRole !== 'X') || (!isXNext && myOnlineRole !== 'O')))
              }
            />
            
            {/* Status Indicator */}
            <div className="mt-6 text-center h-8">
              {winner ? (
                <div className="flex items-center justify-center gap-2 text-xl font-bold animate-in fade-in slide-in-from-bottom-4">
                   {winner === 'DRAW' ? (
                     <span className="text-slate-300">It's a Draw!</span>
                   ) : (
                     <>
                       <span className={winner === 'X' ? 'text-cyan-400' : 'text-fuchsia-400'}>
                         {winner === 'X' ? 
                            (gameMode === GameMode.ONLINE && myOnlineRole === 'X' ? 'You' : 
                             gameMode === GameMode.ONLINE ? 'Opponent' : 
                             gameMode === GameMode.LOCAL_PVP ? 'Player X' : 'You') 
                            : 
                            (gameMode === GameMode.ONLINE && myOnlineRole === 'O' ? 'You' : 
                             gameMode === GameMode.ONLINE ? 'Opponent' :
                             gameMode === GameMode.LOCAL_PVP ? 'Player O' : 'Gemini')
                         }
                       </span>
                       <span className="text-white">Wins!</span>
                       <Trophy className="text-yellow-400 w-6 h-6 ml-1" />
                     </>
                   )}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-lg font-medium text-slate-300">
                  {gameMode === GameMode.VS_AI && !isXNext ? (
                    <>
                      <BrainCircuit className="w-5 h-5 text-fuchsia-400 animate-pulse" />
                      <span className="animate-pulse">Gemini is thinking...</span>
                    </>
                  ) : (
                    <>
                      <span className={isXNext ? 'text-cyan-400' : 'text-fuchsia-400'}>
                        {isXNext ? (
                           gameMode === GameMode.ONLINE ? (myOnlineRole === 'X' ? "Your Turn" : "Opponent's Turn") :
                           gameMode === GameMode.LOCAL_PVP ? "Player X's Turn" : "Your Turn"
                        ) : (
                           gameMode === GameMode.ONLINE ? (myOnlineRole === 'O' ? "Your Turn" : "Opponent's Turn") :
                           "Player O's Turn"
                        )}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Controls */}
        <div className="flex flex-col gap-6 w-full lg:w-auto lg:min-w-[350px]">
          <GameControls 
            gameMode={gameMode}
            setGameMode={handleModeChange}
            difficulty={difficulty}
            setDifficulty={handleDifficultyChange}
            onReset={() => resetGame()}
            scores={scores}
            isOnlineConnected={isOnlineConnected}
          />

          {/* Online Setup Panel */}
          {gameMode === GameMode.ONLINE && !isOnlineConnected && (
             <OnlineSetup 
                myPeerId={peerId} 
                connectToPeer={connectToPeer}
                isConnecting={isConnecting}
                connectionError={connectionError}
             />
          )}

          {/* Online Status Panel (When Connected) */}
          {gameMode === GameMode.ONLINE && isOnlineConnected && (
             <div className="w-full max-w-md bg-slate-800/40 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 animate-in fade-in">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Wifi className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-emerald-400">Connected Online</span>
                  <span className="text-xs text-slate-400">Playing as {myOnlineRole === 'X' ? 'Player X' : 'Player O'}</span>
                </div>
             </div>
          )}

          {/* AI Commentary Box */}
          {gameMode === GameMode.VS_AI && (
            <div className="w-full max-w-md bg-slate-800/40 border border-slate-700 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-fuchsia-500 to-indigo-500 opacity-50"></div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg shrink-0">
                  <Bot className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Gemini Live Status</span>
                  <p className="text-sm text-slate-300 italic leading-relaxed min-h-[3rem]">
                    {isThinking ? (
                      <span className="opacity-70">Analyzing winning probabilities...</span>
                    ) : aiComment ? (
                      `"${aiComment}"`
                    ) : (
                      "Ready to play. Your move!"
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default App;
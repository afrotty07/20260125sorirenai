import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PMScreen from './components/PMScreen';
import GameConsole from './components/GameConsole';
import StatusBoard from './components/StatusBoard';
import AudioManager from './components/AudioManager';
import { fullPMData } from './data/pmData';
import { Play, RotateCcw, Award, Skull, Landmark, LogOut } from 'lucide-react';

import { auth, provider, db } from './lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function App() {
    const [gameState, setGameState] = useState('title'); // title, selection, playing, ending
    const [currentPM, setCurrentPM] = useState(null);
    const [score, setScore] = useState(50); // Start with 50% occupancy
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [outcome, setOutcome] = useState(null); // 'happy' or 'bad'
    const [isMuted, setIsMuted] = useState(true); // Start muted to respect autoplay policies
    const [clearedPMs, setClearedPMs] = useState([]); // Array of PM IDs who reached Happy End
    const [visualEffect, setVisualEffect] = useState(null); // 'good' or 'bad'
    const [hasSuspendedGame, setHasSuspendedGame] = useState(false);
    
    // Firebase Auth State
    const [user, setUser] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(true);

    // Load romance records and user auth on mount
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setIsLoadingUser(false);
            if (currentUser) {
                // Load data from Firestore
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    if (data.clearedPMs) setClearedPMs(data.clearedPMs);
                    if (data.suspendedGame) setHasSuspendedGame(true);
                }
            } else {
                // Fallback to localStorage
                const savedRecords = localStorage.getItem('pmRomanceRecords');
                if (savedRecords) {
                    setClearedPMs(JSON.parse(savedRecords));
                }
                setHasSuspendedGame(!!localStorage.getItem('pmSuspendedGame'));
            }
        });

        return () => unsubscribe();
    }, []);

    // Helper to save suspended game
    const saveSuspendedGame = async (gameData) => {
        if (user) {
            await setDoc(doc(db, 'users', user.uid), { suspendedGame: gameData }, { merge: true });
        } else {
            if (gameData) localStorage.setItem('pmSuspendedGame', JSON.stringify(gameData));
            else localStorage.removeItem('pmSuspendedGame');
        }
    };

    // Auto-save suspended game
    useEffect(() => {
        if (gameState === 'playing' && currentPM) {
            const gameData = {
                pmId: currentPM.id,
                score,
                currentStepIndex,
                feedback
            };
            setHasSuspendedGame(true);
            saveSuspendedGame(gameData);
        } else if (gameState === 'ending' || gameState === 'title') {
            setHasSuspendedGame(false);
            saveSuspendedGame(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState, currentPM, score, currentStepIndex, feedback]);

    // Save romance records when a new PM is cleared
    useEffect(() => {
        if (clearedPMs.length > 0) {
            if (user) {
                setDoc(doc(db, 'users', user.uid), { clearedPMs }, { merge: true });
            } else {
                localStorage.setItem('pmRomanceRecords', JSON.stringify(clearedPMs));
            }
        }
    }, [clearedPMs, user]);

    const handleLogin = async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setClearedPMs([]);
            setHasSuspendedGame(false);
            setGameState('title');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const startGame = () => setGameState('selection');

    const resumeGame = async () => {
        let data = null;
        if (user) {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists() && userDoc.data().suspendedGame) {
                data = userDoc.data().suspendedGame;
            }
        } else {
            const suspendedGame = localStorage.getItem('pmSuspendedGame');
            if (suspendedGame) {
                data = JSON.parse(suspendedGame);
            }
        }

        if (data) {
            const pm = fullPMData.find(p => p.id === data.pmId);
            if (pm) {
                setCurrentPM(pm);
                setScore(data.score);
                setCurrentStepIndex(data.currentStepIndex);
                setFeedback(data.feedback);
                setGameState('playing');
                setIsMuted(false);
            }
        }
    };

    const selectPM = (pm) => {
        setCurrentPM(pm);
        setScore(50);
        setFeedback('');
        setCurrentStepIndex(0);
        setGameState('playing');
        setIsMuted(false); // Enable music when game starts
    };

    const handleChoice = (choice) => {
        if (!choice) {
            // "Next" clicked after feedback
            if (currentStepIndex + 1 < currentPM.steps.length) {
                setCurrentStepIndex(currentStepIndex + 1);
                setFeedback('');
            } else {
                // All steps completed, determine ending
                const finalOutcome = score >= 70 ? 'happy' : (score <= 30 ? 'bad' : (score >= 50 ? 'happy' : 'bad'));

                setOutcome(finalOutcome);
                setGameState('ending');

                if (finalOutcome === 'happy' && !clearedPMs.includes(currentPM.name)) {
                    setClearedPMs(prev => [...prev, currentPM.name]);
                }
            }
            return;
        }

        const newScore = score + choice.point;
        setScore(newScore);
        setFeedback(choice.feedback);

        // Trigger visual effect based on point value
        if (choice.point >= 15) {
            setVisualEffect('good');
        } else if (choice.point <= 0) {
            setVisualEffect('bad');
        }

        // Clear effect after 1 second
        setTimeout(() => setVisualEffect(null), 1000);
    };

    const resetGame = () => {
        setGameState('title');
        setCurrentPM(null);
        setScore(50);
        setFeedback('');
        setCurrentStepIndex(0);
        setOutcome(null);
    };

    // Title Screen Component
    const TitleScreen = () => (
        <div className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
            <div
                className="absolute inset-0 bg-cover bg-center z-0 scale-105"
                style={{ backgroundImage: "url('/diet_bg.png')" }}
            >
                <div className="absolute inset-0 bg-wa-indigo/40 mix-blend-multiply"></div>
            </div>

            {/* Auth UI */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                {!isLoadingUser && (
                    user ? (
                        <div className="flex items-center gap-3 bg-white/95 px-4 py-2 border-2 border-wa-indigo shadow-md rounded-sm">
                            <img src={user.photoURL} alt="user" className="w-8 h-8 rounded-full border border-gray-300" referrerPolicy="no-referrer" />
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-wa-indigo">{user.displayName} さん</span>
                                <span className="text-[10px] text-gray-500">🎮 セーブデータ同期中</span>
                            </div>
                            <button onClick={handleLogout} className="text-wa-red hover:underline text-xs flex items-center gap-1 ml-2 border-l pl-2 border-gray-200">
                                <LogOut size={14} /> ログアウト
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleLogin} className="flex items-center gap-2 bg-white px-4 py-2 border-2 border-blue-500 shadow-md text-blue-600 hover:bg-blue-50 font-bold text-sm transition-all hover:-translate-y-1 rounded-sm">
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Googleでログイン (セーブ同期)
                        </button>
                    )
                )}
            </div>

            <div className="relative z-10 text-center p-8 bg-wa-paper/90 backdrop-blur-md border-4 border-wa-gold shadow-2xl max-w-2xl transform -rotate-1">
                <h1 className="text-6xl font-black mb-2 text-wa-black tracking-tighter">
                    歴代首相<span className="text-wa-red italic">★</span>恋の議事録
                </h1>
                <p className="text-xl text-wa-indigo font-bold mb-8">
                    ― Prime Minister Heartthrob ―
                </p>

                <div className="space-y-4">
                    <p className="text-wa-black/80 font-medium leading-relaxed">
                        あなたは時を駆けるタイムトラベラー。<br />
                        激動の時代を生きる宰相たちの懐に入り、<br />
                        歴史を動かす恋と政策の二重奏を奏でましょう。
                    </p>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={startGame}
                            className="wa-button text-2xl px-12 py-4 flex items-center gap-3 mx-auto group"
                        >
                            <Play fill="currentColor" />
                            議政開始（はじめから）
                        </button>

                        {hasSuspendedGame && (
                            <button
                                onClick={resumeGame}
                                className="bg-wa-gold text-wa-black font-black text-xl px-12 py-4 border-4 border-wa-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-3 mx-auto"
                            >
                                <Award />
                                執務再開（つづきから）
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // Selection Screen Component
    const SelectionScreen = () => (
        <div className="min-h-screen bg-wa-paper p-8 flex flex-col items-center">
            <div className="w-full max-w-7xl flex justify-between items-center mb-8 border-b-4 border-wa-gold pb-2">
                <h2 className="text-4xl font-black text-wa-indigo">
                    攻略対象（首相）を選択
                </h2>
                {user && (
                    <div className="px-4 py-2 bg-wa-indigo/10 border border-wa-indigo rounded-sm flex items-center gap-2">
                        <img src={user.photoURL} alt="user" className="w-6 h-6 rounded-full" />
                        <span className="text-wa-indigo font-bold text-sm">セーブ同期中</span>
                    </div>
                )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl overflow-y-auto max-h-[80vh] px-4 py-8">
                {fullPMData.map((pm) => {
                    const isCleared = clearedPMs.includes(pm.name);
                    return (
                        <div
                            key={pm.id}
                            onClick={() => selectPM(pm)}
                            className={`wa-card cursor-pointer group hover:border-wa-red hover:-translate-y-2 p-4 flex flex-col gap-3 relative overflow-hidden ${isCleared ? 'border-wa-red' : ''}`}
                        >
                            {isCleared && (
                                <div className="absolute top-2 right-2 text-wa-red animate-pulse">
                                    <Award size={24} />
                                </div>
                            )}
                            <div className="flex gap-4">
                                <div className="w-20 h-20 bg-wa-indigo/10 border border-wa-indigo/30 overflow-hidden flex-shrink-0">
                                    <img
                                        src={`/assets/pms/pm_${pm.id}.png`}
                                        alt={pm.name}
                                        className="w-full h-full object-cover object-top"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${pm.name}&backgroundColor=transparent`;
                                        }}
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] text-wa-black/40 font-bold">第{pm.id}代 内閣総理大臣</div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-2xl font-black text-wa-black group-hover:text-wa-red">{pm.name}</span>
                                        <span className="bg-wa-indigo text-wa-paper px-2 py-0.5 text-[10px]">{pm.era}</span>
                                    </div>
                                    <div className="text-xs text-wa-indigo font-bold italic">
                                        「{pm.personality}」
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Landmark size={80} />
                            </div>
                        </div>
                    );
                })}
            </div>

            <button onClick={resetGame} className="mt-8 wa-button flex items-center gap-2">
                タイトルへ戻る
            </button>
        </div>
    );

    // Ending Screen Component
    const EndingScreen = () => (
        <div className={`h-screen flex flex-col items-center justify-center p-8 transition-colors duration-1000 ${outcome === 'happy' ? 'bg-wa-paper' : 'bg-wa-black'}`}>
            <div className={`max-w-2xl w-full p-12 border-4 ${outcome === 'happy' ? 'border-wa-gold bg-white' : 'border-wa-red bg-gray-900'} shadow-2xl text-center transform rotate-1 relative`}>
                
                {user && outcome === 'happy' && (
                    <div className="absolute top-4 right-4 text-xs font-bold text-wa-indigo bg-wa-gold px-2 py-1 flex items-center gap-1 shadow-sm">
                        <Award size={14}/> クラウド保存完了
                    </div>
                )}
                
                {outcome === 'happy' ? (
                    <>
                        <Award size={80} className="mx-auto text-wa-gold mb-6 animate-bounce" />
                        <h2 className="text-5xl font-black text-wa-black mb-4">ハッピーエンド！</h2>
                        <p className="text-xl text-wa-indigo font-bold mb-6">内閣長期発足成功</p>
                        <p className="text-wa-black/80 leading-relaxed mb-8">
                            あなたの献身的な支えにより、{currentPM.name}は国民の絶大な支持を得て、<br />
                            歴史に名を残す名宰相となりました。<br />
                            二人は公私ともに最高のパートナーとして、<br />
                            新しい日本を築いていくことでしょう。
                        </p>
                    </>
                ) : (
                    <>
                        <Skull size={80} className="mx-auto text-wa-red mb-6 animate-pulse" />
                        <h2 className="text-5xl font-black text-wa-red mb-4">バッドエンド...</h2>
                        <p className="text-xl text-gray-400 font-bold mb-6">不信任決議可決 / 総辞職</p>
                        <p className="text-gray-300 leading-relaxed mb-8">
                            不穏なBGMに包まれ、{currentPM.name}の政権は脆くも崩れ去りました。<br />
                            国民の不満は爆発し、軍部の台頭を招く結果に……。<br />
                            二人の絆もまた、歴史の荒波に消えていきました。
                        </p>
                    </>
                )}

                <button onClick={resetGame} className="wa-button flex items-center gap-2 mx-auto">
                    <RotateCcw size={20} />
                    もう一度歴史を変える
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen">
            {gameState === 'title' && <TitleScreen />}

            {gameState === 'selection' && <SelectionScreen />}

            {gameState === 'playing' && (
                <div className="h-screen flex flex-col bg-wa-paper overflow-hidden relative">
                    {/* Visual Feedback Overlay */}
                    {visualEffect === 'good' && <div className="absolute inset-0 z-50 pointer-events-none visual-effect-good"></div>}
                    {visualEffect === 'bad' && <div className="absolute inset-0 z-50 pointer-events-none visual-effect-bad"></div>}

                    <Header
                        title="歴代首相★恋の議事録"
                        isMuted={isMuted}
                        onToggleMute={() => setIsMuted(!isMuted)}
                    />
                    <div className="relative flex-1 flex flex-col">
                        <StatusBoard score={score} />
                        <PMScreen pm={currentPM} />
                        <GameConsole
                            step={currentPM.steps[currentStepIndex]}
                            onChoice={handleChoice}
                            feedback={feedback}
                        />
                    </div>
                </div>
            )}

            <AudioManager isPlaying={!isMuted} />
            {gameState === 'ending' && <EndingScreen />}
        </div>
    );
}

export default App;

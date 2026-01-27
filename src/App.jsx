import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import PMScreen from './components/PMScreen';
import GameConsole from './components/GameConsole';
import StatusBoard from './components/StatusBoard';
import AudioManager from './components/AudioManager';
import { fullPMData } from './data/pmData';
import { Play, RotateCcw, Award, Skull, Landmark } from 'lucide-react';

function App() {
    const [gameState, setGameState] = useState('title'); // title, selection, playing, ending
    const [currentPM, setCurrentPM] = useState(null);
    const [score, setScore] = useState(50); // Start with 50% occupancy
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [outcome, setOutcome] = useState(null); // 'happy' or 'bad'
    const [isMuted, setIsMuted] = useState(true); // Start muted to respect autoplay policies

    const startGame = () => setGameState('selection');

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
                if (score >= 70) {
                    setOutcome('happy');
                    setGameState('ending');
                } else if (score <= 30) {
                    setOutcome('bad');
                    setGameState('ending');
                } else {
                    // Continue or end based on point threshold
                    setOutcome(score >= 50 ? 'happy' : 'bad');
                    setGameState('ending');
                }
            }
            return;
        }

        const newScore = score + choice.point;
        setScore(newScore);
        setFeedback(choice.feedback);
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

            <div className="relative z-10 text-center p-8 bg-wa-paper/90 backdrop-blur-md border-4 border-wa-gold shadow-2xl max-w-2xl transform -rotate-1">
                <h1 className="text-6xl font-black mb-2 text-wa-black tracking-tighter">
                    歴代首相<span className="text-wa-red italic">★</span>恋の議事録
                </h1>
                <p className="text-xl text-wa-indigo font-bold mb-8">
                    ― Prime Minister Heartthrob ―
                </p>

                <div className="space-y-6">
                    <p className="text-wa-black/80 font-medium leading-relaxed">
                        あなたは時を駆けるタイムトラベラー。<br />
                        激動の時代を生きる宰相たちの懐に入り、<br />
                        歴史を動かす恋と政策の二重奏を奏でましょう。
                    </p>

                    <button
                        onClick={startGame}
                        className="wa-button text-2xl px-12 py-4 flex items-center gap-3 mx-auto group"
                    >
                        <Play fill="currentColor" />
                        議政開始（スタート）
                    </button>
                </div>
            </div>
        </div>
    );

    // Selection Screen Component
    const SelectionScreen = () => (
        <div className="min-h-screen bg-wa-paper p-8 flex flex-col items-center">
            <h2 className="text-4xl font-black text-wa-indigo mb-8 border-b-4 border-wa-gold pb-2">
                攻略対象（首相）を選択
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl overflow-y-auto max-h-[80vh] px-4 py-8">
                {fullPMData.map((pm) => (
                    <div
                        key={pm.id}
                        onClick={() => selectPM(pm)}
                        className="wa-card cursor-pointer group hover:border-wa-red hover:-translate-y-2 p-4 flex flex-col gap-3 relative overflow-hidden"
                    >
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
                ))}
            </div>

            <button onClick={resetGame} className="mt-8 wa-button flex items-center gap-2">
                タイトルへ戻る
            </button>
        </div>
    );

    // Ending Screen Component
    const EndingScreen = () => (
        <div className={`h-screen flex flex-col items-center justify-center p-8 transition-colors duration-1000 ${outcome === 'happy' ? 'bg-wa-paper' : 'bg-wa-black'}`}>
            <div className={`max-w-2xl w-full p-12 border-4 ${outcome === 'happy' ? 'border-wa-gold bg-white' : 'border-wa-red bg-gray-900'} shadow-2xl text-center transform rotate-1`}>
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
                <div className="h-screen flex flex-col bg-wa-paper overflow-hidden">
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

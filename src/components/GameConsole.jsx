import React from 'react';

const GameConsole = ({ pm, onChoice, feedback }) => {
    return (
        <div className="w-full bg-wa-paper-texture bg-wa-black p-6 border-t-4 border-wa-gold min-h-[250px] relative">
            <div className="max-w-4xl mx-auto flex flex-col h-full">
                {/* Scenario Text */}
                <div className="mb-8 p-4 bg-white/5 border-l-4 border-wa-gold min-h-[80px]">
                    <p className="text-wa-paper text-xl leading-relaxed animate-in fade-in slide-in-from-left-4 duration-700">
                        {feedback || pm.scenario}
                    </p>
                </div>

                {/* Choices Container */}
                {!feedback && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pm.choices.map((choice, index) => (
                            <button
                                key={index}
                                onClick={() => onChoice(choice)}
                                className="wa-button text-lg font-bold py-4 group flex items-center justify-between"
                            >
                                <span>{choice.text}</span>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">▶</span>
                            </button>
                        ))}
                    </div>
                )}

                {feedback && (
                    <button
                        onClick={() => onChoice(null)}
                        className="wa-button self-end mt-4 animate-bounce"
                    >
                        次へ進む
                    </button>
                )}
            </div>
        </div>
    );
};

export default GameConsole;

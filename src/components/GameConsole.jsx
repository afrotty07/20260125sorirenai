import React from 'react';

const GameConsole = ({ step, onChoice, feedback }) => {
    return (
        <div className="w-full bg-wa-paper-texture bg-wa-black p-4 sm:p-6 border-t-4 border-wa-gold min-h-[180px] sm:min-h-[250px] relative">
            <div className="max-w-4xl mx-auto flex flex-col h-full">
                {/* Scenario Text */}
                <div className="mb-4 sm:mb-8 p-3 sm:p-4 bg-white/5 border-l-4 border-wa-gold min-h-[60px] sm:min-h-[80px]">
                    <p className="text-wa-paper text-base sm:text-xl leading-relaxed animate-in fade-in slide-in-from-left-4 duration-700">
                        {feedback || step.scenario}
                    </p>
                </div>

                {/* Choices Container */}
                {!feedback && (
                    <div className="flex flex-col gap-2 sm:gap-3">
                        {step.choices.map((choice, index) => (
                            <button
                                key={index}
                                onClick={() => onChoice(choice)}
                                className="wa-button text-sm sm:text-lg font-bold py-3 sm:py-4 group flex items-center justify-between"
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
                        className="wa-button self-end mt-2 sm:mt-4 animate-bounce text-sm sm:text-base"
                    >
                        次へ進む
                    </button>
                )}
            </div>
        </div>
    );
};

export default GameConsole;

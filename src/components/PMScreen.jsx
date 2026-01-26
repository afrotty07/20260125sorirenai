import React from 'react';

const PMScreen = ({ pm }) => {
    return (
        <div className="relative flex-1 flex flex-col items-center justify-end overflow-hidden bg-wa-paper p-4">
            {/* Background Decorative Element */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-10 left-10 w-40 h-40 border-8 border-wa-gold rounded-full rotate-45"></div>
                <div className="absolute bottom-20 right-10 w-60 h-60 border-2 border-wa-indigo rotate-12"></div>
            </div>

            {/* PM Name and Era */}
            <div className="absolute top-10 right-10 flex flex-col items-end z-20">
                <span className="bg-wa-indigo text-wa-paper px-3 py-1 text-sm font-bold tracking-tighter mb-2">
                    {pm.era}時代
                </span>
                <h2 className="text-4xl font-black text-wa-black bg-white/50 px-4 py-2 border-r-8 border-wa-black leading-tight">
                    {pm.name}
                </h2>
                <p className="text-wa-red font-bold mt-2 text-sm">
                    ― {pm.personality} ―
                </p>
            </div>

            {/* Main Standing Picture Placeholder */}
            <div className="relative z-10 w-full max-w-md h-3/4 flex items-end justify-center">
                <div className="w-full h-full bg-gradient-to-t from-wa-indigo/20 to-transparent absolute bottom-0"></div>
                <img
                    src={`/assets/pms/pm_${pm.id}.png`}
                    alt={pm.name}
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${pm.name}&backgroundColor=transparent&style=circle`;
                    }}
                    className="w-full h-auto max-h-full object-contain mb-[-10%] transition-transform duration-500 hover:scale-105"
                />
            </div>

            {/* Decorative Floor */}
            <div className="w-full h-8 bg-wa-black border-t-2 border-wa-gold shadow-2xl z-20"></div>
        </div>
    );
};

export default PMScreen;

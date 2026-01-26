import React from 'react';
import { Landmark } from 'lucide-react';

const Header = ({ title }) => {
    return (
        <header className="w-full bg-wa-black text-wa-gold py-4 px-6 flex items-center justify-between border-b-4 border-wa-gold shadow-lg z-10">
            <div className="flex items-center gap-3">
                <Landmark size={28} className="text-wa-gold" />
                <h1 className="text-2xl font-bold tracking-widest uppercase">{title}</h1>
            </div>
            <div className="hidden md:block text-sm italic opacity-80">
                ~ 国会議事録より愛を込めて ~
            </div>
        </header>
    );
};

export default Header;

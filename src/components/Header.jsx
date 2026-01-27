import { Landmark, Volume2, VolumeX } from 'lucide-react';

const Header = ({ title, isMuted, onToggleMute }) => {
    return (
        <header className="w-full bg-wa-black text-wa-gold py-4 px-6 flex items-center justify-between border-b-4 border-wa-gold shadow-lg z-10">
            <div className="flex items-center gap-3">
                <Landmark size={28} className="text-wa-gold" />
                <h1 className="text-2xl font-bold tracking-widest uppercase">{title}</h1>
            </div>

            <div className="flex items-center gap-6">
                <div className="hidden md:block text-sm italic opacity-80">
                    ~ 国会議事録より愛を込めて ~
                </div>
                <button
                    onClick={onToggleMute}
                    className="p-2 hover:bg-wa-gold/10 rounded-full transition-colors border border-wa-gold/30"
                    title={isMuted ? "音楽を再生" : "ミュート"}
                >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
            </div>
        </header>
    );
};

export default Header;

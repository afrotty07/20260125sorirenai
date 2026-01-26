import React from 'react';
import { Users } from 'lucide-react';

const StatusBoard = ({ score }) => {
    // Normalize score to percentage (0-100)
    const percentage = Math.min(Math.max(score, 0), 100);

    return (
        <div className="absolute top-24 left-6 z-30 w-64 bg-wa-paper/90 backdrop-blur-sm border-2 border-wa-gold shadow-md p-3">
            <div className="flex items-center gap-2 mb-2 text-wa-indigo font-bold text-sm border-b border-wa-gold pb-1">
                <Users size={16} />
                <span>議席占有率 (好感度)</span>
            </div>

            <div className="relative w-full h-6 bg-gray-200 border border-wa-black p-0.5">
                <div
                    className="h-full bg-gradient-to-r from-wa-red to-red-400 transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-wa-black mix-blend-difference overflow-visible">
                    {percentage}%
                </div>
            </div>

            <div className="mt-2 text-[10px] text-wa-black/60 italic text-right">
                {percentage >= 50 ? "安定政権の兆し..." : "内閣不信任の予感..."}
            </div>
        </div>
    );
};

export default StatusBoard;

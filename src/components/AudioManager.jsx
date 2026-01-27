import React, { useEffect, useRef } from 'react';
import bgm from '../maou_bgm_piano26.mp3';

const AudioManager = ({ isPlaying, volume = 0.3 }) => {
    const audioRef = useRef(null);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
            if (isPlaying) {
                audioRef.current.play().catch(err => {
                    console.log("Autoplay blocked or audio error:", err);
                });
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, volume]);

    return (
        <audio
            ref={audioRef}
            src={bgm}
            loop
        />
    );
};

export default AudioManager;

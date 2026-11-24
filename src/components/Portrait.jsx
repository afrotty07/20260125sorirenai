import React, { useEffect, useState } from "react";
import { Landmark } from "lucide-react";
import { portraitAtlas, PORTRAIT_MOODS } from "../lib/portraits.js";

export default function Portrait({ pm, className = "", lazy = false, mood }) {
  const [broken, setBroken] = useState(false);
  const [loadedAtlas, setLoadedAtlas] = useState(null);
  const [failedAtlas, setFailedAtlas] = useState(null);
  const atlasPath = mood && portraitAtlas(pm.id);
  const base = import.meta.env.BASE_URL;
  const atlas = atlasPath ? `${base}${atlasPath.slice(1)}` : null;
  const original = `${base}assets/pms/pm_${pm.id}.png`;
  const atlasReady = atlas && loadedAtlas === atlas;
  useEffect(() => {
    setBroken(false);
  }, [pm.id]);

  if (atlas && failedAtlas !== atlas) {
    const expression = PORTRAIT_MOODS[mood] ?? PORTRAIT_MOODS.serious;
    const column = expression.frame % 2;
    const row = Math.floor(expression.frame / 2);
    return (
      <svg
        className={`portrait-art ${className}`}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMin slice"
        role="img"
        aria-label={`${pm.name}：${expression.label}`}
        data-expression={mood}
        data-atlas={atlas}
        data-ready={!!atlasReady}
      >
        <title>
          {pm.name}：{expression.label}
        </title>
        {!atlasReady && (
          <image
            href={original}
            width="100"
            height="100"
            preserveAspectRatio="xMidYMid slice"
          />
        )}
        <image
          className="portrait-frame"
          key={`${atlas}-${mood}`}
          href={atlas}
          x={-100 * column}
          y={-100 * row}
          width="200"
          height="200"
          preserveAspectRatio="none"
          opacity={atlasReady ? 1 : 0}
          onLoad={() => setLoadedAtlas(atlas)}
          onError={() => setFailedAtlas(atlas)}
        />
      </svg>
    );
  }
  return broken ? (
    <div className={`portrait-fallback ${className}`}>
      <Landmark size={48} />
      <span>{pm.name}</span>
    </div>
  ) : (
    <img
      className={className}
      src={original}
      alt={`${pm.name}のイラスト`}
      loading={lazy ? "lazy" : "eager"}
      onError={() => setBroken(true)}
    />
  );
}

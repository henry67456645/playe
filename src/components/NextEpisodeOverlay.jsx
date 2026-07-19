import { useEffect, useState } from "react";

const ACCENT = "#e50914";

export default function NextEpisodeOverlay({
  playerRef,
  nextEpisode,
  onNextEpisode,
  triggerSecondsBeforeEnd = 30,
  autoPlaySeconds = 8,
}) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [countdown, setCountdown] = useState(autoPlaySeconds);

  useEffect(() => {
    setVisible(false);
    setDismissed(false);
    setCountdown(autoPlaySeconds);
  }, [nextEpisode?.seasonNumber, nextEpisode?.episodeNumber, nextEpisode?.name, autoPlaySeconds]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !nextEpisode) return;

    const handleTimeUpdate = () => {
      const remaining = player.duration - player.currentTime;
      if (!dismissed && remaining > 0 && remaining <= triggerSecondsBeforeEnd) {
        setVisible(true);
      }
    };

    player.addEventListener("timeupdate", handleTimeUpdate);
    return () => player.removeEventListener("timeupdate", handleTimeUpdate);
  }, [playerRef, nextEpisode, dismissed, triggerSecondsBeforeEnd]);

  useEffect(() => {
    if (!visible) return;
    if (countdown <= 0) {
      onNextEpisode();
      return;
    }

    const t = setTimeout(() => setCountdown((current) => current - 1), 1000);
    return () => clearTimeout(t);
  }, [visible, countdown, onNextEpisode]);

  if (!visible || !nextEpisode) return null;

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div style={styles.wrap}>
        {nextEpisode.stillPath ? (
          <img src={nextEpisode.stillPath} alt="" style={styles.thumb} />
        ) : null}

        <div style={styles.info}>
          <span style={styles.label}>Next Episode</span>
          <span style={styles.title}>
            {nextEpisode.episodeNumber}. {nextEpisode.name}
          </span>
        </div>

        <button style={styles.playBtn} onClick={onNextEpisode}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M4 2l10 6-10 6V2z" fill="#000" />
          </svg>
          Play ({countdown}s)
        </button>

        <button
          style={styles.dismissBtn}
          onClick={() => {
            setVisible(false);
            setDismissed(true);
          }}
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </>
  );
}

const styles = {
  wrap: {
    position: "absolute",
    bottom: 90,
    right: 24,
    zIndex: 60,
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 14px 10px 10px",
    borderRadius: "10px",
    background: "rgba(20,20,20,0.55)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,0.1)",
    maxWidth: "360px",
    animation: "fadeSlideUp 250ms ease",
  },
  thumb: {
    width: "72px",
    height: "40px",
    borderRadius: "6px",
    objectFit: "cover",
    flexShrink: 0,
  },
  info: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  label: {
    color: "rgba(255,255,255,0.55)",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  title: {
    color: "#fff",
    fontSize: "13px",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  playBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "none",
    background: ACCENT,
    color: "#000",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  dismissBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.5)",
    fontSize: "14px",
    cursor: "pointer",
    padding: "4px",
  },
};

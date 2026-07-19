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
    bottom: 62,
    right: 16,
    zIndex: 80,
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "12px",
    background: "rgba(20,20,20,0.42)",
    backdropFilter: "blur(14px)",
    border: "1px solid rgba(255,255,255,0.14)",
    maxWidth: "320px",
    animation: "fadeSlideUp 250ms ease",
    boxShadow: "0 16px 40px rgba(0,0,0,0.28)",
  },
  thumb: {
    width: "64px",
    height: "36px",
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
    color: "rgba(255,255,255,0.65)",
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  title: {
    color: "#fff",
    fontSize: "12px",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "160px",
  },
  playBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "7px 10px",
    borderRadius: "6px",
    border: "none",
    background: ACCENT,
    color: "#000",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "rgba(255,255,255,0.2)",
    minHeight: "40px",
    whiteSpace: "nowrap",
  },
  dismissBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.6)",
    fontSize: "13px",
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "rgba(255,255,255,0.2)",
    padding: "4px",
    lineHeight: 1,
  },
};

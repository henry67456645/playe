import { useState } from "react";

const ACCENT = "#e50914";

export default function SeasonEpisodeDrawer({
  open,
  onClose,
  seasons,
  currentSeason,
  currentEpisode,
  onSelectEpisode,
}) {
  const [activeSeason, setActiveSeason] = useState(currentSeason);

  if (!open) return null;

  const season = seasons.find((item) => item.seasonNumber === activeSeason) || seasons[0];

  return (
    <>
      <div style={styles.scrim} onClick={onClose} />
      <div style={styles.drawer}>
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>Episodes</h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div style={styles.seasonTabs}>
          {seasons.map((item) => (
            <button
              key={item.seasonNumber}
              onClick={() => setActiveSeason(item.seasonNumber)}
              style={{
                ...styles.seasonTab,
                color: item.seasonNumber === activeSeason ? "#fff" : "rgba(255,255,255,0.5)",
                borderBottom:
                  item.seasonNumber === activeSeason
                    ? `2px solid ${ACCENT}`
                    : "2px solid transparent",
              }}
            >
              Season {item.seasonNumber}
            </button>
          ))}
        </div>

        <div style={styles.episodeList}>
          {season?.episodes.map((ep) => {
            const active =
              activeSeason === currentSeason && ep.episodeNumber === currentEpisode;
            const disabled = ep.available === false;

            return (
              <button
                key={ep.episodeNumber}
                disabled={disabled}
                onClick={() => onSelectEpisode(activeSeason, ep.episodeNumber)}
                style={{
                  ...styles.episodeRow,
                  background: active ? "rgba(229,9,20,0.12)" : "transparent",
                  opacity: disabled ? 0.4 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                <div style={styles.epThumbWrap}>
                  {ep.stillPath ? (
                    <img src={ep.stillPath} alt="" style={styles.epThumb} />
                  ) : (
                    <div style={styles.epThumbFallback}>E{ep.episodeNumber}</div>
                  )}
                  {active ? (
                    <div style={styles.epPlayingBadge}>
                      <svg width="14" height="14" viewBox="0 0 14 14">
                        <path d="M3 2l9 5-9 5V2z" fill={ACCENT} />
                      </svg>
                    </div>
                  ) : null}
                </div>
                <div style={styles.epInfo}>
                  <span style={styles.epTitle}>
                    {ep.episodeNumber}. {ep.name}
                  </span>
                  {ep.runtime ? <span style={styles.epRuntime}>{ep.runtime} min</span> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

const styles = {
  scrim: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    zIndex: 70,
  },
  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: "min(420px, 100vw)",
    background: "#141414",
    zIndex: 80,
    display: "flex",
    flexDirection: "column",
    boxShadow: "-20px 0 60px rgba(0,0,0,0.5)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  headerTitle: { color: "#fff", fontSize: "17px", fontWeight: 600, margin: 0 },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(255,255,255,0.6)",
    fontSize: "18px",
    cursor: "pointer",
    padding: "4px 8px",
  },
  seasonTabs: {
    display: "flex",
    gap: "4px",
    padding: "0 16px",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
    overflowX: "auto",
  },
  seasonTab: {
    background: "transparent",
    border: "none",
    padding: "12px 12px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  episodeList: {
    flex: 1,
    overflowY: "auto",
    padding: "8px 12px",
  },
  episodeRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    padding: "10px",
    border: "none",
    borderRadius: "8px",
    textAlign: "left",
  },
  epThumbWrap: {
    position: "relative",
    width: "96px",
    height: "56px",
    flexShrink: 0,
    borderRadius: "6px",
    overflow: "hidden",
    background: "#000",
  },
  epThumb: { width: "100%", height: "100%", objectFit: "cover" },
  epThumbFallback: {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "rgba(255,255,255,0.4)",
    fontSize: "12px",
  },
  epPlayingBadge: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0,0,0,0.5)",
  },
  epInfo: { display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 },
  epTitle: {
    color: "#fff",
    fontSize: "13px",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  epRuntime: { color: "rgba(255,255,255,0.45)", fontSize: "12px" },
};

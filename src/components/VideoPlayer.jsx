import { useRef, useEffect, useState } from "react";

import { MediaPlayer, MediaProvider, Track, useMediaState } from "@vidstack/react";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
} from "@vidstack/react/player/layouts/default";
import { getSubtitleLabel, getSubtitleType } from "../utils/subtitles";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import NextEpisodeOverlay from "./NextEpisodeOverlay";
import SeasonEpisodeDrawer from "./SeasonEpisodeDrawer";
import { resolveStreamUrl } from "../utils/streamUtils";

const ACCENT = "#e50914";

const SERVER_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="3" y="14" width="18" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="7" cy="7" r="1" fill="currentColor" />
    <circle cx="7" cy="17" r="1" fill="currentColor" />
    <path d="M10 7H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M10 17H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function VideoPlayer({
  tmdbId,
  contentType, // 'movie' or 'tv'
  stream,
  streams,
  subtitles = [],
  title,
  poster,
  onQualityChange,
  series,
  currentSeason,
  currentEpisode,
  onSelectEpisode,
  nextEpisode,
  onNextEpisode,
  onPlayerError,
}) {
  const playerRef = useRef(null);
  const errorNotifiedRef = useRef(false);
  const [showBackdrop, setShowBackdrop] = useState(true);
  const [sourceMenuOpen, setSourceMenuOpen] = useState(false);
  const [episodeDrawerOpen, setEpisodeDrawerOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.innerWidth < 768 : false);
  const currentTime = useMediaState("currentTime", playerRef);
  const duration = useMediaState("duration", playerRef);
  const showNextEpisodeButton = !!nextEpisode && duration > 0 && currentTime / duration >= 0.92;
  const [isLargeDesktop, setIsLargeDesktop] = useState(() => typeof window !== "undefined" ? window.innerWidth >= 1080 : false);
  const [adLibraryReady, setAdLibraryReady] = useState(false);

  const handleNextEpisode = () => {
    if (!nextEpisode) return;
    if (onNextEpisode) {
      onNextEpisode();
      return;
    }
    onSelectEpisode?.(nextEpisode.seasonNumber, nextEpisode.episodeNumber);
  };

  // Stores playback position across a quality switch so it resumes cleanly
  const resumeTime = useRef(0);
  const adTriggeredRef = useRef(false);

  function triggerAd() {
    if (adTriggeredRef.current) return;
    adTriggeredRef.current = true;

    const runAd = () => {
      if (window.aclib?.runPop) {
        window.aclib.runPop({ zoneId: "11754994" });
        return true;
      }
      return false;
    };

    if (!runAd()) {
      window.setTimeout(() => {
        if (adTriggeredRef.current) {
          runAd();
        }
      }, 1500);
    }
  }

  function initializeAdcash() {
    if (typeof window === "undefined") return;

    const attemptInit = () => {
      try {
        if (window.aclib && typeof window.aclib.runPop === "function") {
          window.aclib.runPop({ zoneId: "11754994" });
          return;
        }
      } catch (error) {
        console.error("Adcash initialization failed", error);
      }

      window.setTimeout(attemptInit, 500);
    };

    attemptInit();
  }

  function loadAdcashLibrary() {
    if (typeof window === "undefined") return;
    if (window.__adcashLibraryLoaded) return;

    const libraryUrl =
      import.meta.env.VITE_ADCASH_LIBRARY_URL ||
      `${import.meta.env.VITE_API_BASE_URL || window.location.origin}/adcash/adblock?v=3&format=js`;

    const existingScript = document.getElementById("adcash-library");
    if (existingScript) {
      window.__adcashLibraryLoaded = true;
      setAdLibraryReady(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "adcash-library";
    script.src = libraryUrl;
    script.async = true;
    script.onload = () => {
      window.__adcashLibraryLoaded = true;
      setAdLibraryReady(true);
    };
    script.onerror = () => {
      console.error("Unable to load Adcash library", libraryUrl);
    };

    document.head.appendChild(script);
  }

  const firstGroupQuality = Array.isArray(stream?.qualities) ? stream.qualities[0] : null;
  const streamUrl = resolveStreamUrl(
    stream || firstGroupQuality || null,
    import.meta.env.VITE_PROXY_BASE_URL || undefined
  );
  const streamQuality =
    stream?.resolution || stream?.quality || firstGroupQuality?.resolution || firstGroupQuality?.quality || "Auto";
  const streamLanguage = stream?.language || "Unknown";
  const streamLanguageTitle = stream?.languageTitle || stream?.title || streamLanguage;

  useEffect(() => {
    if (!streamUrl) {
      notifyPlayerError();
    }
  }, [streamUrl]);

  function changeQuality(item, languageGroup) {
    const targetLanguage = languageGroup?.language || streamLanguage;
    const targetTitle = languageGroup?.title || languageGroup?.language || streamLanguageTitle;

    if (item.quality === streamQuality && targetLanguage === streamLanguage) {
      setSourceMenuOpen(false);
      return;
    }
    if (playerRef.current) {
      resumeTime.current = playerRef.current.currentTime;
    }
    onQualityChange({
      ...item,
      language: targetLanguage,
      languageTitle: targetTitle,
    });
    setSourceMenuOpen(false);
  }

  function changeLanguage(languageGroup) {
    if (languageGroup.language === streamLanguage) {
      setSourceMenuOpen(false);
      return;
    }
    const quality = languageGroup.qualities?.[0];
    if (!quality) return;

    if (playerRef.current) {
      resumeTime.current = playerRef.current.currentTime;
    }

    onQualityChange({
      ...quality,
      language: languageGroup.language,
      languageTitle: languageGroup.title || languageGroup.language,
    });
    setSourceMenuOpen(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAdcashLibrary();
      window.setTimeout(() => {
        if (window.aclib?.runPop) {
          initializeAdcash();
        }
      }, 1000);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!adLibraryReady) return;

    if (window.aclib?.runPop) {
      initializeAdcash();
    }
  }, [adLibraryReady]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsLargeDesktop(window.innerWidth >= 1080);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const notifyPlayerError = () => {
    if (typeof window === "undefined" || errorNotifiedRef.current) return;
    errorNotifiedRef.current = true;

    window.parent.postMessage(
      {
        type: "PLAYER_ERROR",
        provider: "moonflix",
        tmdbId: tmdbId || null,
      },
      "*"
    );
    onPlayerError?.();
  };

  useEffect(() => {
    adTriggeredRef.current = false;

    const player = playerRef.current;
    if (!player) return;

    setShowBackdrop(true);
    setIsPlaying(!player.paused);

    function handleMediaReady() {
      if (resumeTime.current > 0) {
        player.currentTime = resumeTime.current;
        player.play();
        resumeTime.current = 0;
      }
    }

    function handlePlaybackStarted() {
      setShowBackdrop(false);
      setIsPlaying(true);
      if (adLibraryReady) {
        initializeAdcash();
      }
      triggerAd();
      // record a single play event per session
      try {
        if (!playerRef.playRecorded) {
          playerRef.playRecorded = true;
          const payload = {
            tmdbId: tmdbId || undefined,
            type: contentType || undefined,
            title,
            season: currentSeason || undefined,
            episode: currentEpisode || undefined,
          };
          if (payload.tmdbId) {
            fetch('/play', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(() => {});
          }
        }
      } catch (e) {
        // ignore
      }
    }

    function handlePlaybackStopped() {
      setShowBackdrop(true);
      setIsPlaying(false);
    }

    function handleVideoError() {
      console.error('Video playback error detected');
      notifyPlayerError();
    }

    player.addEventListener("loadedmetadata", handleMediaReady);
    player.addEventListener("play", handlePlaybackStarted);
    player.addEventListener("pause", handlePlaybackStopped);
    player.addEventListener("ended", handlePlaybackStopped);
    player.addEventListener("error", handleVideoError);

    return () => {
      player.removeEventListener("loadedmetadata", handleMediaReady);
      player.removeEventListener("play", handlePlaybackStarted);
      player.removeEventListener("pause", handlePlaybackStopped);
      player.removeEventListener("ended", handlePlaybackStopped);
      player.removeEventListener("error", handleVideoError);
    };
  }, [stream]);

  useEffect(() => {
    if (!sourceMenuOpen) return;
    function handleClick(e) {
      if (!e.target.closest("[data-source-menu]")) setSourceMenuOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [sourceMenuOpen]);

  const languageGroups = Array.isArray(streams)
    ? streams
        .filter((item) => item.available && item.qualities?.length > 0)
        .map((item) => {
          const normalizedItem = {
            ...item,
            qualities: item.qualities.map((quality) => ({
              ...quality,
              quality: quality.resolution || quality.quality || "Auto",
              url: resolveStreamUrl(quality, import.meta.env.VITE_PROXY_BASE_URL || undefined),
            })),
          };

          if (normalizedItem.language === "original") {
            const baseTitle = title || normalizedItem.title || "Original Language";
            normalizedItem.title = `${baseTitle} Original`;
          }

          if (normalizedItem.language === "hdghar") {
            const baseTitle = title || normalizedItem.title || "Movie / Series";
            normalizedItem.title = `${baseTitle} Hindi + English`;
          }

          return normalizedItem;
        })
    : [];

  const activeLanguageGroup = languageGroups.find((item) => item.language === streamLanguage) || languageGroups[0];
  const topControlsStyle = {
    ...styles.topControls,
    top: isMobile ? 72 : 24,
    left: isMobile ? 12 : "auto",
    right: isMobile ? 12 : 24,
    width: isMobile ? "calc(100% - 24px)" : "auto",
    maxWidth: isMobile ? "calc(100% - 24px)" : isLargeDesktop ? "680px" : "calc(100% - 48px)",
    flexWrap: isMobile ? "wrap" : "nowrap",
    justifyContent: isMobile ? "flex-start" : "flex-end",
    alignItems: "center",
    gap: isLargeDesktop ? 12 : 8,
    padding: 0,
    minWidth: 0,
  };
  const sourceWrapStyle = {
    ...styles.sourceWrap,
    flex: isMobile ? "0 0 auto" : "0 0 auto",
    minWidth: isMobile ? "160px" : 0,
    maxWidth: isMobile ? "none" : isLargeDesktop ? "340px" : "320px",
  };
  const sourceMenuStyle = {
    ...styles.sourceMenu,
    left: isMobile ? 0 : "auto",
    right: 0,
    width: isMobile ? "calc(100vw - 24px)" : "min(420px, calc(100vw - 48px))",
    maxWidth: isMobile ? "calc(100vw - 24px)" : "min(420px, calc(100vw - 48px))",
  };

  return (
    <div style={styles.wrap}>
      <div
        aria-hidden="true"
        style={{
          ...styles.backdrop,
          display: showBackdrop ? "block" : "none",
          opacity: showBackdrop ? 1 : 0,
        }}
      >
        {poster ? (
          <img src={poster} alt="" style={styles.backdropImg} />
        ) : null}
      </div>

      <MediaPlayer
        ref={playerRef}
        key={streamUrl}
        src={streamUrl}
        title={title}
        poster={poster}
        playsInline
        style={styles.player}
      >
        <MediaProvider>
          {Array.isArray(subtitles) && subtitles.length > 0
            ? subtitles.map((sub, index) => (
                <Track
                  key={sub.id || index}
                  src={sub.url}
                  label={getSubtitleLabel(sub, index)}
                  lang={sub.lang || sub.language || "und"}
                  kind="subtitles"
                  type={getSubtitleType(sub.url)}
                  default={false}
                />
              ))
            : null}
        </MediaProvider>
        <DefaultVideoLayout icons={defaultLayoutIcons} colorScheme="dark" />
      </MediaPlayer>

      <button
        type="button"
        onClick={() => {
          const player = playerRef.current;
          if (!player) return;
          if (player.paused) {
            player.play();
          } else {
            player.pause();
          }
        }}
        style={{
          ...styles.playPauseBtn,
          opacity: isPlaying ? 0 : 1,
          pointerEvents: isPlaying ? "none" : "auto",
        }}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div style={topControlsStyle} data-source-menu>
        {languageGroups.length > 0 && (
          <div style={sourceWrapStyle}>
            <button
              type="button"
              style={styles.sourceToggle}
              onClick={() => setSourceMenuOpen((v) => !v)}
            >
              <span style={styles.menuLabel}>
                <span style={styles.menuIcon}>{SERVER_ICON}</span>
                <span>{activeLanguageGroup?.title || activeLanguageGroup?.language || "Servers / Languages"}</span>
              </span>
              <span style={styles.menuCount}>{languageGroups.length} source{languageGroups.length === 1 ? "" : "s"}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                style={{
                  transform: sourceMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 150ms ease",
                }}
              >
                <path
                  d="M2 4l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {sourceMenuOpen && (
              <div id="source-menu" style={sourceMenuStyle} role="menu">
                {languageGroups.map((item) => {
                  const active = item.language === streamLanguage;
                  return (
                    <div key={item.language} style={styles.sourceGroup}>
                      <button
                        type="button"
                        onClick={() => item.available && changeLanguage(item)}
                        style={{
                          ...styles.sourceGroupButton,
                          ...(active ? styles.sourceGroupButtonActive : {}),
                          opacity: item.available ? 1 : 0.45,
                        }}
                      >
                        <span style={styles.groupTitle}>{item.title || item.language}</span>
                        <span style={styles.groupMeta}>
                          {item.available ? `${item.qualities.length} quality${item.qualities.length === 1 ? "" : "ies"}` : item.message || "N/A"}
                        </span>
                      </button>

                      {item.available && item.qualities?.length > 0 ? (
                        <div style={styles.qualityList}>
                          {item.qualities.map((quality) => {
                            const activeQuality = quality.quality === streamQuality && item.language === streamLanguage;
                            return (
                              <button
                                key={`${item.language}-${quality.quality}`}
                                type="button"
                                onClick={() => changeQuality(quality, item)}
                                style={{
                                  ...styles.qualityChip,
                                  ...(activeQuality ? styles.qualityChipActive : {}),
                                }}
                              >
                                <span>{quality.quality}</span>
                                {activeQuality ? <span style={styles.checkMark}>✓</span> : null}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {series?.seasons?.length && !(isMobile && sourceMenuOpen) ? (
          <button style={styles.episodeToggle} onClick={() => setEpisodeDrawerOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 14 14" style={{ marginRight: "6px" }}>
              <path
                d="M2 3.5h10M4 1.5v11M10 1.5v11"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
              />
            </svg>
            Episodes
          </button>
        ) : null}

        {nextEpisode && showNextEpisodeButton ? (
          <button
            style={styles.nextEpisodeBtn}
            onClick={() => {
              setEpisodeDrawerOpen(false);
              handleNextEpisode();
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" style={{ marginRight: "6px" }}>
              <path d="M8 5l8 7-8 7V5z" fill="currentColor" />
            </svg>
            Next Episode
          </button>
        ) : null}
      </div>

      {series?.seasons?.length ? (
        <SeasonEpisodeDrawer
          open={episodeDrawerOpen}
          onClose={() => setEpisodeDrawerOpen(false)}
          seasons={series.seasons}
          currentSeason={currentSeason}
          currentEpisode={currentEpisode}
          onSelectEpisode={(targetSeason, targetEpisode) => {
            setEpisodeDrawerOpen(false);
            onSelectEpisode?.(targetSeason, targetEpisode);
          }}
        />
      ) : null}

      {nextEpisode ? (
        <NextEpisodeOverlay
          playerRef={playerRef}
          nextEpisode={nextEpisode}
          triggerProgress={0.92}
          onNextEpisode={() => {
            setEpisodeDrawerOpen(false);
            onNextEpisode?.();
          }}
        />
      ) : null}
    </div>
  );
}

const styles = {
  wrap: {
    width: "100%",
    height: "100dvh",
    minHeight: "100vh",
    background: "#000",
    position: "relative",
    overflow: "hidden",
  },
  backdrop: {
    position: "absolute",
    inset: 0,
    transition: "opacity 300ms ease",
    pointerEvents: "none",
    zIndex: 2,
    background:
      "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.85) 100%)",
  },
  backdropImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
  },
  player: {
    width: "100%",
    height: "100%",
    position: "relative",
    zIndex: 2,
  },
  playPauseBtn: {
    position: "absolute",
    inset: "50% auto auto 50%",
    transform: "translate(-50%, -50%)",
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(229, 9, 20, 0.95)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "rgba(255,255,255,0.2)",
    boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
    zIndex: 5,
    transition: "opacity 180ms ease",
  },
  topControls: {
    position: "absolute",
    top: 12,
    right: 12,
    left: "auto",
    zIndex: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
    pointerEvents: "auto",
    touchAction: "manipulation",
    width: "auto",
    maxWidth: "none",
    minWidth: 0,
  },
  sourceWrap: {
    position: "relative",
    flex: "0 0 auto",
    minWidth: "auto",
    maxWidth: "220px",
    pointerEvents: "auto",
  },
  sourceToggle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "7px 10px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(8px)",
    color: "#fff",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "rgba(255,255,255,0.2)",
    minWidth: 0,
    width: "auto",
    maxWidth: "220px",
    justifyContent: "space-between",
    flexWrap: "nowrap",
    lineHeight: 1.2,
    overflow: "hidden",
  },
  menuLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    minWidth: 0,
    overflow: "hidden",
  },
  menuIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    flexShrink: 0,
  },
  menuCount: {
    color: "rgba(255,255,255,0.75)",
    fontSize: "10px",
    fontWeight: 500,
    marginLeft: "auto",
  },
  episodeToggle: {
    display: "flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(0,0,0,0.55)",
    backdropFilter: "blur(10px)",
    color: "#fff",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "rgba(255,255,255,0.2)",
    flex: "0 0 auto",
    minWidth: "auto",
    whiteSpace: "nowrap",
    maxWidth: "140px",
    justifyContent: "center",
    marginTop: "0",
    minHeight: "44px",
  },
  nextEpisodeBtn: {
    display: "flex",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: "10px",
    border: "1px solid rgba(229,9,20,0.24)",
    background: "rgba(229,9,20,0.12)",
    backdropFilter: "blur(10px)",
    color: "#fff",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "rgba(255,255,255,0.2)",
    flex: "0 0 auto",
    minWidth: "auto",
    whiteSpace: "nowrap",
    maxWidth: "180px",
    justifyContent: "center",
    marginTop: "0",
    minHeight: "44px",
  },
  sourceMenu: {
    position: "absolute",
    top: "calc(100% + 8px)",
    left: 0,
    right: 0,
    maxWidth: "min(420px, calc(100vw - 48px))",
    maxHeight: "min(420px, 70vh)",
    overflowY: "auto",
    background: "rgba(12,12,12,0.97)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "8px",
    boxShadow: "0 16px 42px rgba(0,0,0,0.45)",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    zIndex: 30,
  },
  sourceMenuMobile: {
    width: "calc(100vw - 24px)",
    maxWidth: "calc(100vw - 24px)",
    left: "12px",
    right: "12px",
  },
  sourceGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "8px",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  sourceGroupButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "7px 10px",
    borderRadius: "8px",
    border: "none",
    background: "transparent",
    color: "#fff",
    fontSize: "12px",
    fontWeight: 600,
    textAlign: "left",
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "rgba(255,255,255,0.2)",
    gap: "8px",
    minHeight: "44px",
  },
  sourceGroupButtonActive: {
    background: "rgba(229,9,20,0.12)",
    color: ACCENT,
  },
  groupTitle: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  groupMeta: {
    color: "rgba(255,255,255,0.75)",
    fontSize: "10px",
    fontWeight: 500,
    whiteSpace: "normal",
  },
  qualityList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  qualityChip: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    padding: "5px 8px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 500,
    cursor: "pointer",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "rgba(255,255,255,0.2)",
    minHeight: "36px",
  },
  qualityChipActive: {
    borderColor: "rgba(229,9,20,0.35)",
    background: "rgba(229,9,20,0.12)",
    color: ACCENT,
  },
  checkMark: {
    fontSize: "11px",
    fontWeight: 700,
  },
};
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getEpisode, getSeries, getSubtitles } from "../services/api";
import VideoPlayer from "../components/VideoPlayer";
import { getInitialStream } from "../utils/streamUtils";

function Spinner() {
  return (
    <div style={styles.spinnerWrap}>
      <style>{`
        @keyframes movie-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={styles.spinner} />
      <p style={styles.spinnerText}>Loading episode…</p>
    </div>
  );
}

function NotFoundCard() {
  return (
    <div style={styles.notFoundWrap}>
      <div style={styles.card}>
        <div style={styles.icon}>📺</div>
        <h2 style={styles.cardTitle}>Episode not found</h2>
        <p style={styles.cardText}>
          We couldn't find this episode. it may be not available, or the link might be broken.
        </p>
        <button style={styles.cardButton} onClick={() => window.history.back()}>
          Go back
        </button>
      </div>
    </div>
  );
}

function findNextEpisode(seasons = [], currentSeason, currentEpisode) {
  if (!Array.isArray(seasons) || !seasons.length) return null;

  const seasonEntries = [...seasons]
    .map((season) => ({
      seasonNumber: Number(season.seasonNumber),
      episodes: [...(season.episodes || [])].sort(
        (a, b) => Number(a.episodeNumber) - Number(b.episodeNumber)
      ),
    }))
    .sort((a, b) => a.seasonNumber - b.seasonNumber);

  const currentSeasonIndex = seasonEntries.findIndex(
    (season) => season.seasonNumber === Number(currentSeason)
  );

  if (currentSeasonIndex >= 0) {
    const currentSeasonEpisodes = seasonEntries[currentSeasonIndex].episodes;
    const currentEpisodeIndex = currentSeasonEpisodes.findIndex(
      (episode) => Number(episode.episodeNumber) === Number(currentEpisode)
    );

    if (currentEpisodeIndex >= 0) {
      const nextEpisode = currentSeasonEpisodes[currentEpisodeIndex + 1];
      if (nextEpisode) {
        return {
          seasonNumber: seasonEntries[currentSeasonIndex].seasonNumber,
          episodeNumber: Number(nextEpisode.episodeNumber),
          name: nextEpisode.name,
          stillPath: nextEpisode.stillPath || null,
          runtime: nextEpisode.runtime || null,
          available: (nextEpisode.streamCount || 0) > 0,
        };
      }
    }
  }

  for (let index = (currentSeasonIndex >= 0 ? currentSeasonIndex + 1 : 0); index < seasonEntries.length; index += 1) {
    const season = seasonEntries[index];
    const firstEpisode = season.episodes[0];
    if (firstEpisode) {
      return {
        seasonNumber: season.seasonNumber,
        episodeNumber: Number(firstEpisode.episodeNumber),
        name: firstEpisode.name,
        stillPath: firstEpisode.stillPath || null,
        runtime: firstEpisode.runtime || null,
        available: (firstEpisode.streamCount || 0) > 0,
      };
    }
  }

  return null;
}

export default function EpisodePage() {
  const navigate = useNavigate();
  const { tmdbId, season, episode } = useParams();

  const [ep, setEp] = useState(null);
  const [series, setSeries] = useState(null);
  const [selectedStream, setSelectedStream] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadEpisode() {
      setLoading(true);
      try {
        const episodeData = await getEpisode(tmdbId, season, episode);
        const seriesData = await getSeries(tmdbId);

        if (cancelled) return;

        setEp(episodeData);
        setSeries(seriesData);
        setSelectedStream(getInitialStream(episodeData.streams));

        let loadedSubtitles = Array.isArray(episodeData.subtitles) && episodeData.subtitles.length > 0
          ? episodeData.subtitles
          : [];

        try {
          const subtitleData = await getSubtitles('tv', tmdbId, season, episode);
          loadedSubtitles = subtitleData?.subtitles?.length > 0 ? subtitleData.subtitles : loadedSubtitles;
        } catch (err) {
          console.warn('Unable to load episode subtitles', err);
        }

        setSubtitles(loadedSubtitles);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setEp(null);
          setSeries(null);
          setSelectedStream(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadEpisode();
    return () => {
      cancelled = true;
    };
  }, [tmdbId, season, episode]);

  useEffect(() => {
    let cancelled = false;

    async function refreshSubtitles() {
      if (!ep || !selectedStream) return;

      let loadedSubtitles = Array.isArray(ep.subtitles) && ep.subtitles.length > 0
        ? ep.subtitles
        : [];

      try {
        const subtitleData = await getSubtitles('tv', tmdbId, season, episode);
        if (cancelled) return;
        loadedSubtitles = subtitleData?.subtitles?.length > 0 ? subtitleData.subtitles : loadedSubtitles;
      } catch (subtitleErr) {
        console.warn('Unable to refresh episode subtitles', subtitleErr);
      }

      if (!cancelled) setSubtitles(loadedSubtitles);
    }

    refreshSubtitles();
    return () => {
      cancelled = true;
    };
  }, [ep, selectedStream, tmdbId, season, episode]);

  const currentSeason = Number(season);
  const currentEpisodeNumber = Number(episode);
  const nextEpisode = findNextEpisode(series?.seasons || [], currentSeason, currentEpisodeNumber);

  function handleSelectEpisode(targetSeason, targetEpisode) {
    navigate(`/tv/${tmdbId}/${targetSeason}/${targetEpisode}`);
  }

  function handleNextEpisode() {
    if (nextEpisode) {
      navigate(`/tv/${tmdbId}/${nextEpisode.seasonNumber}/${nextEpisode.episodeNumber}`);
    }
  }

  if (loading) return <Spinner />;

  if (!ep || !selectedStream) return <NotFoundCard />;

  return (
    <VideoPlayer
      tmdbId={tmdbId}
      contentType="tv"
      title={`${ep.title} - S${ep.season}E${ep.episode} ${ep.episodeName || ""}`}
      poster={ep.backdropUrl || ep.backdropPath || ep.posterUrl || ep.posterPath || ep.stillPath}
      stream={selectedStream}
      streams={ep.streams}
      subtitles={subtitles}
      onQualityChange={setSelectedStream}
      series={series}
      currentSeason={currentSeason}
      currentEpisode={currentEpisodeNumber}
      onSelectEpisode={handleSelectEpisode}
      nextEpisode={nextEpisode}
      onNextEpisode={handleNextEpisode}
    />
  );
}

const styles = {
  spinnerWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "16px",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid rgba(255,255,255,0.15)",
    borderTopColor: "#e50914",
    borderRadius: "50%",
    animation: "movie-spin 0.8s linear infinite",
  },
  spinnerText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: "14px",
    letterSpacing: "0.02em",
  },
  notFoundWrap: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    padding: "24px",
  },
  card: {
    background: "linear-gradient(180deg, #1a1a1a 0%, #101010 100%)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "16px",
    padding: "48px 40px",
    maxWidth: "420px",
    width: "100%",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  icon: {
    fontSize: "40px",
    marginBottom: "16px",
  },
  cardTitle: {
    color: "#fff",
    fontSize: "22px",
    fontWeight: 600,
    margin: "0 0 12px",
  },
  cardText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: "14px",
    lineHeight: 1.6,
    margin: "0 0 28px",
  },
  cardButton: {
    background: "#e50914",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 24px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
};
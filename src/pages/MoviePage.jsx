import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getMovie, getSubtitles } from "../services/api";
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
      <img
        src="https://player.moonflix.site/favicon.png"
        alt="Loading"
        style={styles.spinnerImage}
      />
      <p style={styles.spinnerBrand}>Moonflix Player</p>
      <p style={styles.spinnerText}>Loading movie…</p>
    </div>
  );
}

function NotFoundCard() {
  return (
    <div style={styles.notFoundWrap}>
      <div style={styles.card}>
        <div style={styles.icon}>🎬</div>
        <h2 style={styles.cardTitle}>Movie not found</h2>
        <p style={styles.cardText}>
          Movie not yet released or it may be not available, or the link might be broken.
        </p>
        <button style={styles.cardButton} onClick={() => window.history.back()}>
          Go back
        </button>
      </div>
    </div>
  );
}

export default function MoviePage() {
  const { tmdbId } = useParams();

  const [movie, setMovie] = useState(null);
  const [selectedStream, setSelectedStream] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadMovie() {
      setLoading(true);
      try {
        const data = await getMovie(tmdbId);
        if (cancelled) return;

        setMovie(data);
        setSelectedStream(getInitialStream(data.streams));

        let loadedSubtitles = Array.isArray(data.subtitles) && data.subtitles.length > 0
          ? data.subtitles
          : [];

        try {
          const subtitleData = await getSubtitles('movie', tmdbId);
          if (cancelled) return;
          loadedSubtitles = subtitleData?.subtitles?.length > 0 ? subtitleData.subtitles : loadedSubtitles;
        } catch (subtitleErr) {
          console.warn('Unable to load movie subtitles', subtitleErr);
        }

        if (!cancelled) setSubtitles(loadedSubtitles);
      } catch (err) {
        console.error(err);
        if (!cancelled) setMovie(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMovie();
    return () => {
      cancelled = true;
    };
  }, [tmdbId]);

  useEffect(() => {
    let cancelled = false;

    async function refreshSubtitles() {
      if (!movie || !selectedStream) return;

      let loadedSubtitles = Array.isArray(movie.subtitles) && movie.subtitles.length > 0
        ? movie.subtitles
        : [];

      try {
        const subtitleData = await getSubtitles('movie', tmdbId);
        if (cancelled) return;
        loadedSubtitles = subtitleData?.subtitles?.length > 0 ? subtitleData.subtitles : loadedSubtitles;
      } catch (subtitleErr) {
        console.warn('Unable to refresh movie subtitles', subtitleErr);
      }

      if (!cancelled) setSubtitles(loadedSubtitles);
    }

    refreshSubtitles();
    return () => {
      cancelled = true;
    };
  }, [movie, selectedStream, tmdbId]);

  if (loading) return <Spinner />;

  if (!movie || !selectedStream) return <NotFoundCard />;

  return (
    <VideoPlayer
      tmdbId={tmdbId}
      contentType="movie"
      title={movie.title}
      poster={movie.backdropUrl || movie.backdropPath || movie.posterUrl || movie.posterPath}
      stream={selectedStream}
      streams={movie.streams}
      subtitles={subtitles}
      onQualityChange={setSelectedStream}
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
    gap: "12px", // compact spacing
  },
  spinnerImage: {
    width: "48px",
    height: "48px",
    animation: "movie-spin 0.8s linear infinite",
    borderRadius: "8px", // optional, adjust to match logo shape
  },
  spinnerBrand: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: 600,
    margin: 0,
    letterSpacing: "0.02em",
  },
  spinnerText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: "14px",
    letterSpacing: "0.02em",
    margin: 0,
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
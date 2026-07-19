import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getMovie, getEpisode, getSubtitles } from "../services/api";
import VideoPlayer from "../components/VideoPlayer";
import { getInitialStream } from "../utils/streamUtils";

export default function EmbedPage() {
  const { type, tmdbId, season, episode } = useParams();
  const [item, setItem] = useState(null);
  const [selectedStream, setSelectedStream] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      try {
        if (type === "tv") {
          const data = await getEpisode(tmdbId, season, episode);
          setItem(data);
          setSelectedStream(getInitialStream(data.streams));

          let loadedSubtitles = Array.isArray(data.subtitles) && data.subtitles.length > 0
            ? data.subtitles
            : [];

          try {
            const subtitleData = await getSubtitles('tv', tmdbId, season, episode);
            loadedSubtitles = subtitleData?.subtitles?.length > 0 ? subtitleData.subtitles : loadedSubtitles;
          } catch (err) {
            console.warn('Unable to load embed tv subtitles', err);
          }

          setSubtitles(loadedSubtitles);
        } else {
          const data = await getMovie(tmdbId);
          setItem(data);
          setSelectedStream(getInitialStream(data.streams));

          let loadedSubtitles = Array.isArray(data.subtitles) && data.subtitles.length > 0
            ? data.subtitles
            : [];

          try {
            const subtitleData = await getSubtitles('movie', tmdbId);
            loadedSubtitles = subtitleData?.subtitles?.length > 0 ? subtitleData.subtitles : loadedSubtitles;
          } catch (err) {
            console.warn('Unable to load embed movie subtitles', err);
          }

          setSubtitles(loadedSubtitles);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [type, tmdbId, season, episode]);

  useEffect(() => {
    let cancelled = false;

    async function refreshSubtitles() {
      if (!item || !selectedStream) return;

      const mediaType = type === 'tv' ? 'tv' : 'movie';
      let loadedSubtitles = Array.isArray(item.subtitles) && item.subtitles.length > 0
        ? item.subtitles
        : [];

      try {
        const subtitleData = await getSubtitles(mediaType, tmdbId, season, episode);
        if (cancelled) return;
        loadedSubtitles = subtitleData?.subtitles?.length > 0 ? subtitleData.subtitles : loadedSubtitles;
      } catch (subtitleErr) {
        console.warn('Unable to refresh embed subtitles', subtitleErr);
      }

      if (!cancelled) setSubtitles(loadedSubtitles);
    }

    refreshSubtitles();
    return () => {
      cancelled = true;
    };
  }, [item, selectedStream, type, tmdbId, season, episode]);

  if (loading) return <div className="embed-loading">Loading player…</div>;

  if (!item || !selectedStream) return <div className="embed-loading">Content not available</div>;

  const title = type === "tv"
    ? `${item.title} - S${item.season}E${item.episode} ${item.episodeName || ""}`.trim()
    : item.title;

  return (
    <div className="embed-page">
      <VideoPlayer
        title={title}
        poster={item.backdropUrl || item.backdropPath || item.posterUrl || item.posterPath || item.stillPath}
        stream={selectedStream}
        streams={item.streams}
        subtitles={subtitles}
        onQualityChange={setSelectedStream}
      />
    </div>
  );
}

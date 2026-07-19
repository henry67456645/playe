import { buildSeasonEpisodeList } from "../utils/tmdbSeriesUtils";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const HDGHAR_API = import.meta.env.VITE_HDGHAR_API_BASE_URL || "http://localhost:8000";
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "9a2a99e496124cd84cce4985effde483";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

async function fetchJson(url, errorMessage) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(errorMessage);
  }
  return res.json();
}

async function fetchTmdbJson(path, errorMessage) {
  const url = `${TMDB_BASE_URL}${path}${path.includes("?") ? "&" : "?"}api_key=${TMDB_API_KEY}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(errorMessage);
  }
  return res.json();
}

function normalizeHdgharStreams(streams) {
  if (!Array.isArray(streams)) return [];
  return streams.map((item) => ({
    ...item,
    quality: item.resolution || item.quality || "Auto",
    url: item.proxy_url || item.raw_url || item.rawUrl || item.url || "",
  }));
}

function mergeHdgharStreams(mainPayload, hdgharPayload) {
  if (!hdgharPayload || !Array.isArray(hdgharPayload.streams)) return mainPayload;

  const hdgharGroup = {
    language: "hdghar",
    title: "HDGHAR",
    available: Array.isArray(hdgharPayload.streams) && hdgharPayload.streams.length > 0,
    server: "HDGHAR",
    qualities: normalizeHdgharStreams(hdgharPayload.streams),
  };

  const mainSubtitles = Array.isArray(mainPayload.subtitles) ? mainPayload.subtitles : [];
  const hdgharSubtitles = Array.isArray(hdgharPayload.subtitles) ? hdgharPayload.subtitles : [];
  const mergedSubtitles = [...mainSubtitles];
  const subtitleKeys = new Set(
    mainSubtitles.map((sub) => `${sub.url || sub.file || ''}|${sub.lang || sub.language || ''}|${sub.id || ''}`)
  );

  hdgharSubtitles.forEach((sub) => {
    const key = `${sub.url || sub.file || ''}|${sub.lang || sub.language || ''}|${sub.id || ''}`;
    if (!subtitleKeys.has(key)) {
      subtitleKeys.add(key);
      mergedSubtitles.push(sub);
    }
  });

  return {
    ...mainPayload,
    streams: Array.isArray(mainPayload.streams)
      ? [...mainPayload.streams, hdgharGroup]
      : [hdgharGroup],
    subtitles: mergedSubtitles,
  };
}

export async function getMovie(tmdbId) {
  const mainPromise = fetchJson(`${API}/movie/${tmdbId}`, "Movie not found");
  const hdgharPromise = fetchJson(`${HDGHAR_API}/movie/${tmdbId}`, "HDGHAR movie not found");

  const [mainResult, hdgharResult] = await Promise.allSettled([mainPromise, hdgharPromise]);

  if (mainResult.status === "rejected" && hdgharResult.status === "rejected") {
    throw new Error("Movie not found");
  }

  const mainPayload = mainResult.status === "fulfilled" ? mainResult.value : { streams: [] };
  const hdgharPayload = hdgharResult.status === "fulfilled" ? hdgharResult.value : null;

  return mergeHdgharStreams(mainPayload, hdgharPayload);
}

export async function getEpisode(tmdbId, season, episode) {
  const mainPromise = fetchJson(`${API}/tv/${tmdbId}/${season}/${episode}`, "Episode not found");
  const hdgharPromise = fetchJson(`${HDGHAR_API}/tv/${tmdbId}/${season}/${episode}`, "HDGHAR episode not found");

  const [mainResult, hdgharResult] = await Promise.allSettled([mainPromise, hdgharPromise]);

  if (mainResult.status === "rejected" && hdgharResult.status === "rejected") {
    throw new Error("Episode not found");
  }

  const mainPayload = mainResult.status === "fulfilled" ? mainResult.value : { streams: [] };
  const hdgharPayload = hdgharResult.status === "fulfilled" ? hdgharResult.value : null;

  return mergeHdgharStreams(mainPayload, hdgharPayload);
}

export async function getSubtitles(mediaType, tmdbId, season, episode) {
  const endpoint = mediaType === "tv"
    ? `${API}/subtitles/tv/${tmdbId}/${season}/${episode}`
    : `${API}/subtitles/movie/${tmdbId}`;

  return fetchJson(endpoint, "Subtitles not found");
}

export async function getSeries(tmdbId) {
  const seriesDetails = await fetchTmdbJson(`/tv/${tmdbId}`, "Series not found");

  const seasonRequests = (Array.isArray(seriesDetails?.seasons) ? seriesDetails.seasons : [])
    .filter((season) => Number(season?.season_number ?? 0) > 0)
    .map(async (season) => {
      const seasonDetails = await fetchTmdbJson(
        `/tv/${tmdbId}/season/${season.season_number}`,
        `Season ${season.season_number} not found`
      );

      return {
        season_number: season.season_number,
        name: season.name,
        episodes: Array.isArray(seasonDetails?.episodes) ? seasonDetails.episodes : [],
      };
    });

  const seasons = await Promise.all(seasonRequests);

  return {
    ...seriesDetails,
    seasons: buildSeasonEpisodeList({ seasons }),
  };
}

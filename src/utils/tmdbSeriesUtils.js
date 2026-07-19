const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

export function buildSeasonEpisodeList(tmdbSeries) {
  if (!tmdbSeries || !Array.isArray(tmdbSeries.seasons)) return [];

  return tmdbSeries.seasons
    .filter((season) => Number(season?.season_number ?? season?.seasonNumber ?? 0) > 0)
    .map((season) => {
      const seasonNumber = Number(season?.season_number ?? season?.seasonNumber ?? 0);
      const episodes = Array.isArray(season?.episodes)
        ? season.episodes
            .map((episode) => ({
              episodeNumber: Number(episode?.episode_number ?? episode?.episodeNumber ?? episode?.number ?? 0),
              name: episode?.name || episode?.title || `Episode ${episode?.episode_number ?? episode?.episodeNumber ?? episode?.number ?? ''}`,
              stillPath: episode?.still_path ? `${TMDB_IMAGE_BASE}${episode.still_path}` : episode?.stillPath || null,
              runtime: episode?.runtime || episode?.episodeRuntime || null,
              overview: episode?.overview || '',
              airDate: episode?.air_date || episode?.airDate || null,
              available: true,
            }))
            .filter((episode) => episode.episodeNumber > 0)
            .sort((a, b) => a.episodeNumber - b.episodeNumber)
        : [];

      return {
        seasonNumber,
        name: season?.name || `Season ${seasonNumber}`,
        episodes,
      };
    })
    .sort((a, b) => a.seasonNumber - b.seasonNumber);
}

export function findNextEpisodeForSelection(seasons = [], currentSeason, currentEpisode) {
  if (!Array.isArray(seasons) || !seasons.length) return null;

  const normalizedSeasons = seasons
    .map((season) => ({
      seasonNumber: Number(season.seasonNumber ?? season.season_number ?? 0),
      episodes: Array.isArray(season.episodes)
        ? season.episodes
            .map((episode) => ({
              ...episode,
              episodeNumber: Number(episode.episodeNumber ?? episode.episode_number ?? episode.number ?? 0),
            }))
            .filter((episode) => episode.episodeNumber > 0)
            .sort((a, b) => a.episodeNumber - b.episodeNumber)
        : [],
    }))
    .filter((season) => season.seasonNumber > 0);

  const currentSeasonIndex = normalizedSeasons.findIndex((season) => season.seasonNumber === Number(currentSeason));

  if (currentSeasonIndex >= 0) {
    const currentSeasonEpisodes = normalizedSeasons[currentSeasonIndex].episodes;
    const currentEpisodeIndex = currentSeasonEpisodes.findIndex((episode) => episode.episodeNumber === Number(currentEpisode));

    if (currentEpisodeIndex >= 0) {
      const nextEpisode = currentSeasonEpisodes[currentEpisodeIndex + 1];
      if (nextEpisode) {
        return {
          seasonNumber: normalizedSeasons[currentSeasonIndex].seasonNumber,
          episodeNumber: Number(nextEpisode.episodeNumber),
          name: nextEpisode.name,
          stillPath: nextEpisode.stillPath || null,
          runtime: nextEpisode.runtime || null,
          available: nextEpisode.available !== false,
        };
      }
    }
  }

  for (let index = (currentSeasonIndex >= 0 ? currentSeasonIndex + 1 : 0); index < normalizedSeasons.length; index += 1) {
    const season = normalizedSeasons[index];
    const firstEpisode = season.episodes[0];
    if (firstEpisode) {
      return {
        seasonNumber: season.seasonNumber,
        episodeNumber: Number(firstEpisode.episodeNumber),
        name: firstEpisode.name,
        stillPath: firstEpisode.stillPath || null,
        runtime: firstEpisode.runtime || null,
        available: firstEpisode.available !== false,
      };
    }
  }

  return null;
}

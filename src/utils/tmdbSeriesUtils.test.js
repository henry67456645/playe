import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSeasonEpisodeList, findNextEpisodeForSelection } from './tmdbSeriesUtils.js';

test('buildSeasonEpisodeList converts TMDB season payloads into drawer-ready seasons', () => {
  const payload = {
    seasons: [
      {
        season_number: 1,
        name: 'Season 1',
        episodes: [
          { episode_number: 1, name: 'Pilot', still_path: '/pilot.jpg', runtime: 42 },
          { episode_number: 2, name: 'Second', still_path: '/second.jpg', runtime: 43 },
        ],
      },
      {
        season_number: 2,
        name: 'Season 2',
        episodes: [{ episode_number: 1, name: 'New Start', still_path: '/start.jpg', runtime: 41 }],
      },
    ],
  };

  const seasons = buildSeasonEpisodeList(payload);

  assert.equal(seasons.length, 2);
  assert.equal(seasons[0].seasonNumber, 1);
  assert.equal(seasons[0].episodes[0].name, 'Pilot');
  assert.equal(seasons[1].episodes[0].episodeNumber, 1);
});

test('findNextEpisodeForSelection returns the following episode inside the same season', () => {
  const seasons = [
    {
      seasonNumber: 1,
      episodes: [
        { episodeNumber: 1, name: 'Pilot', stillPath: '/pilot.jpg' },
        { episodeNumber: 2, name: 'Second', stillPath: '/second.jpg' },
      ],
    },
    {
      seasonNumber: 2,
      episodes: [{ episodeNumber: 1, name: 'New Start', stillPath: '/start.jpg' }],
    },
  ];

  const nextEpisode = findNextEpisodeForSelection(seasons, 1, 1);

  assert.ok(nextEpisode);
  assert.equal(nextEpisode.episodeNumber, 2);
  assert.equal(nextEpisode.seasonNumber, 1);
});

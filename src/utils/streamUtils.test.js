import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProxyUrl, resolveStreamUrl } from './streamUtils.js';

test('buildProxyUrl creates a runtime proxy URL from a raw URL', () => {
  const rawUrl = 'https://cdn.example.com/video.mp4';
  const url = buildProxyUrl(rawUrl, 'https://worker.example.com');

  assert.equal(url, 'https://worker.example.com/?url=https%3A%2F%2Fcdn.example.com%2Fvideo.mp4&referer=https%3A%2F%2Fthemoviebox.org%2F&origin=https%3A%2F%2Fthemoviebox.org%2F');
});

test('resolveStreamUrl prefers runtime-built URLs from raw_url', () => {
  const item = { raw_url: 'https://cdn.example.com/video.mp4' };
  const url = resolveStreamUrl(item, 'https://worker.example.com');

  assert.equal(url, 'https://worker.example.com/?url=https%3A%2F%2Fcdn.example.com%2Fvideo.mp4&referer=https%3A%2F%2Fthemoviebox.org%2F&origin=https%3A%2F%2Fthemoviebox.org%2F');
});

test('resolveStreamUrl preserves an existing proxy_url', () => {
  const item = { proxy_url: 'https://hdghar.example.com/proxy/video.mp4', raw_url: 'https://cdn.example.com/video.mp4' };
  const url = resolveStreamUrl(item, 'https://worker.example.com');

  assert.equal(url, 'https://hdghar.example.com/proxy/video.mp4');
});

test('resolveStreamUrl uses the direct url when no raw_url or proxy_url is present', () => {
  const item = { url: 'https://hdghar.example.com/video.m3u8' };
  const url = resolveStreamUrl(item, 'https://worker.example.com');

  assert.equal(url, 'https://hdghar.example.com/video.m3u8');
});

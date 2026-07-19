const DEFAULT_PROXY_BASE = 'https://dark-violet-2f28.satishsaw168.workers.dev';
const DEFAULT_REFERER = 'https://themoviebox.org/';

export function buildProxyUrl(cdnUrl, workerBase = DEFAULT_PROXY_BASE) {
  if (!cdnUrl) return '';

  const base = workerBase || DEFAULT_PROXY_BASE;
  const encodedUrl = encodeURIComponent(cdnUrl);
  const encodedReferer = encodeURIComponent(DEFAULT_REFERER);
  const encodedOrigin = encodeURIComponent(DEFAULT_REFERER);

  return `${base}/?url=${encodedUrl}&referer=${encodedReferer}&origin=${encodedOrigin}`;
}

export function resolveStreamUrl(item, workerBase = DEFAULT_PROXY_BASE) {
  if (!item) return '';

  const existingProxyUrl = item.proxy_url || item.proxyUrl || '';
  if (existingProxyUrl) return existingProxyUrl;

  const rawUrl = item.raw_url || item.rawUrl || '';
  if (rawUrl) return buildProxyUrl(rawUrl, workerBase);

  return item.url || '';
}

export function getInitialStream(streams) {
  if (!Array.isArray(streams) || streams.length === 0) return null;

  const availableStream = streams.find((item) => item.available && item.qualities?.length > 0) || streams[0];
  if (!availableStream || !Array.isArray(availableStream.qualities) || availableStream.qualities.length === 0) {
    return null;
  }

  const firstQuality = availableStream.qualities[0];
  return {
    ...firstQuality,
    language: availableStream.language,
    languageTitle: availableStream.title || availableStream.language,
  };
}

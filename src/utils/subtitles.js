export const languageNames = {
  eng: "English",
  hin: "Hindi",
  spa: "Spanish",
  fra: "French",
  deu: "German",
  ger: "German",
  ita: "Italian",
  por: "Portuguese",
  rus: "Russian",
  jpn: "Japanese",
  kor: "Korean",
  zho: "Chinese",
  chi: "Chinese",
  ara: "Arabic",
  tur: "Turkish",
  nld: "Dutch",
  swe: "Swedish",
  dan: "Danish",
  fin: "Finnish",
  nor: "Norwegian",
  ell: "Greek",
  bul: "Bulgarian",
  cze: "Czech",
  per: "Persian",
  pol: "Polish",
  ukr: "Ukrainian",
  vie: "Vietnamese",
  jpn: "Japanese",
  zho: "Chinese",
  rus: "Russian",
};

export function getSubtitleType(src) {
  if (typeof src !== "string") return "srt";
  const lowerSrc = src.toLowerCase();
  if (lowerSrc.includes(".vtt") || lowerSrc.includes("type=vtt") || lowerSrc.includes("format=vtt")) {
    return "vtt";
  }
  if (lowerSrc.includes(".srt") || lowerSrc.includes("type=srt") || lowerSrc.includes("format=srt")) {
    return "srt";
  }
  return "srt";
}

export function getSubtitleLabel(sub, index) {
  const code = sub.lang || sub.language || sub.languageCode || "und";
  const name = languageNames[code] || code.toUpperCase();
  return `${name} ${index + 1}`;
}

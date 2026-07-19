import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
import {
  BookOpenText,
  Code2,
  Film,
  Globe2,
  MonitorPlay,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Tv,
  Zap,
  Copy,
  Check,
  ChevronRight,
} from "lucide-react";

const movieDemoUrl = "/movie/687163";
const seriesDemoUrl = "/tv/93405/1/3";
const tmdbImageBase = "https://image.tmdb.org/t/p/w500";

function getSiteOrigin() {
  const configuredOrigin = import.meta.env.VITE_PUBLIC_URL || import.meta.env.VITE_SITE_URL || "";
  if (configuredOrigin) return configuredOrigin.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://localhost:5173";
}

function buildPublicUrl(path) {
  return `${getSiteOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}

const features = [
  {
    icon: Zap,
    title: "Instant embed",
    text: "One URL. Full-screen player. Zero configuration required to launch.",
  },
  {
    icon: ShieldCheck,
    title: "Production-ready",
    text: "Quality switching, poster support, and a Netflix-grade UI — already built in.",
  },
  {
    icon: Globe2,
    title: "Cross-site friendly",
    text: "Works on any blog, marketplace, or content platform without extra setup.",
  },
];

const endpoints = [
  {
    method: "GET",
    endpoint: "/movie/:tmdbId",
    description: "Movie metadata and streaming sources",
    example: buildPublicUrl("/movie/786892"),
  },
  {
    method: "GET",
    endpoint: "/tv/:tmdbId/:season/:episode",
    description: "Episode metadata and stream links",
    example: buildPublicUrl("/tv/124364/1/3"),
  },
];

function PosterGrid({ items = [] }) {
  const cards = items.length ? [...items, ...items.slice(0, 6)] : [];

  return (
    <div className="poster-grid-wrap" aria-hidden="true">
      <div className="poster-grid">
        {cards.map((item, i) => {
          const href = item.mediaType === "tv" ? `/tv/${item.id}/1/1` : `/movie/${item.id}`;
          const label = item.mediaType === "tv" ? "Series" : "Movie";
          return (
            <Link key={`${item.id}-${i}`} to={href} className="poster-card">
              <img
                className="poster-image"
                src={item.posterPath ? `${tmdbImageBase}${item.posterPath}` : "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=500&q=80"}
                alt={item.title}
                loading="lazy"
              />
              <div className="poster-overlay">
                <span className="poster-pill">{label}</span>
                <h3 className="poster-title">{item.title}</h3>
                <p className="poster-subtitle">{item.releaseDate ? item.releaseDate.slice(0, 4) : "Trending now"}</p>
              </div>
            </Link>
          );
        })}
      </div>
      <div className="poster-fade-left" />
      <div className="poster-fade-right" />
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className="copy-btn" onClick={handleCopy} title="Copy code">
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function AnimatedCounter({ target, suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1800;
          const steps = 60;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current = Math.min(current + increment, target);
            setCount(Math.floor(current));
            if (current >= target) clearInterval(timer);
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [trendingItems, setTrendingItems] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [demoType, setDemoType] = useState("movie");
  const [demoTmdbId, setDemoTmdbId] = useState("687163");
  const [demoSeason, setDemoSeason] = useState("1");
  const [demoEpisode, setDemoEpisode] = useState("1");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTrending() {
      try {
        const res = await fetch(`${API_BASE}/trending/all?limit=12`);
        if (!res.ok) throw new Error("Unable to load trending content");
        const data = await res.json();
        if (!cancelled) setTrendingItems(data);
      } catch (err) {
        console.warn("Unable to load trending content", err);
        if (!cancelled) setTrendingItems([]);
      } finally {
        if (!cancelled) setLoadingTrending(false);
      }
    }

    loadTrending();
    return () => {
      cancelled = true;
    };
  }, []);

  const siteOrigin = getSiteOrigin();
  const movieCode = `<iframe\n  src="${buildPublicUrl("/movie/687163")}"\n  width="100%" height="640"\n  frameborder="0" allowfullscreen\n></iframe>`;

  const tvCode = `<iframe\n  src="${buildPublicUrl("/tv/93405/1/1")}"\n  width="100%" height="640"\n  frameborder="0" allowfullscreen\n></iframe>`;

  const demoPlayerUrl = demoType === "movie"
    ? buildPublicUrl(`/movie/${demoTmdbId}`)
    : buildPublicUrl(`/tv/${demoTmdbId}/${demoSeason}/${demoEpisode}`);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --void: #080810;
          --surface: #0d0d1a;
          --surface2: #12121f;
          --border: rgba(108,99,255,0.15);
          --border-bright: rgba(108,99,255,0.35);
          --indigo: #6C63FF;
          --violet: #A78BFA;
          --glow: rgba(108,99,255,0.4);
          --text: #E2E8F0;
          --muted: #94A3B8;
          --dim: #4A5568;
          --font-display: 'Manrope', sans-serif;
          --font-body: 'Inter', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
        }

        html { scroll-behavior: smooth; }

        body {
          background: var(--void);
          color: var(--text);
          font-family: var(--font-body);
          line-height: 1.6;
          overflow-x: hidden;
        }

        /* ── HEADER ── */
        .mf-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2.5rem;
          height: 64px;
          transition: background 0.3s, border-color 0.3s;
          background: ${scrolled ? "rgba(8,8,16,0.92)" : "transparent"};
          backdrop-filter: blur(12px);
          border-bottom: 1px solid ${scrolled ? "var(--border)" : "transparent"};
        }

        .mf-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.25rem;
          letter-spacing: -0.02em;
          color: var(--text);
          text-decoration: none;
        }

        .mf-brand-icon {
          width: 90px; height: 90px;
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }

        .mf-brand-logo {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        .mf-nav {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .mf-nav a {
          color: var(--muted);
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: color 0.2s;
        }

        .mf-nav a:hover { color: var(--text); }

        .mf-nav .nav-cta {
          padding: 0.4rem 1rem;
          border-radius: 6px;
          background: rgba(108,99,255,0.15);
          border: 1px solid var(--border-bright);
          color: var(--violet);
          transition: all 0.2s;
        }

        .mf-nav .nav-cta:hover {
          background: rgba(108,99,255,0.25);
          color: var(--text);
        }

        /* ── HERO ── */
        .mf-hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 6rem 2rem 4rem;
          overflow: hidden;
        }

        .hero-bg-glow {
          position: absolute;
          top: 0; left: 50%; transform: translateX(-50%);
          width: 900px; height: 600px;
          background: radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.2) 0%, transparent 70%);
          pointer-events: none;
        }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.9rem;
          border-radius: 99px;
          border: 1px solid var(--border-bright);
          background: rgba(108,99,255,0.08);
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--violet);
          margin-bottom: 2rem;
          animation: fadeUp 0.6s ease both;
        }

        .hero-h1 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(2.5rem, 6vw, 5rem);
          line-height: 1.05;
          letter-spacing: -0.03em;
          max-width: 820px;
          margin: 0 auto 1.5rem;
          animation: fadeUp 0.6s 0.1s ease both;
        }

        .hero-h1 em {
          font-style: normal;
          background: linear-gradient(90deg, var(--indigo), var(--violet));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-sub {
          font-size: 1.125rem;
          color: var(--muted);
          max-width: 520px;
          margin: 0 auto 2.5rem;
          animation: fadeUp 0.6s 0.2s ease both;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          justify-content: center;
          animation: fadeUp 0.6s 0.3s ease both;
          margin-bottom: 3.5rem;
        }

        .btn-prime {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.75rem 1.75rem;
          border-radius: 8px;
          background: linear-gradient(135deg, var(--indigo), var(--violet));
          color: #fff;
          font-weight: 600;
          font-size: 0.9375rem;
          text-decoration: none;
          border: none;
          cursor: pointer;
          box-shadow: 0 0 32px rgba(108,99,255,0.35);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-prime:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 48px rgba(108,99,255,0.5);
        }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.75rem 1.75rem;
          border-radius: 8px;
          background: transparent;
          color: var(--text);
          font-weight: 600;
          font-size: 0.9375rem;
          text-decoration: none;
          border: 1px solid var(--border-bright);
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-ghost:hover {
          background: rgba(108,99,255,0.08);
          border-color: var(--indigo);
        }

        /* ── STATS ── */
        .hero-stats {
          display: flex;
          gap: 2px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--border);
          animation: fadeUp 0.6s 0.4s ease both;
          background: var(--border);
        }

        .stat-block {
          flex: 1;
          background: var(--surface);
          padding: 1.25rem 2rem;
          text-align: center;
        }

        .stat-num {
          display: block;
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 1.875rem;
          color: var(--text);
          letter-spacing: -0.03em;
        }

        .stat-num span { color: var(--violet); }

        .stat-label {
          display: block;
          font-size: 0.8125rem;
          color: var(--muted);
          margin-top: 0.15rem;
        }

        /* ── POSTER GRID ── */
        .poster-grid-wrap {
          position: relative;
          width: 100%;
          overflow: hidden;
          padding: 2rem 0 0.5rem;
          margin-top: 1rem;
        }

        .poster-grid {
          display: flex;
          gap: 14px;
          animation: driftLeft 34s linear infinite;
          width: max-content;
          padding: 0 1rem;
        }

        @keyframes driftLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .poster-card {
          width: 150px;
          height: 225px;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.1);
          flex-shrink: 0;
          overflow: hidden;
          position: relative;
          box-shadow: 0 22px 55px rgba(0,0,0,0.35);
          animation: cardFloat 6s ease-in-out infinite alternate;
          background: var(--surface);
          text-decoration: none;
        }

        .poster-card-skeleton {
          background: linear-gradient(135deg, rgba(108,99,255,0.18), rgba(255,255,255,0.04));
          border: 1px solid rgba(255,255,255,0.08);
          animation: pulseSkeleton 1.2s ease-in-out infinite alternate;
        }

        @keyframes pulseSkeleton {
          from { transform: scale(1); opacity: 0.7; }
          to { transform: scale(1.02); opacity: 1; }
        }

        @keyframes cardFloat {
          0% { transform: translateY(0px) scale(1); }
          100% { transform: translateY(-8px) scale(1.01); }
        }

        .poster-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .poster-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(8,8,16,0.1) 0%, rgba(8,8,16,0.92) 100%);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          gap: 0.3rem;
        }

        .poster-pill {
          display: inline-flex;
          align-self: flex-start;
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.1);
          color: #f8fafc;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .poster-title {
          font-family: var(--font-display);
          font-size: 0.9rem;
          font-weight: 700;
          color: rgba(255,255,255,0.95);
          line-height: 1.2;
        }

        .poster-subtitle {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.72);
        }

        .poster-fade-left,
        .poster-fade-right {
          position: absolute;
          top: 0; bottom: 0;
          width: 130px;
          z-index: 2;
          pointer-events: none;
        }

        .poster-fade-left {
          left: 0;
          background: linear-gradient(to right, var(--void), transparent);
        }

        .poster-fade-right {
          right: 0;
          background: linear-gradient(to left, var(--void), transparent);
        }

        /* ── SECTIONS ── */
        .mf-section {
          padding: 6rem 2rem;
          max-width: 1100px;
          margin: 0 auto;
        }

        .section-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--violet);
          margin-bottom: 1rem;
        }

        .section-h2 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(1.75rem, 3.5vw, 2.75rem);
          letter-spacing: -0.025em;
          line-height: 1.1;
          margin-bottom: 3.5rem;
          max-width: 600px;
        }

        /* ── FEATURE CARDS ── */
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5px;
          background: var(--border);
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--border);
        }

        .feature-card {
          background: var(--surface);
          padding: 2.5rem 2rem;
          position: relative;
          overflow: hidden;
          transition: background 0.25s;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--indigo), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .feature-card:hover { background: var(--surface2); }
        .feature-card:hover::before { opacity: 1; }

        .feature-icon {
          width: 44px; height: 44px;
          border-radius: 10px;
          border: 1px solid var(--border-bright);
          background: rgba(108,99,255,0.08);
          display: flex; align-items: center; justify-content: center;
          color: var(--violet);
          margin-bottom: 1.25rem;
        }

        .feature-h3 {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.0625rem;
          margin-bottom: 0.5rem;
          color: var(--text);
        }

        .feature-p {
          font-size: 0.9rem;
          color: var(--muted);
          line-height: 1.65;
        }

        /* ── CODE CARDS ── */
        .code-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }

        .code-card {
          border-radius: 12px;
          border: 1px solid var(--border);
          overflow: hidden;
          background: var(--surface);
        }

        .code-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid var(--border);
        }

        .code-card-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text);
        }

        .code-card-title svg { color: var(--violet); }

        .code-body {
          padding: 1.25rem;
        }

        .code-body pre {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          line-height: 1.7;
          color: #C4B5FD;
          white-space: pre;
          overflow-x: auto;
        }

        .copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 500;
          font-family: var(--font-body);
          padding: 0.3rem 0.7rem;
          border-radius: 5px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .copy-btn:hover {
          color: var(--violet);
          border-color: var(--border-bright);
        }

        /* ── DEMO CARDS ── */
        .demo-player-shell {
          display: grid;
          gap: 0.8rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .demo-player-controls {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 0.7rem;
          flex-wrap: wrap;
          padding: 0 0.2rem;
        }

        .demo-player-tabs {
          display: inline-flex;
          gap: 0.35rem;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          padding: 5px;
          flex-wrap: wrap;
        }

        .demo-player-tab {
          border: none;
          background: transparent;
          color: var(--muted);
          font-weight: 600;
          padding: 0.6rem 0.8rem;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.82rem;
        }

        .demo-player-tab.active,
        .demo-player-tab:hover {
          color: var(--text);
          background: rgba(108,99,255,0.16);
        }

        .demo-player-inputs {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, auto));
          gap: 0.6rem;
          align-items: end;
          flex: 1;
        }

        .demo-player-input {
          display: grid;
          gap: 0.35rem;
          font-size: 0.8rem;
          color: var(--muted);
        }

        .demo-player-input span {
          display: block;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.6);
          font-size: 0.7rem;
        }

        .demo-player-input input {
          width: 100%;
          min-width: 80px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          color: #fff;
          padding: 0.7rem 0.75rem;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }

        .demo-player-input input:focus {
          border-color: rgba(108,99,255,0.55);
          background: rgba(255,255,255,0.08);
        }

        .demo-player-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.6rem 0.8rem;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 999px;
          background: rgba(255,255,255,0.04);
          color: #fff;
          font-weight: 600;
          white-space: nowrap;
          font-size: 0.82rem;
        }

        .demo-player-frame {
          border-radius: 24px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
          background: #05050d;
          box-shadow: 0 40px 120px rgba(0,0,0,0.35);
        }

        .demo-player-frame iframe {
          width: 100%;
          min-height: 320px;
          border: none;
          display: block;
          background: #000;
        }

        .demo-player-url-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.75rem 0.95rem;
          background: rgba(255,255,255,0.03);
          border-top: 1px solid rgba(255,255,255,0.08);
        }

        .demo-player-url-bar span {
          color: var(--muted);
          font-size: 0.8rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .demo-player-url-bar .copy-btn {
          padding: 0.45rem 0.75rem;
          font-size: 0.75rem;
        }

        .demo-card-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text);
        }

        .demo-card-label svg { color: var(--violet); }

        .demo-iframe-wrap {
          position: relative;
          background: linear-gradient(135deg, rgba(108,99,255,0.18), rgba(0,0,0,0.86));
          height: 240px;
          overflow: hidden;
        }

        .demo-iframe-wrap::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top right, rgba(255,255,255,0.14), transparent 48%);
          pointer-events: none;
        }

        .demo-iframe-wrap iframe {
          width: 100%;
          height: 100%;
          border: none;
          display: block;
          opacity: 0.9;
          transform: scale(1.02);
        }

        .demo-screen-overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 1rem;
          pointer-events: none;
          background: linear-gradient(180deg, rgba(8,8,16,0.15) 0%, rgba(8,8,16,0.7) 100%);
        }

        .demo-chip {
          align-self: flex-start;
          padding: 0.35rem 0.65rem;
          border-radius: 999px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.16);
          color: #f8fafc;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .demo-screen-meta {
          max-width: 280px;
        }

        .demo-screen-meta h3 {
          font-family: var(--font-display);
          font-size: 1.05rem;
          margin-bottom: 0.3rem;
          color: #fff;
        }

        .demo-screen-meta p {
          color: rgba(255,255,255,0.78);
          font-size: 0.82rem;
        }

        .demo-link-row {
          padding: 0.875rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .demo-open-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--violet);
          text-decoration: none;
          transition: color 0.2s;
        }

        .demo-open-link:hover { color: var(--text); }

        /* ── API TABLE ── */
        .api-table-wrap {
          border-radius: 12px;
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .api-table {
          width: 100%;
          border-collapse: collapse;
        }

        .api-table th {
          background: var(--surface);
          text-align: left;
          padding: 0.875rem 1.25rem;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--dim);
          border-bottom: 1px solid var(--border);
        }

        .api-table td {
          padding: 1rem 1.25rem;
          font-size: 0.875rem;
          color: var(--muted);
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }

        .api-table tr:last-child td { border-bottom: none; }

        .api-table tr:hover td { background: rgba(108,99,255,0.04); }

        .method-badge {
          display: inline-block;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          font-weight: 600;
          background: rgba(34,197,94,0.12);
          color: #4ADE80;
          border: 1px solid rgba(34,197,94,0.2);
          margin-right: 0.5rem;
        }

        .endpoint-code {
          font-family: var(--font-mono);
          font-size: 0.8125rem;
          color: var(--violet);
        }

        .example-code {
          font-family: var(--font-mono);
          font-size: 0.775rem;
          color: var(--dim);
        }

        /* ── FOOTER / CTA ── */
        .mf-cta-section {
          max-width: 1100px;
          margin: 0 auto 5rem;
          padding: 0 2rem;
        }

        .cta-block {
          border-radius: 16px;
          border: 1px solid var(--border-bright);
          background: linear-gradient(135deg, rgba(108,99,255,0.08) 0%, rgba(167,139,250,0.05) 100%);
          padding: 4rem 3rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .cta-block::before {
          content: '';
          position: absolute;
          top: -60px; left: 50%; transform: translateX(-50%);
          width: 400px; height: 200px;
          background: radial-gradient(ellipse, rgba(108,99,255,0.2) 0%, transparent 70%);
          pointer-events: none;
        }

        .cta-h2 {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: clamp(1.75rem, 3vw, 2.5rem);
          letter-spacing: -0.025em;
          margin-bottom: 1rem;
        }

        .cta-sub {
          color: var(--muted);
          margin-bottom: 2rem;
          max-width: 400px;
          margin-left: auto; margin-right: auto;
        }

        .mf-footer {
          border-top: 1px solid var(--border);
          padding: 2rem 2.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8125rem;
          color: var(--dim);
        }

        .mf-footer-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-display);
          font-weight: 700;
          color: var(--muted);
          text-decoration: none;
        }

        /* ── DIVIDER ── */
        .section-divider {
          border: none;
          border-top: 1px solid var(--border);
          max-width: 1100px;
          margin: 0 auto;
        }

        /* ── ANIMATIONS ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .mf-nav { display: none; }
          .feature-grid { grid-template-columns: 1fr; }
          .code-grid { grid-template-columns: 1fr; }
          .demo-grid { grid-template-columns: 1fr; }
          .hero-stats { flex-direction: column; gap: 1px; }
          .mf-footer { flex-direction: column; gap: 0.75rem; text-align: center; }
          .poster-card { width: 132px; height: 200px; }
          .mf-hero { padding: 6rem 1.25rem 3rem; }
          .mf-section { padding: 4.5rem 1.25rem; }
          .cta-block { padding: 3rem 1.25rem; }
          .demo-player-controls { flex-direction: column; align-items: stretch; }
          .demo-player-tabs { justify-content: center; }
          .demo-player-inputs { grid-template-columns: 1fr 1fr; }
          .demo-player-frame iframe { min-height: 320px; }
        }

        @media (max-width: 480px) {
          .demo-player-inputs { grid-template-columns: 1fr; }
          .demo-player-tab { padding: 0.65rem 0.85rem; font-size: 0.85rem; }
          .demo-player-frame iframe { min-height: 280px; }
          .demo-player-url-bar { flex-direction: column; align-items: flex-start; }
        }
      `}</style>

      <div style={{ background: "var(--void)", minHeight: "100vh" }}>

        {/* HEADER */}
        <header className={`mf-header${scrolled ? " scrolled" : ""}`}>
          <a href="#" className="mf-brand" aria-label="Moonflix">
            <div className="mf-brand-icon">
              <img
                className="mf-brand-logo"
                src="https://moonflix.site/lovable-uploads/bffb51a3-45e8-4440-9ab1-94f7b01c1195.png"
                alt=""
              />
            </div>
          </a>
          <nav className="mf-nav">
            <a href="#features">Features</a>
            <a href="#embed">Embed</a>
            <a href="#demo">Demo</a>
            <a href="#api">API</a>
            <Link to={movieDemoUrl} className="nav-cta">Open Player →</Link>
          </nav>
        </header>

        {/* HERO */}
        <section className="mf-hero">
          <div className="hero-bg-glow" />

          <div className="hero-eyebrow">
            <Sparkles size={12} />
            Streaming embeds · 100K+ titles · Zero config
          </div>

          <h1 className="hero-h1">
            The fastest way to embed <em>cinematic streaming</em> anywhere.
          </h1>

          <p className="hero-sub">
            Drop in a single iframe URL and launch a full-screen, Netflix-grade player
            for movies and TV shows — no backend work required.
          </p>

          <div className="hero-actions">
            <a className="btn-prime" href="#demo">
              <PlayCircle size={16} />
              See live demo
            </a>
            <a className="btn-ghost" href="#embed">
              <Code2 size={16} />
              View embed code
            </a>
          </div>

          <div className="hero-stats">
            <div className="stat-block">
              <span className="stat-num"><AnimatedCounter target={100} suffix="K+" /></span>
              <span className="stat-label">Movies</span>
            </div>
            <div className="stat-block">
              <span className="stat-num"><AnimatedCounter target={70} suffix="K+" /></span>
              <span className="stat-label">TV Shows</span>
            </div>
            <div className="stat-block">
              <span className="stat-num"><AnimatedCounter target={5} suffix="K+" /></span>
              <span className="stat-label">Anime</span>
            </div>
            <div className="stat-block">
              <span className="stat-num"><AnimatedCounter target={13} suffix="+" /></span>
              <span className="stat-label">Sources</span>
            </div>
          </div>
        </section>

        {/* SCROLLING POSTER ROW */}
        {!loadingTrending && trendingItems.length > 0 ? (
          <PosterGrid items={trendingItems} />
        ) : (
          <div className="poster-grid-wrap">
            <div className="poster-grid">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="poster-card poster-card-skeleton" />
              ))}
            </div>
          </div>
        )}

        <hr className="section-divider" style={{ marginTop: "3rem" }} />

        {/* FEATURES */}
        <section id="features" className="mf-section">
          <div className="section-eyebrow">
            <Zap size={13} />
            Why Moonflix
          </div>
          <h2 className="section-h2">Built to feel premium from the first play.</h2>
          <div className="feature-grid">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="feature-card">
                  <div className="feature-icon"><Icon size={18} /></div>
                  <h3 className="feature-h3">{f.title}</h3>
                  <p className="feature-p">{f.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <hr className="section-divider" />

        {/* EMBED */}
        <section id="embed" className="mf-section">
          <div className="section-eyebrow">
            <Code2 size={13} />
            Copy-paste integration
          </div>
          <h2 className="section-h2">Embed on any site in under 60 seconds.</h2>
          <div className="code-grid">
            <div className="code-card">
              <div className="code-card-header">
                <span className="code-card-title"><Film size={15} /> Movie embed</span>
                <CopyButton text={movieCode} />
              </div>
              <div className="code-body">
                <pre>{movieCode}</pre>
              </div>
            </div>
            <div className="code-card">
              <div className="code-card-header">
                <span className="code-card-title"><Tv size={15} /> TV episode embed</span>
                <CopyButton text={tvCode} />
              </div>
              <div className="code-body">
                <pre>{tvCode}</pre>
              </div>
            </div>
          </div>
        </section>

        <hr className="section-divider" />

        {/* DEMO */}
        <section id="demo" className="mf-section">
          <div className="section-eyebrow">
            <MonitorPlay size={13} />
            Live demos
          </div>
          <h2 className="section-h2">Preview the experience before you ship.</h2>
            <div className="demo-player-shell">
            <div className="demo-player-controls">
              <div className="demo-player-tabs">
                <button
                  type="button"
                  className={`demo-player-tab ${demoType === "movie" ? "active" : ""}`}
                  onClick={() => {
                    setDemoType("movie");
                    setDemoTmdbId("687163");
                  }}
                >
                  Movie player
                </button>
                <button
                  type="button"
                  className={`demo-player-tab ${demoType === "series" ? "active" : ""}`}
                  onClick={() => {
                    setDemoType("series");
                    setDemoTmdbId("93405");
                    setDemoSeason("1");
                    setDemoEpisode("3");
                  }}
                >
                  Series player
                </button>
              </div>
              <div className="demo-player-inputs">
                <label className="demo-player-input">
                  <span>TMDB ID</span>
                  <input
                    type="text"
                    value={demoTmdbId}
                    onChange={(event) => setDemoTmdbId(event.target.value.trim())}
                    placeholder="27205"
                  />
                </label>
                {demoType === "series" && (
                  <>
                    <label className="demo-player-input">
                      <span>Season</span>
                      <input
                        type="text"
                        value={demoSeason}
                        onChange={(event) => setDemoSeason(event.target.value.trim())}
                        placeholder="1"
                      />
                    </label>
                    <label className="demo-player-input">
                      <span>Episode</span>
                      <input
                        type="text"
                        value={demoEpisode}
                        onChange={(event) => setDemoEpisode(event.target.value.trim())}
                        placeholder="1"
                      />
                    </label>
                  </>
                )}
                <div className="demo-player-badge">
                  <MonitorPlay size={16} />
                  <span>{demoType === "movie" ? "Movie demo" : "Series demo"}</span>
                </div>
              </div>
            </div>

            <div className="demo-player-frame">
              <iframe src={demoPlayerUrl} title="Live demo player" loading="lazy" />
              <div className="demo-player-url-bar">
                <span>{demoPlayerUrl}</span>
                <CopyButton text={demoPlayerUrl} />
              </div>
            </div>
          </div>
        </section>

        <hr className="section-divider" />

        {/* API */}
        <section id="api" className="mf-section">
          <div className="section-eyebrow">
            <BookOpenText size={13} />
            API reference
          </div>
          <h2 className="section-h2">Endpoints powering the player.</h2>
          <div className="api-table-wrap">
            <table className="api-table">
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Description</th>
                  <th>Example</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((e) => (
                  <tr key={e.endpoint}>
                    <td>
                      <span className="method-badge">{e.method}</span>
                      <span className="endpoint-code">{e.endpoint}</span>
                    </td>
                    <td>{e.description}</td>
                    <td><span className="example-code">{e.example}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA BLOCK */}
        <div className="mf-cta-section">
          <div className="cta-block">
            <h2 className="cta-h2">Ready to go live?</h2>
            <p className="cta-sub">One iframe tag. Instant access to 100K+ titles with a polished player.</p>
            <div style={{ display: "flex", gap: "0.875rem", justifyContent: "center" }}>
              <a className="btn-prime" href="#embed">
                <Code2 size={16} /> Get embed code
              </a>
              <Link to={movieDemoUrl} className="btn-ghost">
                <PlayCircle size={16} /> Watch demo
              </Link>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="mf-footer">
          <a href="#" className="mf-footer-brand" aria-label="Moonflix">
            <div className="mf-brand-icon" style={{ width: 24, height: 24 }}>
              <img
                className="mf-brand-logo"
                src="https://moonflix.site/lovable-uploads/bffb51a3-45e8-4440-9ab1-94f7b01c1195.png"
                alt=""
              />
            </div>
          </a>
          <span>Powered by Moonflix With Love</span>
        </footer>
      </div>
    </>
  );
}
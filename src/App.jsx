import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MoviePage from "./pages/MoviePage";
import EpisodePage from "./pages/EpisodePage";
import EmbedPage from "./pages/EmbedPage";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/movie/:tmdbId" element={<MoviePage />} />
      <Route path="/tv/:tmdbId/:season/:episode" element={<EpisodePage />} />
      <Route path="/embed/:type/:tmdbId/:season?/:episode?" element={<EmbedPage />} />
      
    </Routes>
  );
}
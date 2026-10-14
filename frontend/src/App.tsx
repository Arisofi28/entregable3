
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate
} from "react-router-dom";
import { Gamepad2, Home, LibraryBig, Plus, ScrollText, Sparkles } from "lucide-react";

import HomePage from "./pages/HomePage";
import GameLibraryPage from "./pages/GameLibraryPage";
import GameEditorPage from "./pages/GameEditorPage";
import SessionsPage from "./pages/SessionsPage";
import CheckpointPage from "./pages/CheckpointPage";

import "./App.css";

function Navigation() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <NavLink to="/" end className="brand" aria-label="Arcade Universe home">
          <span className="brand-icon"><Gamepad2 size={24} /></span>
          <span className="brand-wordmark">ARCADE <span>UNIVERSE</span></span>
        </NavLink>
        <nav className="site-nav" aria-label="Main navigation">
          <NavLink to="/" end>
            <Home size={16} /> Home
          </NavLink>
          <NavLink to="/games">
            <LibraryBig size={16} /> My Games
          </NavLink>
          <NavLink to="/sessions">
            <ScrollText size={16} /> Sessions
          </NavLink>
          <NavLink to="/games/new">
            <Plus size={16} /> New Game
          </NavLink>
        </nav>
        <span className="player-pill"><Sparkles size={14} /> PLAYER ONE</span>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <div className="site-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/games" element={<GameLibraryPage />} />
          <Route path="/games/new" element={<GameEditorPage />} />
          <Route path="/games/:id/edit" element={<GameEditorPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/games/:id" element={<CheckpointPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <footer className="site-footer">
        <span><strong>ARCADE UNIVERSE</strong> · Every game is a new adventure.</span>
        <span>Made for the love of play ✦</span>
      </footer>
    </BrowserRouter>
  );
}

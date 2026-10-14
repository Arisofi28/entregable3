import { Gamepad2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import "./SiteHeader.css";

export default function SiteHeader() {
  const { pathname } = useLocation();

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <span className="brand-icon">
          <Gamepad2 size={27} />
        </span>
        <span>
          ARCADE<span className="brand-accent">.</span>
        </span>
      </Link>

      <nav className="nav-links">
        <Link to="/#games">My Games</Link>
        <Link to="/#checkpoint">Checkpoint</Link>
        <Link
          to="/terminal"
          className={pathname === "/terminal" ? "active" : undefined}
          aria-current={pathname === "/terminal" ? "page" : undefined}
        >
          Terminal
        </Link>
      </nav>

      <div className="player-pill">
        <span>PLAYER 01</span>
        <span>⭐</span>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <strong>ARCADE UNIVERSE</strong>
      <span>Entregable 3 · Diario de Progreso Gamer</span>
    </footer>
  );
}

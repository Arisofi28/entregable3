import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Gamepad2,
  Search,
  Plus,
  Clock3,
  Trophy,
  ChevronRight,
  Sparkles
} from "lucide-react";
import {
  formatHours,
  formatProgress,
  gameSummary,
  librarySummary
} from "../data/library";
import SiteHeader, { SiteFooter } from "../components/SiteHeader";
import { useLibrary } from "../state/useLibrary";
import "./HomePage.css";

export default function HomePage() {
  const { games } = useLibrary();
  const [search, setSearch] = useState("");
  const snapshot = librarySummary(games);

  const filteredGames = games.filter(game =>
    game.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-shell">
      <SiteHeader />

      <main>
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow">
              <Sparkles size={16} />
              YOUR GAMING UNIVERSE
            </span>

            <h1>
              EVERY GAME
              <br />
              IS A NEW
              <br />
              <em>ADVENTURE.</em>
            </h1>

            <p>
              Organiza tus videojuegos, registra tus partidas
              y descubre cuánto has avanzado.
            </p>

            <a className="hero-button" href="#games">
              EXPLORE MY GAMES
              <ChevronRight size={20} />
            </a>
          </div>

          <div
            className="hero-illustration"
            aria-hidden="true"
          >
            <span className="hero-sparkle">✦</span>
            <div className="planet">🪐</div>
            <div className="hero-controller">🎮</div>
            <div className="hero-star">⭐</div>
          </div>
        </section>

        <section className="games-section" id="games">
          <div className="section-heading">
            <div>
              <span className="section-kicker">
                YOUR COLLECTION
              </span>
              <h2>My Games <span>✦</span></h2>
            </div>

            <div className="search-box">
              <Search size={18} />
              <input
                value={search}
                onChange={event =>
                  setSearch(event.target.value)
                }
                placeholder="Buscar videojuegos..."
                aria-label="Buscar videojuegos"
              />
            </div>
          </div>

          <div className="game-grid">
            {filteredGames.map(game => {
              const progress = gameSummary(game).porcentajeAvanceActual;

              return (
                <article
                  className="game-card"
                  key={game.id}
                >
                  <div
                    className="game-art"
                    style={{ background: game.color }}
                  >
                    <span className="platform-tag">
                      {game.platform}
                    </span>

                    <span className="game-character">
                      {game.icon}
                    </span>
                  </div>

                  <div className="game-information">
                    <div className="game-meta">
                      <span className="game-genre">
                        {game.genre}
                      </span>
                      <span className="game-status">
                        {game.status}
                      </span>
                    </div>

                    <h3>{game.name}</h3>

                    <div className="progress-label">
                      <span>Progress</span>
                      <strong>{formatProgress(progress)}</strong>
                    </div>

                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.max(0, Math.min(100, progress))}%`
                        }}
                      />
                    </div>
                  </div>
                </article>
              );
            })}

            <article className="add-game-card">
              <div className="add-icon">
                <Plus size={30} />
              </div>

              <h3>New Adventure?</h3>
              <p>Agrégalo desde la terminal.</p>
              <Link to="/terminal">OPEN TERMINAL</Link>
            </article>
          </div>

          {search.trim() && filteredGames.length === 0 && (
            <p className="empty-search">
              No encontramos videojuegos con ese nombre.
            </p>
          )}
        </section>

        <section
          className="checkpoint"
          id="checkpoint"
        >
          <div className="checkpoint-header">
            <span>⚑ YOUR CHECKPOINT</span>
            <h2>
              GAME SUMMARY<span>_</span>
            </h2>
            <p>
              Cada partida cuenta. Sigue tu progreso
              y supera tu próximo nivel.
            </p>
          </div>

          <div className="stats-grid">
            <div className="stat">
              <Clock3 />
              <span>TOTAL PLAYTIME</span>
              <strong>
                {formatHours(snapshot.horasTotales)} <small>HRS</small>
              </strong>
              <em>En toda la biblioteca</em>
            </div>

            <div className="stat">
              <Gamepad2 />
              <span>GAME SESSIONS</span>
              <strong>
                {String(snapshot.totalPartidas).padStart(2, "0")}
              </strong>
              <em>Registradas</em>
            </div>

            <div className="stat">
              <Trophy />
              <span>CURRENT PROGRESS</span>
              <strong>
                {snapshot.porcentajeAvanceActual} <small>%</small>
              </strong>
              <em>{snapshot.juegoActual ?? "Sin partidas"}</em>
            </div>
          </div>

          <p className="checkpoint-note">
            El resumen sale de las partidas guardadas.
            La terminal escribe en esta misma colección.
          </p>

          <Link className="checkpoint-link" to="/terminal">
            OPEN TERMINAL
            <ChevronRight size={18} />
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

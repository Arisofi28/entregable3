
import { useState } from "react";
import {
  Gamepad2,
  Search,
  Plus,
  Clock3,
  Trophy,
  ChevronRight,
  Sparkles
} from "lucide-react";
import "./HomePage.css";

const demoGames = [
  {
    id: "1",
    name: "Pixel Adventure",
    genre: "Aventura",
    platform: "PC",
    progress: 67,
    icon: "🚀",
    color: "#5278F4"
  },
  {
    id: "2",
    name: "Forest Quest",
    genre: "Estrategia",
    platform: "Switch",
    progress: 42,
    icon: "🌳",
    color: "#50B76D"
  },
  {
    id: "3",
    name: "Cosmic Battle",
    genre: "Acción",
    platform: "PlayStation",
    progress: 85,
    icon: "👾",
    color: "#F5685C"
  }
];

export default function HomePage() {
  const [search, setSearch] = useState("");

  const filteredGames = demoGames.filter(game =>
    game.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-shell">
      <header className="navbar">
        <div className="brand">
          <span className="brand-icon">
            <Gamepad2 size={27} />
          </span>
          <span>
            ARCADE<span className="brand-accent">.</span>
          </span>
        </div>

        <nav className="nav-links">
          <a href="#games">My Games</a>
          <a href="#checkpoint">Checkpoint</a>
        </nav>

        <div className="player-pill">
          <span>PLAYER 01</span>
          <span>⭐</span>
        </div>
      </header>

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
              />
            </div>
          </div>

          <div className="game-grid">
            {filteredGames.map(game => (
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
                  <span className="game-genre">
                    {game.genre}
                  </span>

                  <h3>{game.name}</h3>

                  <div className="progress-label">
                    <span>Progress</span>
                    <strong>{game.progress}%</strong>
                  </div>

                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${game.progress}%`
                      }}
                    />
                  </div>
                </div>
              </article>
            ))}

            <article className="add-game-card">
              <div className="add-icon">
                <Plus size={30} />
              </div>

              <h3>New Adventure?</h3>
              <p>Agrega tu próximo videojuego.</p>
              <span>COMING SOON</span>
            </article>
          </div>

          {filteredGames.length === 0 && (
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
                14.5 <small>HRS</small>
              </strong>
            </div>

            <div className="stat">
              <Gamepad2 />
              <span>GAME SESSIONS</span>
              <strong>08</strong>
            </div>

            <div className="stat">
              <Trophy />
              <span>CURRENT PROGRESS</span>
              <strong>
                67 <small>%</small>
              </strong>
            </div>
          </div>

          <p className="checkpoint-note">
            Datos de demostración. Próximamente conectados
            a nuestra API.
          </p>
        </section>
      </main>

      <footer>
        <strong>ARCADE UNIVERSE</strong>
        <span>
          Entregable 3 · Diario de Progreso Gamer
        </span>
      </footer>
    </div>
  );
}

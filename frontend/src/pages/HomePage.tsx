import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Clock3,
  Gamepad2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trophy
} from "lucide-react";
import { obtenerVideojuegos } from "../services/videojuegosApi";
import type { Videojuego } from "../services/videojuegosApi";
import { obtenerResumenVideojuego } from "../services/partidasApi";
import type { ResumenVideojuego } from "../services/partidasApi";
import "./HomePage.css";

const gameStyles: Record<string, { icon: string; color: string; accent: string }> = {
  accion: { icon: "⚔️", color: "#f66961", accent: "#ffd4ce" },
  rol: { icon: "🧙", color: "#8c79dc", accent: "#e7dcff" },
  estrategia: { icon: "🌿", color: "#76bd79", accent: "#d8f0d2" },
  puzzle: { icon: "🧩", color: "#f0b84c", accent: "#fff0c8" },
  deportes: { icon: "🏆", color: "#49abc0", accent: "#d2f0f3" },
  otro: { icon: "🎮", color: "#5278f4", accent: "#dfe7ff" }
};

const stateLabels: Record<string, string> = {
  jugando: "Playing",
  pausado: "On hold",
  completado: "Completed",
  abandonado: "Archived"
};

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [games, setGames] = useState<Videojuego[]>([]);
  const [summaries, setSummaries] = useState<Record<string, ResumenVideojuego>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statsWarning, setStatsWarning] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError("");
      setStatsWarning("");
      try {
        const videogames = await obtenerVideojuegos();
        if (!active) return;
        setGames(videogames);
        const results = await Promise.allSettled(
          videogames.map(game => obtenerResumenVideojuego(game._id))
        );
        if (!active) return;
        const nextSummaries: Record<string, ResumenVideojuego> = {};
        let failed = 0;
        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            nextSummaries[videogames[index]._id] = result.value;
          } else {
            failed += 1;
          }
        });
        setSummaries(nextSummaries);
        if (failed > 0) setStatsWarning("Some game progress summaries could not be loaded.");
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load your games.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadData();
    return () => { active = false; };
  }, []);

  const visibleGames = games.filter(game =>
    game.nombre.toLowerCase().includes(search.trim().toLowerCase())
  );
  const availableSummaries = Object.values(summaries);
  const hours = availableSummaries.reduce((total, summary) => total + summary.horasTotales, 0);
  const sessions = availableSummaries.reduce((total, summary) => total + summary.totalPartidas, 0);
  const progressValues = availableSummaries.map(summary => summary.porcentajeAvanceActual);
  const averageProgress = progressValues.length
    ? Math.round(progressValues.reduce((total, value) => total + value, 0) / progressValues.length)
    : 0;

  return (
    <main className="home-page">
      <div className="app-shell">
        <section className="hero">
          <div className="hero-content">
            <span className="eyebrow"><Sparkles size={16} /> YOUR GAMING UNIVERSE</span>
            <h1>EVERY GAME<br />IS A NEW<br /><em>ADVENTURE.</em></h1>
            <p>Collect your worlds, celebrate every milestone, and keep every adventure moving forward.</p>
            <div className="hero-actions">
              <Link className="hero-button" to="/games">EXPLORE MY GAMES <ArrowRight size={18} /></Link>
              <Link className="hero-button hero-button-light" to="/games/new"><Plus size={18} /> ADD NEW GAME</Link>
            </div>
          </div>
          <div className="hero-illustration" aria-hidden="true">
            <span className="hero-cloud cloud-one" />
            <span className="hero-cloud cloud-two" />
            <span className="hero-planet">🪐</span>
            <span className="hero-sparkle sparkle-one">✦</span>
            <span className="hero-star">⭐</span>
            <span className="hero-controller">🎮</span>
            <span className="hero-platform platform-one" />
            <span className="hero-platform platform-two" />
          </div>
          <span className="hero-sticker">LET’S<br />PLAY!</span>
        </section>

        <section className="home-stats" aria-label="Your gaming stats">
          <div className="home-stat">
            <span className="stat-icon stat-icon-blue"><Gamepad2 size={20} /></span>
            <span><strong>{games.length}</strong><small>worlds collected</small></span>
          </div>
          <div className="home-stat">
            <span className="stat-icon stat-icon-coral"><Clock3 size={20} /></span>
            <span><strong>{hours.toFixed(1)}h</strong><small>time well played</small></span>
          </div>
          <div className="home-stat">
            <span className="stat-icon stat-icon-yellow"><Trophy size={20} /></span>
            <span><strong>{sessions}</strong><small>adventures logged</small></span>
          </div>
          <div className="home-stat">
            <span className="stat-icon stat-icon-green"><Sparkles size={20} /></span>
            <span><strong>{averageProgress}%</strong><small>average progress</small></span>
          </div>
        </section>

        <section className="games-section" id="games">
          <div className="section-heading">
            <div>
              <span className="section-kicker">YOUR COLLECTION</span>
              <h2>Pick up where <span>you left off.</span></h2>
            </div>
            <label className="search-box">
              <Search size={18} />
              <input
                type="search"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Find an adventure..."
                aria-label="Search games"
              />
            </label>
          </div>

          {statsWarning && <div className="notice info" role="status">{statsWarning} Progress remains unavailable where the summary request failed.</div>}
          {loading && <div className="state-panel" role="status"><RefreshCw className="spin" size={25} /><p>Loading your adventures...</p></div>}
          {error && <div className="state-panel" role="alert"><Gamepad2 size={30} /><h2>We couldn’t reach your collection</h2><p>{error}</p><p>Check that the API server is running and try again.</p></div>}

          {!loading && !error && (
            visibleGames.length ? (
              <div className="game-grid">
                {visibleGames.map(game => {
                  const style = gameStyles[game.genero] ?? gameStyles.otro;
                  const summary = summaries[game._id];
                  const progress = summary?.porcentajeAvanceActual;
                  return (
                    <Link
                      to={`/games/${game._id}`}
                      className="game-card"
                      key={game._id}
                      style={{ "--card-color": style.color, "--card-accent": style.accent } as React.CSSProperties}
                    >
                      <div className="game-art">
                        <span className="platform-tag">{game.plataforma}</span>
                        <span className="game-character" aria-hidden="true">{style.icon}</span>
                        <span className="art-orbit" aria-hidden="true">✦</span>
                      </div>
                      <div className="game-information">
                        <div className="game-meta">
                          <span className="game-genre">{game.genero}</span>
                          <span className={`status-badge status-${game.estado}`}>{stateLabels[game.estado] ?? game.estado}</span>
                        </div>
                        <h3>{game.nombre}</h3>
                        <div className="progress-label">
                          <span>{summary ? "Adventure progress" : "Progress unavailable"}</span>
                          <strong>{summary ? `${progress}%` : "—"}</strong>
                        </div>
                        <div className="progress-track" role={summary ? "progressbar" : undefined} aria-valuemin={summary ? 0 : undefined} aria-valuemax={summary ? 100 : undefined} aria-valuenow={summary ? progress : undefined} aria-label={summary ? `${game.nombre} progress` : undefined}>
                          {summary && <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, progress ?? 0))}%` }} />}
                        </div>
                        <div className="game-card-foot">
                          <span><Trophy size={15} /> {game.logros?.length ?? 0} achievements</span>
                          <ArrowRight size={17} />
                        </div>
                      </div>
                    </Link>
                  );
                })}
                <Link to="/games/new" className="add-game-card">
                  <span className="add-icon"><Plus size={30} /></span>
                  <h3>A new adventure?</h3>
                  <p>Add your next favorite game to the collection.</p>
                  <span className="add-card-link">ADD A GAME <ArrowRight size={15} /></span>
                </Link>
              </div>
            ) : (
              <div className="state-panel">
                <Gamepad2 size={32} />
                <h2>{games.length ? "No adventures found" : "Your collection is ready for a first game"}</h2>
                <p>{games.length ? "Try another search, or explore your full library." : "Add a favorite game and start tracking your progress."}</p>
                <Link className="button" to={games.length ? "/games" : "/games/new"}>{games.length ? "VIEW LIBRARY" : "ADD YOUR FIRST GAME"} <ArrowRight size={16} /></Link>
              </div>
            )
          )}
        </section>
      </div>
    </main>
  );
}

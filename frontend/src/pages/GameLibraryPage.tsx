import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Gamepad2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Trophy
} from "lucide-react";
import { eliminarVideojuego, obtenerVideojuegos } from "../services/videojuegosApi";
import type { EstadoVideojuego, Videojuego } from "../services/videojuegosApi";
import { obtenerResumenVideojuego } from "../services/partidasApi";
import type { ResumenVideojuego } from "../services/partidasApi";
import "./GameLibraryPage.css";

const gameStyles: Record<string, { icon: string; color: string }> = {
  accion: { icon: "⚔️", color: "#f66961" },
  rol: { icon: "🧙", color: "#8c79dc" },
  estrategia: { icon: "🌿", color: "#76bd79" },
  puzzle: { icon: "🧩", color: "#f0b84c" },
  deportes: { icon: "🏆", color: "#49abc0" },
  otro: { icon: "🎮", color: "#5278f4" }
};

const stateLabels: Record<string, string> = {
  jugando: "Playing",
  pausado: "On hold",
  completado: "Completed",
  abandonado: "Archived"
};

export default function GameLibraryPage() {
  const [games, setGames] = useState<Videojuego[]>([]);
  const [summaries, setSummaries] = useState<Record<string, ResumenVideojuego>>({});
  const [search, setSearch] = useState("");
  const [state, setState] = useState<EstadoVideojuego | "todos">("todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summaryWarning, setSummaryWarning] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadGames() {
    try {
      const data = await obtenerVideojuegos();
      setGames(data);
      const results = await Promise.allSettled(
        data.map(game => obtenerResumenVideojuego(game._id))
      );
      const nextSummaries: Record<string, ResumenVideojuego> = {};
      let failures = 0;
      results.forEach((result, index) => {
        if (result.status === "fulfilled") nextSummaries[data[index]._id] = result.value;
        else failures += 1;
      });
      setSummaries(nextSummaries);
      if (failures) setSummaryWarning("Some progress summaries are unavailable right now.");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load your games.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadGames);
  }, []);

  function refreshGames() {
    setLoading(true);
    setError("");
    setSummaryWarning("");
    void loadGames();
  }

  async function deleteGame(game: Videojuego) {
    if (!window.confirm(`Delete "${game.nombre}" from your library?`)) return;
    setDeletingId(game._id);
    setError("");
    try {
      await eliminarVideojuego(game._id);
      setGames(current => current.filter(item => item._id !== game._id));
      setSummaries(current => {
        const next = { ...current };
        delete next[game._id];
        return next;
      });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete this game.");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredGames = games.filter(game =>
    game.nombre.toLowerCase().includes(search.trim().toLowerCase()) &&
    (state === "todos" || game.estado === state)
  );

  return (
    <main className="library-page page-container">
      <header className="page-heading">
        <div>
          <span className="page-kicker">✦ YOUR COLLECTION</span>
          <h1>Game Library</h1>
          <p>Every world you’ve picked up, all in one colorful collection.</p>
        </div>
        <Link to="/games/new" className="button"><Plus size={18} /> ADD NEW GAME</Link>
      </header>

      <section className="library-toolbar" aria-label="Game filters">
        <label className="library-search">
          <Search size={18} />
          <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search your games..." />
        </label>
        <label className="library-filter">
          <span>Showing</span>
          <select value={state} onChange={event => setState(event.target.value as EstadoVideojuego | "todos")} aria-label="Filter by game state">
            <option value="todos">All states</option>
            <option value="jugando">Playing</option>
            <option value="pausado">On hold</option>
            <option value="completado">Completed</option>
            <option value="abandonado">Archived</option>
          </select>
        </label>
        <button className="button secondary" type="button" onClick={refreshGames} disabled={loading}>
          <RefreshCw size={16} /> REFRESH
        </button>
      </section>

      {summaryWarning && <div className="notice info" role="status">{summaryWarning} Cards will show progress only when the API provides it.</div>}
      {error && <div className="notice" role="alert"><p>{error}</p><button className="button secondary" type="button" onClick={refreshGames}>TRY AGAIN</button></div>}
      {loading && <div className="state-panel" role="status"><RefreshCw className="spin" size={24} /><p>Gathering your game collection...</p></div>}
      {!loading && !error && filteredGames.length === 0 && (
        <div className="state-panel">
          <Gamepad2 size={34} />
          <h2>{games.length ? "No games match those filters" : "Your library is waiting for its first game"}</h2>
          <p>{games.length ? "Try changing your search or state filter." : "Add a favorite and start tracking the adventure."}</p>
          {!games.length && <Link to="/games/new" className="button"><Plus size={17} /> CREATE A GAME</Link>}
        </div>
      )}
      {!loading && !error && filteredGames.length > 0 && (
        <section className="library-grid" aria-label="Games">
          {filteredGames.map(game => {
            const art = gameStyles[game.genero] ?? gameStyles.otro;
            const summary = summaries[game._id];
            return (
              <article className="library-card" key={game._id}>
                <Link className="library-card-link" to={`/games/${game._id}`} aria-label={`View ${game.nombre}`}>
                  <div className="library-cover" style={{ "--cover-color": art.color } as React.CSSProperties}>
                    <span className="library-platform">{game.plataforma}</span>
                    <span className="library-character" aria-hidden="true">{art.icon}</span>
                    <span className="library-art-star">✦</span>
                  </div>
                </Link>
                <div className="library-card-content">
                  <div className="library-meta">
                    <span>{game.genero}</span>
                    <span className={`library-status status-${game.estado}`}>{stateLabels[game.estado] ?? game.estado}</span>
                  </div>
                  <h2><Link to={`/games/${game._id}`}>{game.nombre}</Link></h2>
                  <div className="library-progress">
                    <div className="library-progress-label">
                      <span>{summary ? "Progress" : "Progress unavailable"}</span>
                      <strong>{summary ? `${summary.porcentajeAvanceActual}%` : "—"}</strong>
                    </div>
                    <div className="progress-track" role={summary ? "progressbar" : undefined} aria-valuemin={summary ? 0 : undefined} aria-valuemax={summary ? 100 : undefined} aria-valuenow={summary ? summary.porcentajeAvanceActual : undefined}>
                      {summary && <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, summary.porcentajeAvanceActual))}%` }} />}
                    </div>
                  </div>
                  <p className="library-achievements"><Trophy size={15} /> {game.logros?.length ?? 0} achievements</p>
                  <div className="library-actions">
                    <Link className="button library-view-button" to={`/games/${game._id}`}>DETAILS <ArrowRight size={15} /></Link>
                    <Link className="library-icon-button" to={`/games/${game._id}/edit`} aria-label={`Edit ${game.nombre}`} title="Edit game"><Pencil size={17} /></Link>
                    <button className="library-icon-button danger" type="button" aria-label={`Delete ${game.nombre}`} title="Delete game" disabled={deletingId === game._id} onClick={() => void deleteGame(game)}><Trash2 size={17} /></button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

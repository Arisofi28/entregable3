import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Gamepad2,
  Plus,
  RefreshCw,
  Sparkles,
  Trophy
} from "lucide-react";
import { actualizarLogro, obtenerVideojuego } from "../services/videojuegosApi";
import type { Videojuego } from "../services/videojuegosApi";
import {
  obtenerPartidasDeVideojuego,
  obtenerResumenVideojuego
} from "../services/partidasApi";
import type { Partida, ResumenVideojuego } from "../services/partidasApi";
import "./CheckpointPage.css";

const genreIcons: Record<string, string> = {
  accion: "⚔️",
  rol: "🧙",
  estrategia: "🌿",
  puzzle: "🧩",
  deportes: "🏆",
  otro: "🎮"
};

export default function CheckpointPage() {
  const { id } = useParams();
  const [game, setGame] = useState<Videojuego | null>(null);
  const [summary, setSummary] = useState<ResumenVideojuego | null>(null);
  const [sessions, setSessions] = useState<Partida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingAchievement, setUpdatingAchievement] = useState<string | null>(null);
  const [achievementError, setAchievementError] = useState("");

  const loadCheckpoint = useCallback(async () => {
    if (!id) return;
    try {
      const [gameData, summaryData, sessionData] = await Promise.all([
        obtenerVideojuego(id),
        obtenerResumenVideojuego(id),
        obtenerPartidasDeVideojuego(id)
      ]);
      setGame(gameData);
      setSummary(summaryData);
      setSessions(sessionData);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load this checkpoint.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(loadCheckpoint);
  }, [loadCheckpoint]);

  function retryCheckpoint() {
    setLoading(true);
    setError("");
    void loadCheckpoint();
  }

  async function toggleAchievement(achievementId: string, earned: boolean) {
    if (!id) return;
    setUpdatingAchievement(achievementId);
    setAchievementError("");
    try {
      const updatedGame = await actualizarLogro(id, achievementId, !earned);
      setGame(updatedGame);
    } catch (updateError) {
      setAchievementError(updateError instanceof Error ? updateError.message : "Could not update this achievement.");
    } finally {
      setUpdatingAchievement(null);
    }
  }

  if (loading) {
    return <main className="page-container"><div className="state-panel checkpoint-state" role="status"><RefreshCw className="checkpoint-spin" size={25} /><p>Loading your checkpoint...</p></div></main>;
  }

  if (error || !game || !summary) {
    return (
      <main className="page-container">
        <div className="state-panel checkpoint-state" role={error ? "alert" : "status"}>
          <Gamepad2 size={32} />
          <h2>Checkpoint unavailable</h2>
          <p>{error || "The game summary is currently unavailable."}</p>
          <button className="button" type="button" onClick={retryCheckpoint}><RefreshCw size={16} /> TRY AGAIN</button>
          <Link className="checkpoint-back-link" to="/games"><ArrowLeft size={15} /> Back to library</Link>
        </div>
      </main>
    );
  }

  const progress = Math.max(0, Math.min(100, summary.porcentajeAvanceActual));
  const radius = 79;
  const circumference = 2 * Math.PI * radius;
  const achieved = game.logros.filter(achievement => achievement.obtenido).length;
  const latestDate = summary.ultimaPartida ? new Date(summary.ultimaPartida) : null;

  return (
    <main className="checkpoint-page page-container">
      <div className="checkpoint-back-row"><Link className="checkpoint-back-link" to="/games"><ArrowLeft size={15} /> ALL GAMES</Link><Link className="checkpoint-edit-link" to={`/games/${game._id}/edit`}>EDIT GAME <ArrowRight size={14} /></Link></div>

      <section className="checkpoint-hero">
        <div className="checkpoint-hero-art" aria-hidden="true">
          <span className="checkpoint-art-circle" />
          <span className="checkpoint-game-emoji">{genreIcons[game.genero] ?? "🎮"}</span>
          <span className="checkpoint-art-star star-a">✦</span>
          <span className="checkpoint-art-star star-b">✧</span>
        </div>
        <div className="checkpoint-title-area">
          <span className="checkpoint-platform">{game.plataforma} <span>·</span> {game.genero}</span>
          <h1>{game.nombre}</h1>
          <span className={`checkpoint-status status-${game.estado}`}>{game.estado}</span>
          <p>Your adventure, one milestone at a time.</p>
          <Link className="button checkpoint-session-button" to="/sessions"><Plus size={16} /> LOG A SESSION <ArrowRight size={16} /></Link>
        </div>
        <div className="checkpoint-progress">
          <svg viewBox="0 0 190 190" role="img" aria-label={`${progress}% complete`}>
            <circle className="checkpoint-ring-track" cx="95" cy="95" r={radius} />
            <circle className="checkpoint-ring-value" cx="95" cy="95" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress / 100)} />
          </svg>
          <div className="checkpoint-progress-label"><strong>{progress}%</strong><span>COMPLETE</span></div>
          <span className="checkpoint-progress-caption">{progress >= 100 ? "Adventure complete!" : "Keep it going!"}</span>
        </div>
      </section>

      <section className="checkpoint-stats" aria-label="Game statistics">
        <article className="checkpoint-stat stat-hours"><span className="checkpoint-stat-icon"><Clock3 size={20} /></span><div><small>TOTAL PLAYTIME</small><strong>{summary.horasTotales}<span> hrs</span></strong></div></article>
        <article className="checkpoint-stat stat-sessions"><span className="checkpoint-stat-icon"><Gamepad2 size={20} /></span><div><small>SESSIONS PLAYED</small><strong>{summary.totalPartidas}<span> sessions</span></strong></div></article>
        <article className="checkpoint-stat stat-achievements"><span className="checkpoint-stat-icon"><Trophy size={20} /></span><div><small>ACHIEVEMENTS</small><strong>{achieved}<span> / {game.logros.length}</span></strong></div></article>
        <article className="checkpoint-stat stat-latest"><span className="checkpoint-stat-icon"><CalendarDays size={20} /></span><div><small>LAST PLAYED</small><strong>{latestDate ? latestDate.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "Not yet"}<span>{latestDate ? latestDate.toLocaleDateString(undefined, { year: "numeric" }) : ""}</span></strong></div></article>
      </section>

      {achievementError && <div className="notice" role="alert"><p>{achievementError}</p></div>}

      <div className="checkpoint-content-grid">
        <section className="achievement-panel surface-card">
          <div className="checkpoint-section-heading"><div><span className="page-kicker"><Trophy size={14} /> LITTLE VICTORIES</span><h2>Achievements</h2></div><span className="achievement-total">{achieved} of {game.logros.length} earned</span></div>
          {game.logros.length ? (
            <div className="checkpoint-achievements">
              {game.logros.map((achievement, index) => (
                <label className={`checkpoint-achievement ${achievement.obtenido ? "earned" : ""}`} key={achievement._id}>
                  <input type="checkbox" checked={achievement.obtenido} disabled={updatingAchievement === achievement._id} onChange={() => void toggleAchievement(achievement._id, achievement.obtenido)} />
                  <span className={`achievement-medal medal-${index % 4}`}><Trophy size={18} /></span>
                  <span className="achievement-copy"><strong>{achievement.nombre}</strong><small>{achievement.obtenido ? "Unlocked — nice work!" : "A new milestone to reach"}</small></span>
                  <span className="achievement-check">{achievement.obtenido && <Check size={16} />}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="achievement-no-items"><Sparkles size={25} /><p>No achievements added for this game yet.</p><Link to={`/games/${game._id}/edit`}>Add achievements <ArrowRight size={14} /></Link></div>
          )}
        </section>

        <section className="checkpoint-history surface-card">
          <div className="checkpoint-section-heading"><div><span className="page-kicker"><CalendarDays size={14} /> RECENT ADVENTURES</span><h2>Session history</h2></div><Link className="history-all-link" to="/sessions">ALL SESSIONS <ArrowRight size={14} /></Link></div>
          {sessions.length ? (
            <div className="checkpoint-session-list">
              {sessions.slice(0, 5).map(session => {
                const sessionDate = new Date(session.fecha);
                return (
                  <article className="checkpoint-session" key={session._id}>
                    <span className="checkpoint-session-icon"><Gamepad2 size={17} /></span>
                    <div className="checkpoint-session-main">
                      <strong>{sessionDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</strong>
                      <span>{session.duracionMinutos} min played {session.notas ? `· ${session.notas}` : ""}</span>
                    </div>
                    <span className="session-progress-pill" title="Progress gained this session">+{session.porcentajeAvance}%</span>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="checkpoint-history-empty"><Clock3 size={24} /><p>No sessions logged yet. This is where your journey will unfold.</p><Link to="/sessions">Log your first session <ArrowRight size={14} /></Link></div>
          )}
        </section>
      </div>
    </main>
  );
}

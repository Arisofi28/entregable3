import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CircleCheck,
  Clock3,
  Gamepad2,
  Plus,
  RefreshCw,
  ScrollText,
  Sparkles,
  Trash2
} from "lucide-react";
import { obtenerVideojuegos } from "../services/videojuegosApi";
import type { Videojuego } from "../services/videojuegosApi";
import {
  crearPartida,
  eliminarPartida,
  obtenerPartidas,
  obtenerResumenVideojuego
} from "../services/partidasApi";
import type {
  CrearPartida,
  Partida,
  ResumenVideojuego
} from "../services/partidasApi";
import "./SessionsPage.css";

function localDateTimeValue(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

function gameIdForSession(session: Partida): string {
  return typeof session.videojuego === "string"
    ? session.videojuego
    : session.videojuego._id;
}

export default function SessionsPage() {
  const [games, setGames] = useState<Videojuego[]>([]);
  const [sessions, setSessions] = useState<Partida[]>([]);
  const [summaries, setSummaries] = useState<Record<string, ResumenVideojuego>>({});
  const [gameId, setGameId] = useState("");
  const [date, setDate] = useState(() => localDateTimeValue(new Date()));
  const [duration, setDuration] = useState("60");
  const [progress, setProgress] = useState("0");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [summaryWarning, setSummaryWarning] = useState("");

  async function loadData() {
    try {
      const [gameData, sessionData] = await Promise.all([
        obtenerVideojuegos(),
        obtenerPartidas()
      ]);
      setGames(gameData);
      setSessions(sessionData);
      setGameId(current => current || gameData[0]?._id || "");
      const summaryResults = await Promise.allSettled(
        gameData.map(game => obtenerResumenVideojuego(game._id))
      );
      const nextSummaries: Record<string, ResumenVideojuego> = {};
      let failedSummaries = 0;
      summaryResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          nextSummaries[gameData[index]._id] = result.value;
        } else {
          failedSummaries += 1;
        }
      });
      setSummaries(nextSummaries);
      setSummaryWarning(
        failedSummaries
          ? "Some game progress summaries are unavailable right now."
          : ""
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load your session journal.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, []);

  function refreshData() {
    setLoading(true);
    setError("");
    void loadData();
  }

  async function submitSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    const payload: CrearPartida = {
      videojuego: gameId,
      fecha: new Date(date).toISOString(),
      duracionMinutos: Number(duration),
      porcentajeAvance: Number(progress),
      ...(notes.trim() ? { notas: notes.trim() } : {})
    };
    try {
      await crearPartida(payload);
      setSuccess("Session added to your gaming journal.");
      setDate(localDateTimeValue(new Date()));
      setDuration("60");
      setProgress("0");
      setNotes("");
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this session.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSession(session: Partida) {
    if (!window.confirm("Delete this session from your journal?")) return;
    setDeletingId(session._id);
    setError("");
    setSuccess("");
    try {
      await eliminarPartida(session._id);
      await loadData();
      setSuccess("Session removed from your journal.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete this session.");
    } finally {
      setDeletingId(null);
    }
  }

  const gameNames = new Map(games.map(game => [game._id, game.nombre]));
  const selectedGameSummary = summaries[gameId];

  return (
    <main className="sessions-page page-container">
      <header className="page-heading">
        <div>
          <span className="page-kicker"><Sparkles size={15} /> YOUR GAMING JOURNAL</span>
          <h1>Sessions & memories</h1>
          <p>Every little step forward deserves a spot in your adventure log.</p>
        </div>
        <button className="button secondary" type="button" onClick={refreshData} disabled={loading}><RefreshCw size={16} /> REFRESH</button>
      </header>

      {error && <div className="sessions-notice sessions-notice--error" role="alert"><p>{error}</p></div>}
      {success && (
        <div className="sessions-notice sessions-notice--success" role="status">
          <CircleCheck size={19} aria-hidden="true" />
          <p>{success}</p>
        </div>
      )}
      {summaryWarning && <div className="notice info" role="status">{summaryWarning}</div>}

      <div className="sessions-layout">
        <section className="session-form-card">
          <div className="session-form-banner">
            <span className="session-form-badge"><Plus size={16} /> NEW MEMORY</span>
            <h2>Log a session</h2>
            <p>Save the highlights from your latest play.</p>
            <span className="session-banner-icon" aria-hidden="true">🎮</span>
          </div>
          <form className="session-form" onSubmit={event => void submitSession(event)}>
            {games.length === 0 && !loading && (
              <div className="session-no-games">
                <p>Add a game before logging a session.</p>
                <Link to="/games/new">ADD A GAME <ArrowRight size={13} /></Link>
              </div>
            )}
            <label className="session-field">
              <span><Gamepad2 size={15} /> Game</span>
              <select required value={gameId} onChange={event => setGameId(event.target.value)} disabled={!games.length}>
                {games.length === 0 && <option value="">No games available</option>}
                {games.map(game => <option value={game._id} key={game._id}>{game.nombre}</option>)}
              </select>
            </label>
            <label className="session-field">
              <span><CalendarDays size={15} /> Date & time</span>
              <input type="datetime-local" required value={date} onChange={event => setDate(event.target.value)} />
            </label>
            <div className="session-field-row">
              <label className="session-field">
                <span><Clock3 size={15} /> Duration (min)</span>
                <input type="number" required min="1" step="1" value={duration} onChange={event => setDuration(event.target.value)} />
              </label>
              <label className="session-field">
                <span><Sparkles size={15} /> Progress gained this session (%)</span>
                <input type="number" required min="0" max="100" step="any" value={progress} onChange={event => setProgress(event.target.value)} />
              </label>
            </div>
            {gameId && (
              <p role="status">
                Current game progress: {selectedGameSummary
                  ? `${selectedGameSummary.porcentajeAvanceActual}%`
                  : "unavailable"}
              </p>
            )}
            <label className="session-field">
              <span>Notes <small>Optional</small></span>
              <textarea maxLength={500} rows={4} value={notes} onChange={event => setNotes(event.target.value)} placeholder="What happened on this adventure?" />
            </label>
            <button className="button session-submit" type="submit" disabled={saving || loading || !games.length}>
              <Plus size={17} /> {saving ? "SAVING SESSION..." : "SAVE SESSION"}
            </button>
          </form>
        </section>

        <section className="session-history">
          <div className="session-history-heading">
            <div><span className="page-kicker"><ScrollText size={14} /> THE PLAY LOG</span><h2>Recent adventures</h2></div>
            <span className="session-count">{sessions.length} {sessions.length === 1 ? "SESSION" : "SESSIONS"}</span>
          </div>
          {loading ? (
            <div className="state-panel session-state" role="status"><RefreshCw className="session-spin" size={23} /><p>Opening your journal...</p></div>
          ) : sessions.length === 0 ? (
            <div className="state-panel session-state">
              <Gamepad2 size={31} /><h2>Your story starts here</h2>
              <p>When you finish a play session, it’ll become a memory in this journal.</p>
            </div>
          ) : (
            <div className="session-timeline">
              {sessions.map((session, index) => {
                const populatedGame = typeof session.videojuego === "string" ? null : session.videojuego;
                const title = populatedGame?.nombre ?? gameNames.get(gameIdForSession(session)) ?? "Game";
                const sessionDate = new Date(session.fecha);
                return (
                  <article className="memory-card" key={session._id}>
                    <span className={`memory-marker memory-color-${index % 4}`}><Gamepad2 size={17} /></span>
                    <div className="memory-card-main">
                      <div className="memory-card-top">
                        <div>
                          <span className="memory-date">{sessionDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} · {sessionDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</span>
                          {populatedGame ? <Link className="memory-game-title" to={`/games/${gameIdForSession(session)}`}>{title}</Link> : <h3 className="memory-game-title">{title}</h3>}
                        </div>
                        <button className="memory-delete" type="button" aria-label={`Delete session for ${title}`} disabled={deletingId === session._id} onClick={() => void deleteSession(session)}><Trash2 size={16} /></button>
                      </div>
                      <div className="memory-stats">
                        <span><Clock3 size={14} /> {session.duracionMinutos} min</span>
                        <span><Sparkles size={14} /> +{session.porcentajeAvance}% gained this session</span>
                      </div>
                      <div className="memory-progress">
                        <div className="progress-track" role="progressbar" aria-label={`${title} progress gained this session`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0, Math.min(100, session.porcentajeAvance))}>
                          <div className="progress-fill" style={{ width: `${Math.max(0, Math.min(100, session.porcentajeAvance))}%` }} />
                        </div>
                      </div>
                      {session.notas && <p className="memory-notes">“{session.notas}”</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

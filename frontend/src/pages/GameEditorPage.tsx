import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Gamepad2, Plus, Save, Trash2, Trophy } from "lucide-react";
import {
  actualizarVideojuego,
  crearVideojuego,
  obtenerVideojuego
} from "../services/videojuegosApi";
import type {
  CrearVideojuego,
  EstadoVideojuego,
  Genero,
  Logro,
  Plataforma
} from "../services/videojuegosApi";
import "./GameEditorPage.css";

interface AchievementDraft {
  id?: string;
  name: string;
  earned: boolean;
}

const platforms: Plataforma[] = ["PC", "PlayStation", "Xbox", "Switch", "Movil"];
const genres: { value: Genero; label: string; icon: string }[] = [
  { value: "accion", label: "Action", icon: "⚔️" },
  { value: "rol", label: "Role-playing", icon: "🧙" },
  { value: "estrategia", label: "Strategy", icon: "🌿" },
  { value: "puzzle", label: "Puzzle", icon: "🧩" },
  { value: "deportes", label: "Sports", icon: "🏆" },
  { value: "otro", label: "Other", icon: "🎮" }
];

const initialAchievement = (): AchievementDraft => ({ name: "", earned: false });

function mapAchievements(achievements: Logro[]): AchievementDraft[] {
  return achievements.map(achievement => ({
    id: achievement._id,
    name: achievement.nombre,
    earned: achievement.obtenido
  }));
}

export default function GameEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<Plataforma>("PC");
  const [genre, setGenre] = useState<Genero>("otro");
  const [state, setState] = useState<EstadoVideojuego>("jugando");
  const [achievements, setAchievements] = useState<AchievementDraft[]>([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let active = true;
    obtenerVideojuego(id)
      .then(game => {
        if (!active) return;
        setName(game.nombre);
        setPlatform(game.plataforma);
        setGenre(game.genero);
        setState(game.estado);
        setAchievements(mapAchievements(game.logros ?? []));
      })
      .catch(loadError => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Could not load this game.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  function updateAchievement(index: number, updates: Partial<AchievementDraft>) {
    setAchievements(current => current.map((achievement, currentIndex) =>
      currentIndex === index ? { ...achievement, ...updates } : achievement
    ));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const payload: CrearVideojuego = {
      nombre: name.trim(),
      plataforma: platform,
      genero: genre,
      estado: state,
      logros: achievements
        .filter(achievement => achievement.name.trim())
        .map(achievement => ({
          ...(achievement.id ? { _id: achievement.id } : {}),
          nombre: achievement.name.trim(),
          obtenido: achievement.earned
        }))
    };

    try {
      const saved = editing && id
        ? await actualizarVideojuego(id, payload)
        : await crearVideojuego(payload);
      navigate(editing ? `/games/${saved._id}` : "/games", { replace: true });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save this game.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="page-container"><div className="state-panel" role="status"><p>Loading game details...</p></div></main>;
  }

  return (
    <main className="editor-page page-container">
      <header className="page-heading">
        <div>
          <span className="page-kicker"><Gamepad2 size={15} /> YOUR NEXT ADVENTURE</span>
          <h1>{editing ? "Edit your game" : "Add a new game"}</h1>
          <p>Give your game a home in the universe. You can update its details any time.</p>
        </div>
        <Link className="button secondary" to={editing && id ? `/games/${id}` : "/games"}><ArrowLeft size={17} /> BACK</Link>
      </header>

      {error && <div className="notice" role="alert"><p>{error}</p></div>}

      <form className="editor-layout" onSubmit={event => void handleSubmit(event)}>
        <section className="editor-form surface-card">
          <div className="form-section-heading">
            <span className="editor-heading-icon"><Gamepad2 size={21} /></span>
            <div><h2>Game details</h2><p>Start with the basics.</p></div>
          </div>

          <label className="field-label" htmlFor="game-name">Game name <span>Required</span></label>
          <input className="form-control" id="game-name" name="nombre" required minLength={2} maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Stardew Valley" />

          <fieldset className="form-fieldset">
            <legend>Choose your platform</legend>
            <div className="platform-options">
              {platforms.map(option => (
                <label className={`choice-pill ${platform === option ? "selected" : ""}`} key={option}>
                  <input type="radio" name="platform" value={option} checked={platform === option} onChange={() => setPlatform(option)} />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="form-fieldset">
            <legend>Pick a genre</legend>
            <div className="genre-options">
              {genres.map(option => (
                <label className={`genre-choice ${genre === option.value ? "selected" : ""}`} key={option.value}>
                  <input type="radio" name="genre" value={option.value} checked={genre === option.value} onChange={() => setGenre(option.value)} />
                  <span>{option.icon}</span>
                  <strong>{option.label}</strong>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="field-label" htmlFor="game-state">Adventure status</label>
          <select className="form-control" id="game-state" value={state} onChange={event => setState(event.target.value as EstadoVideojuego)}>
            <option value="jugando">Playing</option>
            <option value="pausado">On hold</option>
            <option value="completado">Completed</option>
            <option value="abandonado">Archived</option>
          </select>

          <div className="form-actions">
            <Link to={editing && id ? `/games/${id}` : "/games"} className="button secondary">CANCEL</Link>
            <button className="button" type="submit" disabled={saving}>
              {saving ? <span className="editor-spinner" /> : <Save size={17} />}
              {saving ? "SAVING..." : "SAVE GAME"}
            </button>
          </div>
        </section>

        <aside className="achievement-editor surface-card">
          <div className="form-section-heading">
            <span className="editor-heading-icon achievement-icon"><Trophy size={21} /></span>
            <div><h2>Achievements</h2><p>Keep track of your little victories.</p></div>
          </div>
          <div className="achievement-list">
            {!achievements.length && <div className="achievement-empty">No achievements yet. Add a milestone to celebrate.</div>}
            {achievements.map((achievement, index) => (
              <div className="achievement-row" key={achievement.id ?? `new-achievement-${index}`}>
                <label className="achievement-earned" title="Mark as earned">
                  <input type="checkbox" checked={achievement.earned} onChange={event => updateAchievement(index, { earned: event.target.checked })} />
                  <span><Check size={14} /></span>
                </label>
                <input
                  className="form-control achievement-name"
                  aria-label={`Achievement ${index + 1} name`}
                  minLength={2}
                  maxLength={100}
                  value={achievement.name}
                  onChange={event => updateAchievement(index, { name: event.target.value })}
                  placeholder="Achievement name"
                />
                <button className="remove-achievement" type="button" aria-label={`Remove achievement ${index + 1}`} onClick={() => setAchievements(current => current.filter((_, currentIndex) => currentIndex !== index))}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <button className="button secondary add-achievement" type="button" onClick={() => setAchievements(current => [...current, initialAchievement()])}><Plus size={16} /> ADD ACHIEVEMENT</button>
          <p className="achievement-hint">Existing achievement IDs are retained when you edit a game.</p>
        </aside>
      </form>
    </main>
  );
}

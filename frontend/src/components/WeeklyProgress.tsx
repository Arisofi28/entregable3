import type { ReactNode } from "react";
import {
  CalendarCheck,
  CircleCheck,
  Circle,
  Flame,
  Medal,
  Pencil,
  Plus,
  RefreshCw,
  Target,
  Trophy
} from "lucide-react";

import type { ProgresoSemanal } from "../services/metasApi";
import type { EstadoVideojuego } from "../services/videojuegosApi";
import "./WeeklyProgress.css";

// T-10 · Sección de progreso semanal (spec frontend F-01 a F-03, F-10, F-11)

interface WeeklyProgressProps {
  progress: ProgresoSemanal | null;
  loading: boolean;
  error: string;
  gameStatus: EstadoVideojuego;
  onRetry: () => void;
  // Opcionales: sin manejador no se muestran los botones de meta
  onCreateGoal?: () => void;
  onEditGoal?: () => void;
  // Contenido extra bajo el encabezado (formulario de meta, confirmación)
  children?: ReactNode;
  actions?: ReactNode;
}

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

// Las fechas llegan como "YYYY-MM-DD" (día de Ecuador); se formatean en UTC para no desplazarlas
function formatDay(day: string): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });
}

function plural(value: number, word: string): string {
  return `${value} ${word}${value === 1 ? "" : "s"}`;
}

function hoursMessage(hours: number, target: number): string {
  const missing = Math.round((target - hours) * 10) / 10;
  return missing > 0
    ? `${plural(missing, "more hour")} to reach your goal`
    : "Goal hours reached!";
}

export default function WeeklyProgress({
  progress,
  loading,
  error,
  gameStatus,
  onRetry,
  onCreateGoal,
  onEditGoal,
  children,
  actions
}: WeeklyProgressProps) {
  const goal = progress?.meta ?? null;
  const goalAllowed = gameStatus !== "completado" && gameStatus !== "abandonado";
  const canCreate = goalAllowed && Boolean(onCreateGoal);

  return (
    <section className="weekly-panel surface-card" aria-labelledby="weekly-title">
      <div className="weekly-heading">
        <div>
          <span className="page-kicker">
            <Target size={14} aria-hidden="true" /> THIS WEEK
          </span>
          <h2 id="weekly-title">Weekly goal</h2>
          {progress && (
            <p className="weekly-range">
              {formatDay(progress.semana.inicio)} – {formatDay(progress.semana.fin)} · Mon
              to Sun, Ecuador time
            </p>
          )}
        </div>
        {progress && !loading && (
          <div className="weekly-heading-actions">
            {goal ? (
              <>
                {onEditGoal && (
                  <button className="button secondary" type="button" onClick={onEditGoal}>
                    <Pencil size={15} aria-hidden="true" /> EDIT GOAL
                  </button>
                )}
                {actions}
              </>
            ) : (
              canCreate && (
                <button className="button" type="button" onClick={onCreateGoal}>
                  <Plus size={15} aria-hidden="true" /> SET A GOAL
                </button>
              )
            )}
          </div>
        )}
      </div>

      {children}

      {loading && (
        <div className="weekly-state" role="status">
          <RefreshCw className="weekly-spin" size={22} aria-hidden="true" />
          <p>Loading your week...</p>
        </div>
      )}

      {!loading && error && (
        <div className="notice" role="alert">
          <p>Could not load your weekly progress. {error}</p>
          <button className="button secondary" type="button" onClick={onRetry}>
            <RefreshCw size={15} aria-hidden="true" /> TRY AGAIN
          </button>
        </div>
      )}

      {!loading && !error && progress && (
        <div aria-live="polite">
          {goal && progress.metaCumplida && (
            <p className="weekly-met" role="status">
              <CircleCheck size={18} aria-hidden="true" /> Weekly goal met — great
              consistency!
            </p>
          )}

          {!goal && (
            <div className="weekly-empty">
              <Target size={26} aria-hidden="true" />
              {goalAllowed ? (
                <>
                  <p>
                    <strong>No active goal yet.</strong> Decide how many hours and days
                    you want to play each week, and add a few milestones to celebrate.
                  </p>
                  {canCreate && (
                    <button className="button" type="button" onClick={onCreateGoal}>
                      <Plus size={15} aria-hidden="true" /> SET A GOAL
                    </button>
                  )}
                </>
              ) : (
                <p>
                  <strong>Goals are for games in progress.</strong> This game is{" "}
                  {gameStatus}; change its status to playing or paused to set a weekly
                  goal.
                </p>
              )}
            </div>
          )}

          <div className="weekly-grid">
            <article className="weekly-card weekly-hours">
              <span className="weekly-label">HOURS THIS WEEK</span>
              <strong className="weekly-figure">
                {progress.horasSemana}
                <span> {goal ? `/ ${goal.horasSemanales} hrs` : "hrs"}</span>
              </strong>
              {goal && progress.porcentajeHoras !== null && (
                <>
                  <div
                    className={`weekly-track ${progress.porcentajeHoras >= 100 ? "is-complete" : ""}`}
                    role="progressbar"
                    aria-label="Weekly hours toward your goal"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(100, progress.porcentajeHoras)}
                    aria-valuetext={`${progress.porcentajeHoras}% of ${goal.horasSemanales} hours`}
                  >
                    <div
                      className="weekly-fill"
                      style={{ width: `${Math.min(100, progress.porcentajeHoras)}%` }}
                    />
                  </div>
                  <p className="weekly-note">
                    <strong>{progress.porcentajeHoras}%</strong> ·{" "}
                    {hoursMessage(progress.horasSemana, goal.horasSemanales)}
                  </p>
                </>
              )}
            </article>

            <article className="weekly-card weekly-days">
              <span className="weekly-label">DAYS PLAYED</span>
              <strong className="weekly-figure">
                {progress.diasJugadosSemana}
                <span> {goal ? `/ ${goal.diasPorSemana} days` : "days"}</span>
              </strong>
              <ol className="weekly-dots" aria-label="Days played this week">
                {progress.diasSemana.map((day, index) => (
                  <li
                    key={day.fecha}
                    className={day.jugado ? "is-played" : ""}
                    aria-label={`${DAY_NAMES[index]}: ${day.jugado ? "played" : "not played"}`}
                  >
                    <span aria-hidden="true">{DAY_NAMES[index][0]}</span>
                  </li>
                ))}
              </ol>
            </article>

            <article className="weekly-card weekly-streak">
              <span className="weekly-label">CURRENT STREAK</span>
              <strong className="weekly-figure">
                <Flame size={22} aria-hidden="true" className="weekly-flame" />
                {progress.rachaActual}
                <span> {progress.rachaActual === 1 ? "day" : "days"}</span>
              </strong>
              <p className="weekly-note">
                {progress.rachaActual > 0
                  ? "Keep the streak alive!"
                  : "Play today to start a new streak."}
              </p>
            </article>

            <article className="weekly-card weekly-best">
              <span className="weekly-label">BEST STREAK</span>
              <strong className="weekly-figure">
                <Trophy size={20} aria-hidden="true" className="weekly-trophy" />
                {progress.mejorRacha}
                <span> {progress.mejorRacha === 1 ? "day" : "days"}</span>
              </strong>
              <p className="weekly-note">Your longest run of consecutive days.</p>
            </article>
          </div>

          {goal && (
            <div className="weekly-milestones">
              <h3>
                <Medal size={16} aria-hidden="true" /> Milestones
              </h3>
              {progress.hitos.length ? (
                <ul>
                  {progress.hitos.map((milestone, index) => (
                    <li
                      key={milestone._id ?? index}
                      className={milestone.alcanzado ? "is-reached" : ""}
                    >
                      {milestone.alcanzado ? (
                        <CircleCheck size={18} aria-hidden="true" />
                      ) : (
                        <Circle size={18} aria-hidden="true" />
                      )}
                      <span className="weekly-milestone-name">
                        {milestone.descripcion}
                      </span>
                      <span className="weekly-milestone-target">
                        {milestone.porcentajeObjetivo}%
                      </span>
                      <span className="weekly-milestone-status">
                        {milestone.alcanzado ? "Reached" : "Not yet"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="weekly-note">
                  <CalendarCheck size={14} aria-hidden="true" /> No milestones in this
                  goal. Edit it to add up to 5.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

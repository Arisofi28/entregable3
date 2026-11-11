import { useState } from "react";
import type { FormEvent } from "react";
import { Save, X } from "lucide-react";

import "./SessionQuickForm.css";

// T-12 · Formulario compacto de partida para el detalle del juego (registrar y, con D-02, editar)

export interface SessionValues {
  fecha: string;
  duracionMinutos: number;
  porcentajeAvance: number;
  notas?: string;
}

interface SessionQuickFormProps {
  title: string;
  submitLabel: string;
  initial?: SessionValues;
  onSubmit: (values: SessionValues) => Promise<void>;
  onCancel: () => void;
}

// Valor para <input type="datetime-local"> en la hora local del navegador
function toLocalInput(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export default function SessionQuickForm({
  title,
  submitLabel,
  initial,
  onSubmit,
  onCancel
}: SessionQuickFormProps) {
  const [date, setDate] = useState(() =>
    toLocalInput(initial ? new Date(initial.fecha) : new Date())
  );
  const [minutes, setMinutes] = useState(String(initial?.duracionMinutos ?? 60));
  const [gained, setGained] = useState(String(initial?.porcentajeAvance ?? 0));
  const [notes, setNotes] = useState(initial?.notas ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const minutesValue = Number(minutes);
    const gainedValue = Number(gained);
    if (!date) return setError("Choose the date and time you started playing.");
    if (!Number.isInteger(minutesValue) || minutesValue < 1) {
      return setError("Duration must be a whole number of minutes, at least 1.");
    }
    if (!Number.isFinite(gainedValue) || gainedValue < 0 || gainedValue > 100) {
      return setError("Progress gained must be between 0 and 100%.");
    }

    setSaving(true);
    try {
      await onSubmit({
        fecha: new Date(date).toISOString(),
        duracionMinutos: minutesValue,
        porcentajeAvance: gainedValue,
        ...(notes.trim() ? { notas: notes.trim() } : {})
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not save this session."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="session-quick"
      onSubmit={event => void handleSubmit(event)}
      noValidate
    >
      <div className="session-quick-heading">
        <h3>{title}</h3>
        <button
          className="session-quick-close"
          type="button"
          onClick={onCancel}
          aria-label="Close session form"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      {error && (
        <p className="session-quick-error" role="alert">
          {error}
        </p>
      )}
      <div className="session-quick-grid">
        <label>
          <span>Started at</span>
          <input
            type="datetime-local"
            required
            value={date}
            onChange={event => setDate(event.target.value)}
          />
        </label>
        <label>
          <span>Minutes</span>
          <input
            type="number"
            min="1"
            step="1"
            required
            value={minutes}
            onChange={event => setMinutes(event.target.value)}
          />
        </label>
        <label>
          <span>Progress gained %</span>
          <input
            type="number"
            min="0"
            max="100"
            step="any"
            required
            value={gained}
            onChange={event => setGained(event.target.value)}
          />
        </label>
        <label className="session-quick-notes">
          <span>Notes (optional)</span>
          <input
            type="text"
            maxLength={500}
            value={notes}
            onChange={event => setNotes(event.target.value)}
          />
        </label>
      </div>
      <div className="session-quick-actions">
        <button
          className="button secondary"
          type="button"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button className="button" type="submit" disabled={saving}>
          <Save size={15} aria-hidden="true" /> {saving ? "SAVING..." : submitLabel}
        </button>
      </div>
    </form>
  );
}

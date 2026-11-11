import { useState } from "react";
import type { FormEvent } from "react";
import { Plus, Save, Trash2, X } from "lucide-react";

import type { Hito, MetaEntrada } from "../services/metasApi";
import "./GoalForm.css";

// T-11 · Formulario para crear y editar la meta (spec frontend F-04, F-05)

const MAX_MILESTONES = 5;

interface GoalFormProps {
  mode: "create" | "edit";
  initial?: MetaEntrada;
  onSubmit: (data: MetaEntrada) => Promise<void>;
  onCancel: () => void;
}

interface MilestoneDraft {
  key: number;
  descripcion: string;
  porcentajeObjetivo: string;
}

type Errors = Record<string, string>;

let nextKey = 0;
const draftFrom = (hito?: Hito): MilestoneDraft => ({
  key: nextKey++,
  descripcion: hito?.descripcion ?? "",
  porcentajeObjetivo: hito ? String(hito.porcentajeObjetivo) : ""
});

// Mismas reglas que el modelo Meta del backend (RN-02, RN-03)
function validateGoal(
  hours: string,
  days: string,
  milestones: MilestoneDraft[]
): Errors {
  const errors: Errors = {};
  const hoursValue = Number(hours);
  const daysValue = Number(days);
  if (
    hours.trim() === "" ||
    !Number.isFinite(hoursValue) ||
    hoursValue <= 0 ||
    hoursValue > 100
  ) {
    errors.hours = "Enter more than 0 and up to 100 hours.";
  }
  if (
    days.trim() === "" ||
    !Number.isInteger(daysValue) ||
    daysValue < 1 ||
    daysValue > 7
  ) {
    errors.days = "Enter a whole number of days from 1 to 7.";
  }
  if (milestones.length > MAX_MILESTONES) {
    errors.milestones = `A goal can have up to ${MAX_MILESTONES} milestones.`;
  }
  milestones.forEach((milestone, index) => {
    if (milestone.descripcion.trim().length < 2) {
      errors[`m${index}-name`] = "Describe the milestone (at least 2 characters).";
    }
    const target = Number(milestone.porcentajeObjetivo);
    if (
      milestone.porcentajeObjetivo.trim() === "" ||
      !Number.isFinite(target) ||
      target < 1 ||
      target > 100
    ) {
      errors[`m${index}-target`] = "Use a percentage from 1 to 100.";
    }
  });
  return errors;
}

export default function GoalForm({ mode, initial, onSubmit, onCancel }: GoalFormProps) {
  const [hours, setHours] = useState(initial ? String(initial.horasSemanales) : "5");
  const [days, setDays] = useState(initial ? String(initial.diasPorSemana) : "4");
  const [milestones, setMilestones] = useState<MilestoneDraft[]>(() =>
    (initial?.hitos ?? []).map(draftFrom)
  );
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);

  function updateMilestone(
    key: number,
    field: "descripcion" | "porcentajeObjetivo",
    value: string
  ) {
    setMilestones(current =>
      current.map(milestone =>
        milestone.key === key ? { ...milestone, [field]: value } : milestone
      )
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError("");
    const nextErrors = validateGoal(hours, days, milestones);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return; // F-04: no se envía con errores

    setSaving(true);
    try {
      await onSubmit({
        horasSemanales: Number(hours),
        diasPorSemana: Number(days),
        hitos: milestones.map(milestone => ({
          descripcion: milestone.descripcion.trim(),
          porcentajeObjetivo: Number(milestone.porcentajeObjetivo)
        }))
      });
    } catch (submitError) {
      // F-05: mensaje del servidor (400, 404, 409)
      setServerError(
        submitError instanceof Error ? submitError.message : "Could not save this goal."
      );
    } finally {
      setSaving(false);
    }
  }

  const errorCount = Object.keys(errors).length;

  return (
    <form className="goal-form" onSubmit={event => void handleSubmit(event)} noValidate>
      <div className="goal-form-heading">
        <h3>{mode === "create" ? "Set a weekly goal" : "Edit your weekly goal"}</h3>
        <button
          className="goal-icon-button"
          type="button"
          onClick={onCancel}
          aria-label="Close goal form"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>

      {(serverError || errorCount > 0) && (
        <div className="goal-form-alert" role="alert">
          {serverError ||
            `Please fix ${errorCount === 1 ? "1 field" : `${errorCount} fields`} below.`}
        </div>
      )}

      <div className="goal-form-row">
        <label className="goal-field">
          <span>Hours per week</span>
          <input
            type="number"
            inputMode="decimal"
            min="0.1"
            max="100"
            step="0.5"
            value={hours}
            onChange={event => setHours(event.target.value)}
            aria-invalid={Boolean(errors.hours)}
            aria-describedby="goal-hours-help"
          />
          <small id="goal-hours-help" className={errors.hours ? "is-error" : ""}>
            {errors.hours ?? "More than 0, up to 100. Decimals allowed."}
          </small>
        </label>
        <label className="goal-field">
          <span>Days per week</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            max="7"
            step="1"
            value={days}
            onChange={event => setDays(event.target.value)}
            aria-invalid={Boolean(errors.days)}
            aria-describedby="goal-days-help"
          />
          <small id="goal-days-help" className={errors.days ? "is-error" : ""}>
            {errors.days ?? "From 1 to 7 days, Monday to Sunday."}
          </small>
        </label>
      </div>

      <fieldset className="goal-milestones">
        <legend>
          Milestones{" "}
          <small>
            ({milestones.length} / {MAX_MILESTONES}, optional)
          </small>
        </legend>
        {milestones.length === 0 && (
          <p className="goal-hint">
            Milestones unlock when your game progress reaches their percentage.
          </p>
        )}
        {milestones.map((milestone, index) => (
          <div className="goal-milestone-row" key={milestone.key}>
            <label className="goal-field goal-field-grow">
              <span>Milestone {index + 1}</span>
              <input
                type="text"
                maxLength={80}
                placeholder="Reach 50%"
                value={milestone.descripcion}
                onChange={event =>
                  updateMilestone(milestone.key, "descripcion", event.target.value)
                }
                aria-invalid={Boolean(errors[`m${index}-name`])}
              />
              {errors[`m${index}-name`] && (
                <small className="is-error">{errors[`m${index}-name`]}</small>
              )}
            </label>
            <label className="goal-field goal-field-small">
              <span>Target %</span>
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={milestone.porcentajeObjetivo}
                onChange={event =>
                  updateMilestone(milestone.key, "porcentajeObjetivo", event.target.value)
                }
                aria-invalid={Boolean(errors[`m${index}-target`])}
              />
              {errors[`m${index}-target`] && (
                <small className="is-error">{errors[`m${index}-target`]}</small>
              )}
            </label>
            <button
              className="goal-icon-button"
              type="button"
              onClick={() =>
                setMilestones(current =>
                  current.filter(item => item.key !== milestone.key)
                )
              }
              aria-label={`Remove milestone ${index + 1}`}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
        <button
          className="button secondary goal-add"
          type="button"
          disabled={milestones.length >= MAX_MILESTONES}
          onClick={() => setMilestones(current => [...current, draftFrom()])}
        >
          <Plus size={15} aria-hidden="true" /> ADD MILESTONE
        </button>
        {milestones.length >= MAX_MILESTONES && (
          <p className="goal-hint">
            You reached the limit of {MAX_MILESTONES} milestones.
          </p>
        )}
      </fieldset>

      <div className="goal-form-actions">
        <button
          className="button secondary"
          type="button"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button className="button" type="submit" disabled={saving}>
          <Save size={15} aria-hidden="true" /> {saving ? "SAVING..." : "SAVE GOAL"}
        </button>
      </div>
    </form>
  );
}

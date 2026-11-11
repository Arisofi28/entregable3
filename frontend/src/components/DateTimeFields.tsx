import type { ReactNode } from "react";

import "./DateTimeFields.css";

// Fecha y hora en campos separados, con la hora en formato 12 h (AM/PM).
// `value` y `onChange` usan el mismo formato que <input type="datetime-local">: "YYYY-MM-DDTHH:mm".

interface DateTimeFieldsProps {
  value: string;
  onChange: (value: string) => void;
  dateLabel?: ReactNode;
  timeLabel?: ReactNode;
  className?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function split(value: string) {
  const [date = "", time = "00:00"] = value.split("T");
  const [h = 0, m = 0] = time.split(":").map(Number);
  return {
    date,
    hour12: String(h % 12 === 0 ? 12 : h % 12),
    minute: String(m).padStart(2, "0"),
    period: h >= 12 ? "PM" : "AM"
  };
}

function join(date: string, hour12: string, minute: string, period: string) {
  if (!date) return "";
  const h = (Number(hour12) % 12) + (period === "PM" ? 12 : 0);
  return `${date}T${String(h).padStart(2, "0")}:${minute}`;
}

export default function DateTimeFields({
  value,
  onChange,
  dateLabel = "Date",
  timeLabel = "Time",
  className = ""
}: DateTimeFieldsProps) {
  const { date, hour12, minute, period } = split(value);

  return (
    <>
      <label className={className}>
        <span>{dateLabel}</span>
        <input
          type="date"
          required
          value={date}
          onChange={event =>
            onChange(
              event.target.value ? join(event.target.value, hour12, minute, period) : ""
            )
          }
        />
      </label>
      <div className={`datetime-time ${className}`} role="group" aria-label="Time">
        <span>{timeLabel}</span>
        <div className="datetime-time-row">
          <select
            aria-label="Hour"
            value={hour12}
            onChange={event => onChange(join(date, event.target.value, minute, period))}
          >
            {HOURS.map(h => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <b aria-hidden="true">:</b>
          <select
            aria-label="Minute"
            value={minute}
            onChange={event => onChange(join(date, hour12, event.target.value, period))}
          >
            {MINUTES.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <select
            aria-label="AM or PM"
            value={period}
            onChange={event => onChange(join(date, hour12, minute, event.target.value))}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>
    </>
  );
}

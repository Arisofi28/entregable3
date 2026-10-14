import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { suggest } from "../data/interpret";
import {
  formatHours,
  formatProgress,
  gameSummary,
  librarySummary,
  promptPath
} from "../data/library";
import SiteHeader, { SiteFooter } from "../components/SiteHeader";
import { useLibrary } from "../state/useLibrary";
import "./TerminalPage.css";

const QUICK_COMMANDS = [
  { command: "help", detail: "Ver los comandos" },
  { command: "games", detail: "Listar la colección" },
  { command: "summary", detail: "Resumen calculado" },
  { command: "open Pixel Adventure", detail: "Abrir un videojuego" }
];

const SYNTAX = [
  {
    command: "log 45 72 jefe final",
    detail: "Registra una partida del juego abierto"
  },
  {
    command: "log 2026-10-01 40 70",
    detail: "La misma partida, con fecha"
  },
  {
    command: "achieve jefe final",
    detail: "Marca o crea un logro"
  },
  {
    command: "status completado",
    detail: "Cambia el estado"
  },
  {
    command: 'new "Nombre" PC accion',
    detail: "Agrega un videojuego"
  }
];

function Prompt({ path }: { path: string }) {
  return (
    <span className="prompt">
      <span className="prompt-user">player01</span>
      <span className="prompt-at">@checkpoint:</span>
      <span className="prompt-path">{path}</span>
      <span className="prompt-sign">$ </span>
    </span>
  );
}

export default function TerminalPage() {
  const { games, activeGameId, lines, runCommand } = useLibrary();
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedDraft, setSavedDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const path = promptPath(games, activeGameId);
  const activeGame = games.find(game => game.id === activeGameId) ?? null;
  const activeSummary = activeGame ? gameSummary(activeGame) : null;
  const librarySnapshot = librarySummary(games);

  useEffect(() => {
    const previous = document.title;
    document.title = "Terminal | Arcade Universe";
    return () => {
      document.title = previous;
    };
  }, []);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTop = body.scrollHeight;
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function execute(command: string) {
    const trimmed = command.trim();
    if (!trimmed) return;

    setHistory(previous => [...previous, trimmed].slice(-50));
    setHistoryIndex(-1);
    setSavedDraft("");
    setDraft("");
    setHint(null);
    runCommand(trimmed);
    inputRef.current?.focus();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    execute(draft);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Tab") {
      event.preventDefault();
      const suggestion = suggest(draft, games);
      setDraft(suggestion.next);
      setHint(suggestion.hint);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (history.length === 0) return;

      const nextIndex = historyIndex === -1
        ? history.length - 1
        : Math.max(0, historyIndex - 1);

      if (historyIndex === -1) setSavedDraft(draft);
      setHistoryIndex(nextIndex);
      setDraft(history[nextIndex] ?? "");
      setHint(null);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (historyIndex === -1) return;

      const nextIndex = historyIndex + 1;

      if (nextIndex >= history.length) {
        setHistoryIndex(-1);
        setDraft(savedDraft);
        setHint(null);
        return;
      }

      setHistoryIndex(nextIndex);
      setDraft(history[nextIndex] ?? "");
      setHint(null);
      return;
    }

    if (event.key === "l" && event.ctrlKey) {
      event.preventDefault();
      execute("clear");
      return;
    }

    if (event.key === "c" && event.ctrlKey && draft) {
      event.preventDefault();
      setDraft("");
      setHint(null);
    }
  }

  function focusInput() {
    const selection = window.getSelection();
    if (selection && selection.toString()) return;
    inputRef.current?.focus();
  }

  const latestLine = lines.at(-1)?.text ?? "";

  return (
    <div className="app-shell">
      <SiteHeader />

      <main className="terminal-page">
        <div className="terminal-heading">
          <span className="section-kicker">YOUR CONSOLE</span>
          <h2>
            Checkpoint Terminal
            <span className="term-caret" aria-hidden="true">_</span>
          </h2>
          <p>
            Registra partidas, logros y avance. Lo que escribas
            aquí actualiza la misma biblioteca de My Games.
          </p>
        </div>

        <section
          className="terminal-window"
          onClick={focusInput}
          aria-label="Terminal de Arcade Universe"
        >
          <div className="terminal-chrome">
            <span className="chrome-dot dot-coral" />
            <span className="chrome-dot dot-yellow" />
            <span className="chrome-dot dot-green" />
            <span className="chrome-title">ARCADE.SYS / CHECKPOINT</span>
            <span className="chrome-live">LIVE</span>
          </div>

          <div
            className="terminal-body"
            ref={bodyRef}
            role="log"
            aria-relevant="additions"
          >
            {lines.map(line => {
              if (!line.text && line.tone !== "command") {
                return <div key={line.id} className="term-spacer" />;
              }

              if (line.tone === "command") {
                return (
                  <p key={line.id} className="term-line term-command">
                    <Prompt path={line.prompt ?? "~"} />
                    <span>{line.text}</span>
                  </p>
                );
              }

              return (
                <p
                  key={line.id}
                  className={`term-line tone-${line.tone}`}
                >
                  {line.text}
                </p>
              );
            })}
          </div>

          <form className="terminal-form" onSubmit={onSubmit}>
            <label className="terminal-label" htmlFor="terminal-command">
              <Prompt path={path} />
            </label>
            <input
              id="terminal-command"
              ref={inputRef}
              value={draft}
              onChange={event => {
                setDraft(event.target.value);
                setHint(null);
              }}
              onKeyDown={onKeyDown}
              aria-label="Comando"
              aria-describedby={hint ? "terminal-hint" : undefined}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
            />
          </form>

          {hint && (
            <p className="terminal-hint" id="terminal-hint">
              {hint}
            </p>
          )}
        </section>

        <aside className="terminal-side">
          <section className="side-card active-card">
            {activeGame ? (
              <>
                <span
                  className="active-icon"
                  style={{ background: activeGame.color }}
                  aria-hidden="true"
                >
                  {activeGame.icon}
                </span>
                <span className="section-kicker">JUEGO ABIERTO</span>
                <h3>{activeGame.name}</h3>
                <p>
                  {activeGame.platform} · {activeGame.status}
                </p>
                <strong>
                  {formatProgress(activeSummary?.porcentajeAvanceActual ?? 0)}
                </strong>
                <span className="active-meta">
                  {activeSummary?.totalPartidas ?? 0} partidas · {formatHours(activeSummary?.horasTotales ?? 0)} h
                </span>
              </>
            ) : (
              <>
                <span className="active-icon library-icon" aria-hidden="true">
                  🎮
                </span>
                <span className="section-kicker">BIBLIOTECA</span>
                <h3>{games.length} videojuegos</h3>
                <p>{formatHours(librarySnapshot.horasTotales)} h registradas</p>
                <strong>
                  {formatProgress(librarySnapshot.porcentajeAvanceActual)}
                </strong>
                <span className="active-meta">
                  {librarySnapshot.juegoActual ?? "Abre un juego con open"}
                </span>
              </>
            )}
          </section>

          <section className="side-card manual">
            <span className="section-kicker">QUICK START</span>
            <h3>Comandos</h3>

            <div className="quick-list">
              {QUICK_COMMANDS.map(item => (
                <button
                  key={item.command}
                  type="button"
                  onClick={() => execute(item.command)}
                >
                  <code>{item.command}</code>
                  <span>{item.detail}</span>
                </button>
              ))}
            </div>

            <ul className="syntax-list">
              {SYNTAX.map(item => (
                <li key={item.command}>
                  <code>{item.command}</code>
                  <span>{item.detail}</span>
                </li>
              ))}
            </ul>

            <p className="manual-keys">
              ↑↓ historial · tab completa · ctrl+l limpia
            </p>
          </section>
        </aside>

        <p className="sr-only" aria-live="polite">
          {latestLine}
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { interpret } from "../data/interpret";
import type { OutputLine } from "../data/interpret";
import {
  GAME_STATUSES,
  promptPath,
  seedGames,
  uid,
  type Achievement,
  type Game,
  type Session
} from "../data/library";
import { LibraryContext } from "./library-context";

const STORAGE_KEY = "arcade-universe-library-v1";
const MAX_LINES = 200;

const STATUSES = new Set<string>(GAME_STATUSES);

type StoredLibrary = {
  games: Game[];
  activeGameId: string | null;
};

function isAchievement(value: unknown): value is Achievement {
  if (!value || typeof value !== "object") return false;
  const achievement = value as Achievement;
  return typeof achievement.id === "string"
    && typeof achievement.name === "string"
    && typeof achievement.obtained === "boolean";
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;
  const session = value as Session;
  return typeof session.id === "string"
    && typeof session.date === "string"
    && typeof session.minutes === "number"
    && typeof session.progress === "number"
    && typeof session.notes === "string"
    && typeof session.createdAt === "number";
}

function isGame(value: unknown): value is Game {
  if (!value || typeof value !== "object") return false;
  const game = value as Game;
  return typeof game.id === "string"
    && typeof game.name === "string"
    && typeof game.genre === "string"
    && typeof game.platform === "string"
    && STATUSES.has(game.status)
    && typeof game.icon === "string"
    && typeof game.color === "string"
    && Array.isArray(game.achievements)
    && game.achievements.every(isAchievement)
    && Array.isArray(game.sessions)
    && game.sessions.every(isSession);
}

function loadLibrary(): StoredLibrary {
  const fallback = { games: seedGames(), activeGameId: null };

  try {
    if (typeof sessionStorage === "undefined") return fallback;
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw) as StoredLibrary;
    if (!parsed || !Array.isArray(parsed.games) || !parsed.games.every(isGame)) {
      return fallback;
    }

    const activeGameId = parsed.games.some(game => game.id === parsed.activeGameId)
      ? parsed.activeGameId
      : null;

    return { games: parsed.games, activeGameId };
  } catch {
    return fallback;
  }
}

function bootLines(): OutputLine[] {
  return [
    { id: uid(), tone: "text", text: "ARCADE UNIVERSE" },
    { id: uid(), tone: "dim", text: "checkpoint terminal" },
    { id: uid(), tone: "text", text: "" },
    {
      id: uid(),
      tone: "text",
      text: "Biblioteca lista. Escribe help para ver los comandos."
    },
    {
      id: uid(),
      tone: "dim",
      text: "Tab completa. ↑ y ↓ recorren el historial."
    }
  ];
}

export default function LibraryProvider({
  children
}: {
  children: ReactNode;
}) {
  const [stored] = useState(loadLibrary);
  const [games, setGames] = useState<Game[]>(stored.games);
  const [activeGameId, setActiveGameId] = useState<string | null>(
    stored.activeGameId
  );
  const [lines, setLines] = useState<OutputLine[]>(bootLines);

  useEffect(() => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ games, activeGameId })
    );
  }, [games, activeGameId]);

  const runCommand = useCallback((input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const result = interpret(trimmed, { games, activeGameId });

    setLines(previous => {
      if (result.clear) {
        return [{
          id: uid(),
          tone: "dim",
          text: "Pantalla limpia. Escribe help."
        }];
      }

      const echo: OutputLine = {
        id: uid(),
        tone: "command",
        text: trimmed,
        prompt: promptPath(games, activeGameId)
      };
      const printed: OutputLine[] = result.lines.map(line => ({
        id: uid(),
        tone: line.tone,
        text: line.text
      }));
      const next = [...previous, echo, ...printed];
      return next.length > MAX_LINES
        ? next.slice(next.length - MAX_LINES)
        : next;
    });

    if (result.games) setGames(result.games);
    if (result.activeGameId !== undefined) {
      setActiveGameId(result.activeGameId);
    }
  }, [games, activeGameId]);

  return (
    <LibraryContext.Provider
      value={{ games, activeGameId, lines, runCommand }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

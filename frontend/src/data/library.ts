export const GAME_STATUSES = [
  "jugando",
  "pausado",
  "completado",
  "abandonado"
] as const;

export type GameStatus = (typeof GAME_STATUSES)[number];

export type Achievement = {
  id: string;
  name: string;
  obtained: boolean;
};

export type Session = {
  id: string;
  date: string;
  minutes: number;
  progress: number;
  notes: string;
  createdAt: number;
};

export type Game = {
  id: string;
  name: string;
  genre: string;
  platform: string;
  status: GameStatus;
  icon: string;
  color: string;
  achievements: Achievement[];
  sessions: Session[];
};

export type GameSummary = {
  totalPartidas: number;
  horasTotales: number;
  ultimaPartida: string | null;
  porcentajeAvanceActual: number;
};

export type LibrarySummary = GameSummary & {
  juegoActual: string | null;
};

let sequence = 0;

export function uid(prefix = "id"): string {
  sequence += 1;
  return `${prefix}-${sequence.toString(36)}-${Date.now().toString(36)}`;
}

export function todayISO(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Misma fecha: gana el createdAt más alto y, si empatan, el id.
export function compareSessions(a: Session, b: Session): number {
  if (a.date !== b.date) return a.date > b.date ? 1 : -1;
  if (a.createdAt !== b.createdAt) return a.createdAt > b.createdAt ? 1 : -1;
  if (a.id !== b.id) return a.id > b.id ? 1 : -1;
  return 0;
}

export function latestSession(game: Game): Session | null {
  return game.sessions.reduce<Session | null>((latest, session) => {
    if (!latest || compareSessions(session, latest) > 0) return session;
    return latest;
  }, null);
}

export function gameSummary(game: Game): GameSummary {
  const latest = latestSession(game);
  const minutes = game.sessions.reduce(
    (sum, session) => sum + session.minutes,
    0
  );

  return {
    totalPartidas: game.sessions.length,
    horasTotales: minutes / 60,
    ultimaPartida: latest?.date ?? null,
    porcentajeAvanceActual: latest?.progress ?? 0
  };
}

export function librarySummary(games: Game[]): LibrarySummary {
  let latest: { game: Game; session: Session } | null = null;
  let minutes = 0;
  let totalPartidas = 0;

  for (const game of games) {
    totalPartidas += game.sessions.length;

    for (const session of game.sessions) {
      minutes += session.minutes;

      if (!latest || compareSessions(session, latest.session) > 0) {
        latest = { game, session };
      }
    }
  }

  return {
    totalPartidas,
    horasTotales: minutes / 60,
    ultimaPartida: latest?.session.date ?? null,
    porcentajeAvanceActual: latest?.session.progress ?? 0,
    juegoActual: latest?.game.name ?? null
  };
}

export function formatHours(hours: number): string {
  return hours.toFixed(1);
}

export function formatProgress(progress: number): string {
  const rounded = Math.round(progress * 10) / 10;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(1);
  return `${text}%`;
}

export function slug(name: string): string {
  const value = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return value || "juego";
}

export function promptPath(
  games: Game[],
  activeGameId: string | null
): string {
  const game = games.find(item => item.id === activeGameId);
  return game ? slug(game.name) : "~";
}

export function seedGames(): Game[] {
  return [
    {
      id: "pixel-adventure",
      name: "Pixel Adventure",
      genre: "Aventura",
      platform: "PC",
      status: "jugando",
      icon: "🚀",
      color: "#5278F4",
      achievements: [
        { id: "pa-1", name: "Primer salto", obtained: true },
        { id: "pa-2", name: "Jefe del nivel 4", obtained: false },
        { id: "pa-3", name: "Mundo secreto", obtained: true }
      ],
      sessions: [
        {
          id: "pa-s1",
          date: "2026-09-02",
          minutes: 90,
          progress: 20,
          notes: "Primer mundo",
          createdAt: 1
        },
        {
          id: "pa-s2",
          date: "2026-09-18",
          minutes: 120,
          progress: 41,
          notes: "",
          createdAt: 2
        },
        {
          id: "pa-s3",
          date: "2026-10-02",
          minutes: 150,
          progress: 67,
          notes: "Jefe del nivel 4",
          createdAt: 3
        }
      ]
    },
    {
      id: "forest-quest",
      name: "Forest Quest",
      genre: "Estrategia",
      platform: "Switch",
      status: "pausado",
      icon: "🌳",
      color: "#50B76D",
      achievements: [
        { id: "fq-1", name: "Mapa completo", obtained: true },
        { id: "fq-2", name: "Aldea salvada", obtained: false }
      ],
      sessions: [
        {
          id: "fq-s1",
          date: "2026-08-11",
          minutes: 80,
          progress: 15,
          notes: "",
          createdAt: 4
        },
        {
          id: "fq-s2",
          date: "2026-09-30",
          minutes: 100,
          progress: 42,
          notes: "Ruta del río",
          createdAt: 5
        }
      ]
    },
    {
      id: "cosmic-battle",
      name: "Cosmic Battle",
      genre: "Acción",
      platform: "PlayStation",
      status: "jugando",
      icon: "👾",
      color: "#F5685C",
      achievements: [
        { id: "cb-1", name: "Primera oleada", obtained: true },
        { id: "cb-2", name: "Nave nodriza", obtained: false },
        { id: "cb-3", name: "Récord de puntos", obtained: true }
      ],
      sessions: [
        {
          id: "cb-s1",
          date: "2026-07-20",
          minutes: 60,
          progress: 30,
          notes: "",
          createdAt: 6
        },
        {
          id: "cb-s2",
          date: "2026-08-22",
          minutes: 140,
          progress: 58,
          notes: "",
          createdAt: 7
        },
        {
          id: "cb-s3",
          date: "2026-10-09",
          minutes: 130,
          progress: 85,
          notes: "Oleada final",
          createdAt: 8
        }
      ]
    }
  ];
}

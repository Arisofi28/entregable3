import {
  GAME_STATUSES,
  formatHours,
  formatProgress,
  gameSummary,
  latestSession,
  librarySummary,
  seedGames,
  todayISO,
  uid,
  compareSessions,
  type Game,
  type GameStatus,
  type Session
} from "./library";

export type LineTone = "dim" | "text" | "ok" | "error";

export type PrintedLine = {
  tone: LineTone;
  text: string;
};

export type OutputLine = {
  id: string;
  tone: LineTone | "command";
  text: string;
  prompt?: string;
};

export type InterpretContext = {
  games: Game[];
  activeGameId: string | null;
};

export type InterpretResult = {
  lines: PrintedLine[];
  games?: Game[];
  activeGameId?: string | null;
  clear?: boolean;
};

const COMMAND_NAMES = [
  "help",
  "games",
  "open",
  "close",
  "new",
  "log",
  "achievements",
  "achieve",
  "status",
  "summary",
  "reset",
  "clear"
];

const PLATFORMS = [
  "PC",
  "PlayStation",
  "Xbox",
  "Switch",
  "Movil"
] as const;

const GENRE_LABELS: Record<string, string> = {
  accion: "Acción",
  acción: "Acción",
  rol: "Rol",
  estrategia: "Estrategia",
  puzzle: "Puzzle",
  deportes: "Deportes",
  otro: "Otro"
};

const NEW_GAME_LOOKS = [
  { icon: "🎯", color: "#F9D84A" },
  { icon: "🎲", color: "#80D8F7" },
  { icon: "⚔️", color: "#C084FC" },
  { icon: "🏎️", color: "#F5685C" },
  { icon: "🧩", color: "#50B76D" },
  { icon: "🌙", color: "#7C6BF2" }
];

const ALIASES: Record<string, string> = {
  ls: "games",
  cls: "clear",
  "?": "help"
};

export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  const pattern = /"([^"]*)"|(\S+)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(input))) {
    tokens.push(match[1] ?? match[2] ?? "");
  }

  return tokens;
}

export function interpret(
  input: string,
  context: InterpretContext
): InterpretResult {
  const tokens = tokenize(input);
  if (tokens.length === 0) return { lines: [] };

  const command = ALIASES[tokens[0].toLowerCase()] ?? tokens[0].toLowerCase();

  switch (command) {
    case "help":
      return { lines: helpLines() };
    case "games":
      return args(tokens, 0) ?? { lines: listGames(context) };
    case "open":
      return openGame(tokens, context);
    case "close":
      return closeGame(tokens, context);
    case "new":
      return createGame(tokens, context);
    case "log":
      return logSession(tokens, context);
    case "achievements":
      return listAchievements(tokens, context);
    case "achieve":
      return toggleAchievement(tokens, context);
    case "status":
      return setStatus(tokens, context);
    case "summary":
      return args(tokens, 0) ?? { lines: describeSummary(context) };
    case "reset":
      return args(tokens, 0) ?? {
        lines: [{
          tone: "ok",
          text: "Biblioteca restaurada con los datos de demostración."
        }],
        games: seedGames(),
        activeGameId: null
      };
    case "clear":
      return args(tokens, 0) ?? { lines: [], clear: true };
    default:
      return {
        lines: [{
          tone: "error",
          text: `Ese comando no existe: ${tokens[0]}. Escribe help.`
        }]
      };
  }
}

export function suggest(
  input: string,
  games: Game[]
): { next: string; hint: string | null } {
  const trailingSpace = /\s$/.test(input);
  const trimmed = input.trim();

  if (!trimmed) {
    return { next: input, hint: COMMAND_NAMES.join("   ") };
  }

  const tokens = tokenize(trimmed);
  const commandPartial = (tokens[0] ?? "").toLowerCase();

  if (!trailingSpace && tokens.length <= 1) {
    const matches = COMMAND_NAMES.filter(command =>
      command.startsWith(commandPartial)
    );

    if (matches.length === 1) {
      return { next: `${matches[0]} `, hint: null };
    }

    if (matches.length > 1) {
      return {
        next: commonPrefix(matches),
        hint: matches.join("   ")
      };
    }

    return { next: input, hint: null };
  }

  if (commandPartial === "open") {
    const partial = tokens.slice(1).join(" ").toLowerCase();
    const names = games.map(game => game.name);

    if (partial === "") {
      return { next: input, hint: names.join("   ") };
    }

    const starting = names.filter(name =>
      name.toLowerCase().startsWith(partial)
    );
    const pool = starting.length > 0
      ? starting
      : names.filter(name => name.toLowerCase().includes(partial));

    if (pool.length === 1) {
      return { next: `open ${quoteArg(pool[0])} `, hint: null };
    }

    if (pool.length > 1) {
      return { next: input, hint: pool.join("   ") };
    }
  }

  if (commandPartial === "status") {
    const partial = tokens.length < 2
      ? ""
      : tokens[1].toLowerCase();

    if (tokens.length > 2) return { next: input, hint: null };

    const matches = GAME_STATUSES.filter(status =>
      status.startsWith(partial)
    );

    if (partial === "") {
      return { next: input, hint: GAME_STATUSES.join("   ") };
    }

    if (matches.length === 1) {
      return { next: `status ${matches[0]} `, hint: null };
    }

    if (matches.length > 1) {
      return {
        next: `status ${commonPrefix([...matches])}`,
        hint: matches.join("   ")
      };
    }
  }

  return { next: input, hint: null };
}

function helpLines(): PrintedLine[] {
  const entries: Array<[string, string]> = [
    ["help", "muestra esta lista"],
    ["games", "lista la colección"],
    ["open <nombre>", "abre un videojuego"],
    ["close", "cierra el videojuego activo"],
    ["new <nombre> <plat> <género>", "agrega un videojuego"],
    ["log [fecha] <min> <%> [nota]", "registra una partida"],
    ["achievements", "logros del juego abierto"],
    ["achieve <nombre>", "obtiene o crea un logro"],
    ["status <estado>", "jugando, pausado, completado o abandonado"],
    ["summary", "resumen calculado"],
    ["reset", "restaura la demo"],
    ["clear", "limpia la pantalla"]
  ];

  const lines: PrintedLine[] = [
    { tone: "text", text: "COMANDOS" },
    { tone: "text", text: "" }
  ];

  for (const [syntax, detail] of entries) {
    lines.push({ tone: "text", text: syntax });
    lines.push({ tone: "dim", text: `  ${detail}` });
  }

  lines.push(
    { tone: "text", text: "" },
    {
      tone: "dim",
      text: "Si el nombre tiene espacios, escríbelo entre comillas."
    },
    {
      tone: "dim",
      text: "Tab completa. ↑ y ↓ recorren el historial."
    }
  );

  return lines;
}

function listGames(context: InterpretContext): PrintedLine[] {
  if (context.games.length === 0) {
    return [{
      tone: "dim",
      text: "La colección está vacía. Agrega uno con new."
    }];
  }

  const lines: PrintedLine[] = [
    {
      tone: "dim",
      text: `${context.games.length} videojuego${context.games.length === 1 ? "" : "s"}`
    },
    { tone: "text", text: "" }
  ];

  for (const game of context.games) {
    const summary = gameSummary(game);
    const marker = game.id === context.activeGameId ? "▸ " : "  ";
    lines.push({ tone: "text", text: `${marker}${game.name}` });
    lines.push({
      tone: "dim",
      text: `    ${game.platform} · ${game.genre} · ${game.status}`
    });
    lines.push({
      tone: "dim",
      text: `    ${formatProgress(summary.porcentajeAvanceActual)} · ${summary.totalPartidas} partidas · ${formatHours(summary.horasTotales)} h`
    });
    lines.push({ tone: "text", text: "" });
  }

  return lines;
}

function openGame(
  tokens: string[],
  context: InterpretContext
): InterpretResult {
  if (tokens.length < 2) {
    return { lines: [{ tone: "error", text: "Uso: open <nombre>" }] };
  }

  const query = tokens.slice(1).join(" ");
  const matches = matchGames(context.games, query);

  if (matches.length === 0) {
    return {
      lines: [{
        tone: "error",
        text: `Ningún videojuego coincide con "${query}".`
      }]
    };
  }

  if (matches.length > 1) {
    return {
      lines: [
        { tone: "error", text: "Hay varios videojuegos con ese texto:" },
        ...matches.map(game => ({
          tone: "dim" as const,
          text: `  ${game.name}`
        })),
        { tone: "dim", text: "Indica un nombre más específico." }
      ]
    };
  }

  const game = matches[0];

  return {
    lines: [
      { tone: "ok", text: `${game.name} abierto.` },
      { tone: "text", text: "" },
      ...describeGame(game)
    ],
    activeGameId: game.id
  };
}

function closeGame(
  tokens: string[],
  context: InterpretContext
): InterpretResult {
  const extra = args(tokens, 0);
  if (extra) return extra;

  if (!context.activeGameId) {
    return {
      lines: [{
        tone: "error",
        text: "Abre un videojuego antes, con open <nombre>."
      }]
    };
  }

  return {
    lines: [{
      tone: "ok",
      text: "Videojuego cerrado. Estás en la biblioteca."
    }],
    activeGameId: null
  };
}

function createGame(
  tokens: string[],
  context: InterpretContext
): InterpretResult {
  if (tokens.length < 4) {
    return {
      lines: [{
        tone: "error",
        text: "Uso: new \"<nombre>\" <plataforma> <género>"
      }]
    };
  }

  if (tokens.length > 4) {
    return {
      lines: [{
        tone: "error",
        text: "Si el nombre tiene espacios, escríbelo entre comillas. Uso: new \"<nombre>\" <plataforma> <género>"
      }]
    };
  }

  const name = tokens[1].trim();
  const platform = canonicalPlatform(tokens[2]);
  const genre = GENRE_LABELS[tokens[3].toLowerCase()];

  if (!name) {
    return {
      lines: [{ tone: "error", text: "Indica el nombre del videojuego." }]
    };
  }

  if (name.length > 60) {
    return {
      lines: [{
        tone: "error",
        text: "El nombre puede tener hasta 60 caracteres."
      }]
    };
  }

  if (context.games.some(game => game.name.toLowerCase() === name.toLowerCase())) {
    return {
      lines: [{
        tone: "error",
        text: "Ya existe un videojuego con ese nombre."
      }]
    };
  }

  if (!platform) {
    return {
      lines: [{
        tone: "error",
        text: `Plataforma no reconocida. Usa: ${PLATFORMS.join(", ")}.`
      }]
    };
  }

  if (!genre) {
    return {
      lines: [{
        tone: "error",
        text: "Género no reconocido. Usa: accion, rol, estrategia, puzzle, deportes, otro."
      }]
    };
  }

  const look = NEW_GAME_LOOKS[context.games.length % NEW_GAME_LOOKS.length];
  const game: Game = {
    id: uid("game"),
    name,
    platform,
    genre,
    status: "jugando",
    icon: look.icon,
    color: look.color,
    achievements: [],
    sessions: []
  };

  return {
    lines: [
      { tone: "ok", text: `${name} entró a la colección y quedó abierto.` },
      { tone: "dim", text: `${platform} · ${genre} · jugando` },
      { tone: "dim", text: "Registra una partida con log <min> <%> [nota]." }
    ],
    games: [...context.games, game],
    activeGameId: game.id
  };
}

function logSession(
  tokens: string[],
  context: InterpretContext
): InterpretResult {
  const opened = needGame(context);
  if (!opened.ok) return opened.result;

  if (tokens.length < 3) {
    return {
      lines: [{
        tone: "error",
        text: "Uso: log [YYYY-MM-DD] <minutos> <porcentaje> [nota]"
      }]
    };
  }

  let index = 1;
  let date = todayISO();

  if (/^\d{4}-\d{2}-\d{2}$/.test(tokens[1])) {
    const parsedDate = parseDate(tokens[1]);

    if (!parsedDate) {
      return {
        lines: [{
          tone: "error",
          text: "La fecha tiene que ser un día real, con formato YYYY-MM-DD."
        }]
      };
    }

    date = parsedDate;
    index = 2;
  }

  const minutesToken = tokens[index];
  const progressToken = tokens[index + 1];

  if (!minutesToken || !progressToken) {
    return {
      lines: [{
        tone: "error",
        text: "Uso: log [YYYY-MM-DD] <minutos> <porcentaje> [nota]"
      }]
    };
  }

  const minutes = parseStrictNumber(minutesToken);
  const progress = parseStrictNumber(progressToken);
  const notes = tokens.slice(index + 2).join(" ").trim();

  if (minutes === null || minutes <= 0) {
    return {
      lines: [{
        tone: "error",
        text: "La duración tiene que ser un número mayor que 0."
      }]
    };
  }

  if (progress === null || progress < 0 || progress > 100) {
    return {
      lines: [{
        tone: "error",
        text: "El porcentaje tiene que estar entre 0 y 100."
      }]
    };
  }

  if (notes.length > 240) {
    return {
      lines: [{
        tone: "error",
        text: "La nota puede tener hasta 240 caracteres."
      }]
    };
  }

  const session: Session = {
    id: uid("session"),
    date,
    minutes,
    progress,
    notes,
    createdAt: Date.now()
  };

  const nextGame: Game = {
    ...opened.game,
    sessions: [...opened.game.sessions, session]
  };
  const games = replaceGame(context.games, nextGame);
  const summary = gameSummary(nextGame);

  return {
    lines: [
      { tone: "ok", text: `Partida registrada en ${nextGame.name}.` },
      {
        tone: "dim",
        text: `${date} · ${formatMinutes(minutes)} min · ${formatProgress(progress)}${notes ? ` · ${notes}` : ""}`
      },
      {
        tone: "dim",
        text: `Avance actual: ${formatProgress(summary.porcentajeAvanceActual)} · ${formatHours(summary.horasTotales)} h`
      }
    ],
    games
  };
}

function listAchievements(
  tokens: string[],
  context: InterpretContext
): InterpretResult {
  const extra = args(tokens, 0);
  if (extra) return extra;

  const opened = needGame(context);
  if (!opened.ok) return opened.result;

  if (opened.game.achievements.length === 0) {
    return {
      lines: [{
        tone: "dim",
        text: "Agrega el primero con achieve <nombre>."
      }]
    };
  }

  return {
    lines: [
      { tone: "text", text: `LOGROS · ${opened.game.name.toUpperCase()}` },
      ...opened.game.achievements.map(achievement => ({
        tone: achievement.obtained ? "ok" as const : "dim" as const,
        text: `  [${achievement.obtained ? "x" : " "}] ${achievement.name}`
      }))
    ]
  };
}

function toggleAchievement(
  tokens: string[],
  context: InterpretContext
): InterpretResult {
  const opened = needGame(context);
  if (!opened.ok) return opened.result;

  const name = tokens.slice(1).join(" ").replace(/\s+/g, " ").trim();

  if (!name) {
    return { lines: [{ tone: "error", text: "Uso: achieve <nombre>" }] };
  }

  if (name.length > 80) {
    return {
      lines: [{
        tone: "error",
        text: "El logro puede tener hasta 80 caracteres."
      }]
    };
  }

  const existing = opened.game.achievements.find(
    achievement => achievement.name.toLowerCase() === name.toLowerCase()
  );

  const achievements = existing
    ? opened.game.achievements.map(achievement =>
      achievement.id === existing.id
        ? { ...achievement, obtained: !achievement.obtained }
        : achievement
    )
    : [
      ...opened.game.achievements,
      { id: uid("logro"), name, obtained: true }
    ];

  const message = !existing
    ? `Logro añadido: ${name}`
    : existing.obtained
      ? `Logro pendiente: ${existing.name}`
      : `Logro obtenido: ${existing.name}`;

  return {
    lines: [{ tone: "ok", text: message }],
    games: replaceGame(context.games, { ...opened.game, achievements })
  };
}

function setStatus(
  tokens: string[],
  context: InterpretContext
): InterpretResult {
  const opened = needGame(context);
  if (!opened.ok) return opened.result;

  if (tokens.length !== 2) {
    return {
      lines: [{
        tone: "error",
        text: "Uso: status <jugando|pausado|completado|abandonado>"
      }]
    };
  }

  const status = tokens[1].toLowerCase();

  if (!GAME_STATUSES.includes(status as GameStatus)) {
    return {
      lines: [{
        tone: "error",
        text: "Estados válidos: jugando, pausado, completado, abandonado."
      }]
    };
  }

  const nextStatus = status as GameStatus;

  if (opened.game.status === nextStatus) {
    return {
      lines: [{
        tone: "dim",
        text: `${opened.game.name} ya está ${nextStatus}.`
      }]
    };
  }

  return {
    lines: [{
      tone: "ok",
      text: `${opened.game.name} ahora está ${nextStatus}.`
    }],
    games: replaceGame(context.games, {
      ...opened.game,
      status: nextStatus
    })
  };
}

function describeSummary(context: InterpretContext): PrintedLine[] {
  const active = context.games.find(game => game.id === context.activeGameId);

  if (active) {
    const summary = gameSummary(active);
    return [
      { tone: "text", text: `CHECKPOINT · ${active.name.toUpperCase()}` },
      row("partidas", String(summary.totalPartidas)),
      row("horas totales", formatHours(summary.horasTotales)),
      row("última partida", summary.ultimaPartida ?? "—"),
      {
        tone: "ok",
        text: rowText("avance actual", formatProgress(summary.porcentajeAvanceActual))
      }
    ];
  }

  const summary = librarySummary(context.games);
  return [
    { tone: "text", text: "CHECKPOINT · BIBLIOTECA" },
    row("partidas", String(summary.totalPartidas)),
    row("horas totales", formatHours(summary.horasTotales)),
    row("última partida", summary.ultimaPartida ?? "—"),
    row("juego", summary.juegoActual ?? "—"),
    {
      tone: "ok",
      text: rowText("avance actual", formatProgress(summary.porcentajeAvanceActual))
    }
  ];
}

function describeGame(game: Game): PrintedLine[] {
  const summary = gameSummary(game);
  const latest = latestSession(game);
  const lines: PrintedLine[] = [
    { tone: "text", text: game.name.toUpperCase() },
    row("plataforma", game.platform),
    row("género", game.genre),
    row("estado", game.status),
    row("partidas", String(summary.totalPartidas)),
    row("horas", formatHours(summary.horasTotales)),
    row("avance actual", formatProgress(summary.porcentajeAvanceActual)),
    row("última partida", summary.ultimaPartida ?? "—")
  ];

  if (latest?.notes) {
    lines.push(row("última nota", latest.notes));
  }

  lines.push({ tone: "text", text: "" });
  lines.push({ tone: "text", text: "logros" });

  if (game.achievements.length === 0) {
    lines.push({ tone: "dim", text: "  Agrega el primero con achieve <nombre>." });
  } else {
    for (const achievement of game.achievements) {
      lines.push({
        tone: achievement.obtained ? "ok" : "dim",
        text: `  [${achievement.obtained ? "x" : " "}] ${achievement.name}`
      });
    }
  }

  const recent = [...game.sessions]
    .sort((a, b) => compareSessions(b, a))
    .slice(0, 3);

  if (recent.length > 0) {
    lines.push({ tone: "text", text: "" });
    lines.push({ tone: "text", text: "últimas partidas" });

    for (const session of recent) {
      const note = session.notes ? `   ${session.notes}` : "";
      lines.push({
        tone: "dim",
        text: `  ${session.date}   ${formatMinutes(session.minutes).padStart(6, " ")} min   ${formatProgress(session.progress).padStart(6, " ")}${note}`
      });
    }

    const hidden = game.sessions.length - recent.length;
    if (hidden > 0) {
      lines.push({ tone: "dim", text: `  y ${hidden} más` });
    }
  }

  return lines;
}

function needGame(
  context: InterpretContext
): { ok: true; game: Game } | { ok: false; result: InterpretResult } {
  const game = context.games.find(item => item.id === context.activeGameId);

  if (!game) {
    return {
      ok: false,
      result: {
        lines: [{
          tone: "error",
          text: "Abre un videojuego antes, con open <nombre>."
        }]
      }
    };
  }

  return { ok: true, game };
}

function args(tokens: string[], expected: number): InterpretResult | null {
  const extra = tokens.length - 1;
  if (extra === expected) return null;

  return {
    lines: [{
      tone: "error",
      text: `${tokens[0].toLowerCase()} no usa argumentos.`
    }]
  };
}

function replaceGame(games: Game[], next: Game): Game[] {
  return games.map(game => game.id === next.id ? next : game);
}

function matchGames(games: Game[], query: string): Game[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const exact = games.filter(game => game.name.toLowerCase() === normalized);
  if (exact.length > 0) return exact;

  return games.filter(game => game.name.toLowerCase().includes(normalized));
}

function canonicalPlatform(value: string): string | null {
  const found = PLATFORMS.find(
    platform => platform.toLowerCase() === value.toLowerCase()
  );
  if (found) return found;
  if (value.toLowerCase() === "móvil") return "Movil";
  return null;
}

function parseDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null;
  }

  return value;
}

function parseStrictNumber(value: string): number | null {
  const cleaned = value.endsWith("%") ? value.slice(0, -1) : value;
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function formatMinutes(minutes: number): string {
  return Number.isInteger(minutes) ? String(minutes) : minutes.toFixed(1);
}

function row(label: string, value: string): PrintedLine {
  return { tone: "dim", text: rowText(label, value) };
}

function rowText(label: string, value: string): string {
  return `${label.padEnd(18, " ")}${value}`;
}

function commonPrefix(values: string[]): string {
  if (values.length === 0) return "";

  let prefix = values[0] ?? "";

  for (const value of values) {
    let index = 0;
    const limit = Math.min(prefix.length, value.length);

    while (index < limit && prefix[index] === value[index]) index += 1;

    prefix = prefix.slice(0, index);
  }

  return prefix;
}

function quoteArg(value: string): string {
  return /\s/.test(value) ? `"${value}"` : value;
}

import { createContext } from "react";
import type { Game } from "../data/library";
import type { OutputLine } from "../data/interpret";

export type LibraryContextValue = {
  games: Game[];
  activeGameId: string | null;
  lines: OutputLine[];
  runCommand: (input: string) => void;
};

export const LibraryContext = createContext<LibraryContextValue | null>(null);

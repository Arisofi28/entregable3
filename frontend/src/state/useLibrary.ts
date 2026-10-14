import { useContext } from "react";
import { LibraryContext } from "./library-context";

export function useLibrary() {
  const value = useContext(LibraryContext);

  if (!value) {
    throw new Error("useLibrary debe usarse dentro de LibraryProvider");
  }

  return value;
}

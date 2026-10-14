import { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation
} from "react-router-dom";

import HomePage from "./pages/HomePage";
import TerminalPage from "./pages/TerminalPage";
import LibraryProvider from "./state/LibraryProvider";

function HashScroller() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;

    const id = decodeURIComponent(location.hash.slice(1));
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [location]);

  return null;
}

export default function App() {
  return (
    <LibraryProvider>
      <BrowserRouter>
        <HashScroller />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/terminal" element={<TerminalPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </LibraryProvider>
  );
}

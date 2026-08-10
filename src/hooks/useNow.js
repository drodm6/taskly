import { useState, useEffect } from "react";

// =========================================================
// useNow — re-renders every second to keep countdowns live.
// The cleanup is required: without it the interval keeps
// running after unmount and leaks.
// =========================================================

export function useNow() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}
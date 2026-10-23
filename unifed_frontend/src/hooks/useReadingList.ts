// src/hooks/useReadingList.ts
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReadingListItem, ReadingStatus } from "../types";

const STORAGE_KEY = (userId: string) => `reading_list_v1_${userId}`;

/**
 * Persistent, per-student reading list.
 *
 * - Loads from localStorage on mount (per user)
 * - Auto-saves on every mutation
 * - Exposes grouped views: readingNow / savedForLater / finished
 *
 * Drop-in replaceable with a backend API later — the returned shape stays
 * identical, so UI never needs to change.
 */
export function useReadingList(userId: string) {
  const [items, setItems] = useState<ReadingListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Load on mount (per user) ──────────────────────────────
  useEffect(() => {
    setLoading(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY(userId));
      setItems(raw ? JSON.parse(raw) : []);
    } catch (e) {
      console.error("[useReadingList] Failed to load", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ── Persist on every change ───────────────────────────────
  useEffect(() => {
    if (loading) return;
    try {
      localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(items));
    } catch (e) {
      console.error("[useReadingList] Failed to save", e);
    }
  }, [items, userId, loading]);

  // ── Queries ───────────────────────────────────────────────
  const findItem = useCallback(
    (resourceId: string) => items.find((i) => i.resourceId === resourceId),
    [items]
  );

  const isSaved = useCallback(
    (resourceId: string) => items.some((i) => i.resourceId === resourceId),
    [items]
  );

  // ── Mutations ─────────────────────────────────────────────
  const save = useCallback(
    (resourceId: string, shelf = "Default") => {
      setItems((prev) => {
        if (prev.some((i) => i.resourceId === resourceId)) return prev;
        const newItem: ReadingListItem = {
          id: `RL_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          userId,
          resourceId,
          status: "SAVED",
          shelf,
          progressPercent: 0,
          savedAt: new Date().toISOString(),
        };
        return [newItem, ...prev];
      });
    },
    [userId]
  );

  const remove = useCallback((resourceId: string) => {
    setItems((prev) => prev.filter((i) => i.resourceId !== resourceId));
  }, []);

  const toggleSave = useCallback(
    (resourceId: string) => {
      if (isSaved(resourceId)) remove(resourceId);
      else save(resourceId);
    },
    [isSaved, remove, save]
  );

  const setStatus = useCallback(
    (resourceId: string, status: ReadingStatus) => {
      setItems((prev) =>
        prev.map((i) => {
          if (i.resourceId !== resourceId) return i;
          const next: ReadingListItem = { ...i, status };
          if (status === "FINISHED") {
            next.progressPercent = 100;
            next.finishedAt = new Date().toISOString();
          }
          if (status === "READING" && i.status !== "READING") {
            next.lastOpenedAt = new Date().toISOString();
          }
          return next;
        })
      );
    },
    []
  );

  const updateProgress = useCallback(
    (resourceId: string, progressPercent: number, lastLocation?: string) => {
      setItems((prev) =>
        prev.map((i) => {
          if (i.resourceId !== resourceId) return i;
          const clamped = Math.max(0, Math.min(100, Math.round(progressPercent)));
          const nextStatus: ReadingStatus =
            clamped >= 100 ? "FINISHED" : clamped > 0 ? "READING" : i.status;

          return {
            ...i,
            status: nextStatus,
            progressPercent: clamped,
            lastLocation: lastLocation ?? i.lastLocation,
            lastOpenedAt: new Date().toISOString(),
            finishedAt:
              clamped >= 100
                ? i.finishedAt ?? new Date().toISOString()
                : i.finishedAt,
          };
        })
      );
    },
    []
  );

  const markFinished = useCallback(
    (resourceId: string, rating?: number, note?: string) => {
      setItems((prev) =>
        prev.map((i) =>
          i.resourceId === resourceId
            ? {
                ...i,
                status: "FINISHED",
                progressPercent: 100,
                rating: rating ?? i.rating,
                note: note ?? i.note,
                finishedAt: new Date().toISOString(),
              }
            : i
        )
      );
    },
    []
  );

  const moveToShelf = useCallback((resourceId: string, shelf: string) => {
    setItems((prev) =>
      prev.map((i) => (i.resourceId === resourceId ? { ...i, shelf } : i))
    );
  }, []);

  const updateNote = useCallback((resourceId: string, note: string) => {
    setItems((prev) =>
      prev.map((i) => (i.resourceId === resourceId ? { ...i, note } : i))
    );
  }, []);

  const clearAll = useCallback(() => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Remove ALL saved items from your reading list?")
    ) {
      setItems([]);
    }
  }, []);

  // ── Grouped views (memoized) ──────────────────────────────
  const readingNow = useMemo(
    () =>
      items
        .filter((i) => i.status === "READING")
        .sort(
          (a, b) =>
            new Date(b.lastOpenedAt ?? 0).getTime() -
            new Date(a.lastOpenedAt ?? 0).getTime()
        ),
    [items]
  );

  const savedForLater = useMemo(
    () =>
      items
        .filter((i) => i.status === "SAVED")
        .sort(
          (a, b) =>
            new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        ),
    [items]
  );

  const finished = useMemo(
    () =>
      items
        .filter((i) => i.status === "FINISHED")
        .sort(
          (a, b) =>
            new Date(b.finishedAt ?? 0).getTime() -
            new Date(a.finishedAt ?? 0).getTime()
        ),
    [items]
  );

  const shelves = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => set.add(i.shelf));
    if (set.size === 0) set.add("Default");
    return Array.from(set).sort();
  }, [items]);

  return {
    // data
    items,
    readingNow,
    savedForLater,
    finished,
    shelves,
    loading,

    // queries
    isSaved,
    findItem,

    // mutations
    save,
    remove,
    toggleSave,
    setStatus,
    updateProgress,
    markFinished,
    moveToShelf,
    updateNote,
    clearAll,
  };
}

export type UseReadingListReturn = ReturnType<typeof useReadingList>;
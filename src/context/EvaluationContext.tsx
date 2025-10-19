import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

type EvaluationStatus = 'done' | 'not_done' | 'not_applicable';

export interface EvaluationEntry {
  id: string;
  createdAt: string;
  monthKey: string;
  evaluatorName: string;
  statusAdpro: EvaluationStatus;
  statusVaseline: EvaluationStatus;
  note: string;
  firestoreId?: string | null;
}

export interface CreateEvaluationInput {
  evaluatorName: string;
  statusAdpro: EvaluationStatus;
  statusVaseline: EvaluationStatus;
  note: string;
  id?: string;
  createdAt?: string;
  firestoreId?: string | null;
}

interface EvaluationContextValue {
  entries: EvaluationEntry[];
  evaluatorNames: string[];
  addEntry: (input: CreateEvaluationInput) => EvaluationEntry;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, updates: Partial<EvaluationEntry>) => void;
}

const EvaluationContext = createContext<EvaluationContextValue | undefined>(undefined);

const STORAGE_KEY = 'skin-care-tracker/evaluations';

const formatMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const EvaluationProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [entries, setEntries] = useLocalStorage<EvaluationEntry[]>(STORAGE_KEY, []);

  const addEntry = useCallback(
    (input: CreateEvaluationInput) => {
      const baseDate = input.createdAt ? new Date(input.createdAt) : new Date();
      const entry: EvaluationEntry = {
        id:
          input.id ??
          (typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${baseDate.getTime()}-${Math.random()}`),
        createdAt: input.createdAt ?? baseDate.toISOString(),
        monthKey: formatMonthKey(baseDate),
        evaluatorName: input.evaluatorName.trim(),
        statusAdpro: input.statusAdpro,
        statusVaseline: input.statusVaseline,
        note: input.note.trim(),
        firestoreId: input.firestoreId ?? null,
      };

      setEntries((prev) => [entry, ...prev]);

      return entry;
    },
    [setEntries],
  );

  const removeEntry = useCallback(
    (id: string) => {
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    },
    [setEntries],
  );

  const updateEntry = useCallback(
    (id: string, updates: Partial<EvaluationEntry>) => {
      setEntries((prev) =>
        prev.map((entry) => (entry.id === id ? { ...entry, ...updates } : entry)),
      );
    },
    [setEntries],
  );

  const evaluatorNames = useMemo(() => {
    const unique = new Set<string>();
    entries.forEach((entry) => {
      if (entry.evaluatorName) {
        unique.add(entry.evaluatorName);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'ja'));
  }, [entries]);

  const value = useMemo<EvaluationContextValue>(
    () => ({ entries, evaluatorNames, addEntry, removeEntry, updateEntry }),
    [entries, evaluatorNames, addEntry, removeEntry, updateEntry],
  );

  return <EvaluationContext.Provider value={value}>{children}</EvaluationContext.Provider>;
};

export const useEvaluations = (): EvaluationContextValue => {
  const context = useContext(EvaluationContext);
  if (!context) {
    throw new Error('useEvaluations must be used within an EvaluationProvider');
  }
  return context;
};

export type { EvaluationStatus };

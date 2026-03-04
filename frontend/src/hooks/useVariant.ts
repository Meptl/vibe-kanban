import { useCallback, useEffect, useRef, useState } from 'react';

type Args = {
  processVariant: string | null;
  draftVariant?: string | null;
};

/**
 * Hook to manage variant selection with priority:
 * 1. User dropdown selection (current session) - highest priority
 * 2. Draft-persisted variant (from previous session)
 * 3. Last execution process variant (fallback)
 */
export function useVariant({ processVariant, draftVariant }: Args) {
  // Track if user has explicitly selected a variant this session
  const hasUserSelectionRef = useRef(false);

  // Compute initial value: draft takes priority over process
  const getInitialVariant = () =>
    draftVariant !== undefined ? draftVariant : processVariant;

  const [selectedVariant, setSelectedVariantState] = useState<string | null>(
    getInitialVariant
  );

  // Sync state when inputs change (if user hasn't made a selection)
  useEffect(() => {
    if (hasUserSelectionRef.current) return;

    const newVariant =
      draftVariant !== undefined ? draftVariant : processVariant;
    setSelectedVariantState(newVariant);
  }, [draftVariant, processVariant]);

  // When user explicitly selects a variant, mark it and update state
  const setSelectedVariant = useCallback((variant: string | null) => {
    hasUserSelectionRef.current = true;
    setSelectedVariantState(variant);
  }, []);

  return { selectedVariant, setSelectedVariant } as const;
}

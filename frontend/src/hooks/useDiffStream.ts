import { useEffect, useMemo, useRef, useState } from 'react';
import type { DiffMetadata } from 'shared/types';

interface UseDiffStreamResult {
  diffs: DiffMetadata[];
  isComplete: boolean;
  error: string | null;
}

type DiffMetadataWsMessage =
  | {
      type: 'snapshot';
      entries: Record<string, DiffMetadata>;
    }
  | {
      type: 'upsert';
      path: string;
      diff: DiffMetadata;
    }
  | {
      type: 'remove';
      path: string;
    }
  | {
      type: 'finished';
    };

export const useDiffStream = (
  attemptId: string | null,
  enabled: boolean
): UseDiffStreamResult => {
  const [entries, setEntries] = useState<Record<string, DiffMetadata>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const retryAttemptsRef = useRef<number>(0);
  const [retryNonce, setRetryNonce] = useState(0);
  const streamKey = enabled && attemptId ? attemptId : null;

  useEffect(() => {
    setEntries({});
    setIsFinished(false);
    setError(null);
    retryAttemptsRef.current = 0;
    if (retryTimerRef.current) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, [streamKey]);

  useEffect(() => {
    if (!streamKey) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      retryAttemptsRef.current = 0;
      return;
    }

    const httpEndpoint = `/api/task-attempts/${streamKey}/diff-metadata-ws`;
    const wsEndpoint = httpEndpoint.startsWith('http')
      ? httpEndpoint.replace(/^http/, 'ws')
      : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${
          window.location.host
        }${httpEndpoint}`;
    const ws = new WebSocket(wsEndpoint);
    let sawFinished = false;
    wsRef.current = ws;

    ws.onopen = () => {
      setError(null);
      retryAttemptsRef.current = 0;
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const msg: DiffMetadataWsMessage = JSON.parse(event.data);
        if (msg.type === 'snapshot') {
          setEntries(msg.entries);
          return;
        }
        if (msg.type === 'upsert') {
          setEntries((prev) => ({
            ...prev,
            [msg.path]: msg.diff,
          }));
          return;
        }
        if (msg.type === 'remove') {
          setEntries((prev) => {
            if (!(msg.path in prev)) return prev;
            const next = { ...prev };
            delete next[msg.path];
            return next;
          });
          return;
        }
        if (msg.type === 'finished') {
          setIsFinished(true);
          sawFinished = true;
          ws.close(1000, 'finished');
          wsRef.current = null;
        }
      } catch (err) {
        console.error('Failed to process diff metadata message:', err);
        setError('Failed to process stream update');
      }
    };

    ws.onerror = () => {
      setError('Connection failed');
    };

    ws.onclose = (evt) => {
      wsRef.current = null;
      if (sawFinished || evt?.reason === 'finished') {
        return;
      }
      retryAttemptsRef.current += 1;
      const delay = Math.min(8000, 1000 * Math.pow(2, retryAttemptsRef.current));
      retryTimerRef.current = window.setTimeout(() => {
        retryTimerRef.current = null;
        setRetryNonce((n) => n + 1);
      }, delay);
    };

    return () => {
      if (wsRef.current) {
        const socket = wsRef.current;
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket.close();
        wsRef.current = null;
      }
      if (retryTimerRef.current) {
        window.clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [streamKey, retryNonce]);

  const diffs = useMemo(() => {
    return Object.values(entries);
  }, [entries]);

  return { diffs, isComplete: isFinished, error };
};

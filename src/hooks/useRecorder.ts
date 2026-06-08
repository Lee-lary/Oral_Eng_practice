import { useCallback, useEffect, useRef, useState } from 'react';
import { startBrowserRecording } from '../audio/mediaRecorderService';
import type { ActiveRecording, FinishedRecording } from '../audio/mediaRecorderService';

export type RecorderStatus = 'idle' | 'starting' | 'recording' | 'stopping' | 'ready' | 'error';

export interface UseRecorderOptions {
  start?: () => Promise<ActiveRecording>;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function stopSilently(recording: ActiveRecording) {
  recording.stop().catch(() => {});
}

export function useRecorder(options: UseRecorderOptions = {}) {
  const activeRecording = useRef<ActiveRecording | null>(null);
  const generation = useRef(0);
  const statusRef = useRef<RecorderStatus>('idle');
  const startRecording = options.start ?? startBrowserRecording;
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [latestRecording, setLatestRecording] = useState<FinishedRecording | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = useCallback((nextStatus: RecorderStatus) => {
    statusRef.current = nextStatus;
    setStatus(nextStatus);
  }, []);

  const start = useCallback(async () => {
    if (
      activeRecording.current ||
      statusRef.current === 'starting' ||
      statusRef.current === 'recording' ||
      statusRef.current === 'stopping'
    ) {
      return;
    }

    const currentGeneration = generation.current + 1;
    generation.current = currentGeneration;
    setError(null);
    setLatestRecording(null);
    updateStatus('starting');

    try {
      const recording = await startRecording();

      if (generation.current !== currentGeneration) {
        stopSilently(recording);
        return;
      }

      activeRecording.current = recording;
      updateStatus('recording');
    } catch (startError) {
      if (generation.current !== currentGeneration) {
        return;
      }

      activeRecording.current = null;
      updateStatus('error');
      setError(getErrorMessage(startError, '无法开始录音。'));
    }
  }, [startRecording, updateStatus]);

  const stop = useCallback(async () => {
    const active = activeRecording.current;

    if (!active) {
      return null;
    }

    const currentGeneration = generation.current;
    updateStatus('stopping');

    try {
      const recording = await active.stop();

      if (activeRecording.current === active && generation.current === currentGeneration) {
        activeRecording.current = null;
        setLatestRecording(recording);
        updateStatus('ready');
      }

      return recording;
    } catch (stopError) {
      if (activeRecording.current === active && generation.current === currentGeneration) {
        activeRecording.current = null;
        updateStatus('error');
        setError(getErrorMessage(stopError, '无法停止录音。'));
      }

      return null;
    }
  }, [updateStatus]);

  const reset = useCallback(() => {
    const active = activeRecording.current;
    generation.current += 1;
    activeRecording.current = null;
    updateStatus('idle');
    setLatestRecording(null);
    setError(null);

    if (active) {
      stopSilently(active);
    }
  }, [updateStatus]);

  useEffect(() => {
    return () => {
      const active = activeRecording.current;
      generation.current += 1;
      activeRecording.current = null;

      if (active) {
        stopSilently(active);
      }
    };
  }, []);

  return {
    status,
    latestRecording,
    error,
    isRecording: status === 'recording',
    start,
    stop,
    reset
  };
}

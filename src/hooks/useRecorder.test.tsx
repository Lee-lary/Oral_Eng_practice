import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ActiveRecording, FinishedRecording } from '../audio/mediaRecorderService';
import { useRecorder } from './useRecorder';

function createFinishedRecording(durationMs = 1_234): FinishedRecording {
  return {
    blob: new Blob(['audio'], { type: 'audio/webm' }),
    durationMs,
    mimeType: 'audio/webm'
  };
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, resolve, reject };
}

function createActiveRecording(recording = createFinishedRecording()): ActiveRecording {
  return {
    startedAt: 1_000,
    stop: vi.fn().mockResolvedValue(recording)
  };
}

describe('useRecorder', () => {
  it('starts and stops a recording', async () => {
    const activeRecording = createActiveRecording();
    const start = vi.fn().mockResolvedValue(activeRecording);
    const { result } = renderHook(() => useRecorder({ start }));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe('recording');
    expect(result.current.isRecording).toBe(true);

    await act(async () => {
      await result.current.stop();
    });

    expect(result.current.status).toBe('ready');
    expect(result.current.isRecording).toBe(false);
    expect(result.current.latestRecording?.durationMs).toBe(1_234);
  });

  it('stores an error when start fails', async () => {
    const start = vi.fn().mockRejectedValue(new Error('no microphone'));
    const { result } = renderHook(() => useRecorder({ start }));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('no microphone');
  });

  it('ignores repeated start calls while a start is in flight', async () => {
    const activeRecording = createActiveRecording();
    const startDeferred = createDeferred<ActiveRecording>();
    const start = vi.fn().mockReturnValue(startDeferred.promise);
    const { result } = renderHook(() => useRecorder({ start }));

    await act(async () => {
      const firstStart = result.current.start();
      const secondStart = result.current.start();
      startDeferred.resolve(activeRecording);
      await Promise.all([firstStart, secondStart]);
    });

    expect(start).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('recording');
  });

  it('stops the active recording on reset without storing the ignored result', async () => {
    const finishedRecording = createFinishedRecording(2_000);
    const activeRecording = createActiveRecording(finishedRecording);
    const { result } = renderHook(() => useRecorder({ start: vi.fn().mockResolvedValue(activeRecording) }));

    await act(async () => {
      await result.current.start();
    });

    await act(async () => {
      result.current.reset();
    });

    expect(activeRecording.stop).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('idle');
    expect(result.current.latestRecording).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('stops the active recording when unmounted', async () => {
    const activeRecording = createActiveRecording();
    const { result, unmount } = renderHook(() =>
      useRecorder({ start: vi.fn().mockResolvedValue(activeRecording) })
    );

    await act(async () => {
      await result.current.start();
    });

    unmount();

    expect(activeRecording.stop).toHaveBeenCalledTimes(1);
  });

  it('does not let a stale stop completion overwrite a newer start after reset', async () => {
    const staleStop = createDeferred<FinishedRecording>();
    const firstRecording: ActiveRecording = {
      startedAt: 1_000,
      stop: vi.fn().mockReturnValue(staleStop.promise)
    };
    const secondRecording = createActiveRecording(createFinishedRecording(4_000));
    const start = vi.fn().mockResolvedValueOnce(firstRecording).mockResolvedValueOnce(secondRecording);
    const { result } = renderHook(() => useRecorder({ start }));

    await act(async () => {
      await result.current.start();
    });

    let stopPromise: Promise<FinishedRecording | null>;
    await act(async () => {
      stopPromise = result.current.stop();
    });

    await act(async () => {
      result.current.reset();
      await result.current.start();
    });

    await act(async () => {
      staleStop.resolve(createFinishedRecording(9_000));
      await stopPromise;
    });

    expect(result.current.status).toBe('recording');
    expect(result.current.latestRecording).toBeNull();
    expect(start).toHaveBeenCalledTimes(2);
  });
});

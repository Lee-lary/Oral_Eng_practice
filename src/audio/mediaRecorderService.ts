export interface FinishedRecording {
  blob: Blob;
  durationMs: number;
  mimeType: string;
}

export interface ActiveRecording {
  stop: () => Promise<FinishedRecording>;
  startedAt: number;
}

const PREFERRED_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'] as const;
const UNSUPPORTED_RECORDING_ERROR = '当前浏览器不支持麦克风录音。';
const RECORDING_FAILED_ERROR = '录音失败，请重试。';

export function chooseSupportedMimeType(
  isTypeSupported =
    typeof MediaRecorder === 'undefined' ? () => false : MediaRecorder.isTypeSupported
): string {
  return PREFERRED_MIME_TYPES.find((mimeType) => isTypeSupported(mimeType)) ?? '';
}

export async function startBrowserRecording(): Promise<ActiveRecording> {
  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
    throw new Error(UNSUPPORTED_RECORDING_ERROR);
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  let tracksStopped = false;
  let recorder: MediaRecorder;

  const stopTracks = () => {
    if (tracksStopped) {
      return;
    }

    tracksStopped = true;
    stream.getTracks().forEach((track) => track.stop());
  };

  try {
    const mimeType = chooseSupportedMimeType();
    recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
  } catch (error) {
    stopTracks();
    throw error;
  }

  const chunks: Blob[] = [];
  const startedAt = Date.now();
  const selectedMimeType = recorder.mimeType || chooseSupportedMimeType();
  let finalRecording: FinishedRecording | null = null;
  let finalError: Error | null = null;
  let stopPromise: Promise<FinishedRecording> | null = null;
  let resolveStop: ((recording: FinishedRecording) => void) | null = null;
  let rejectStop: ((error: Error) => void) | null = null;

  const finishRecording = () => {
    if (!finalRecording) {
      const mimeType = recorder.mimeType || selectedMimeType || 'audio/webm';
      finalRecording = {
        blob: new Blob(chunks, { type: mimeType }),
        durationMs: Date.now() - startedAt,
        mimeType
      };
    }

    stopTracks();
    return finalRecording;
  };

  const failRecording = () => {
    finalError = new Error(RECORDING_FAILED_ERROR);
    stopTracks();
    rejectStop?.(finalError);
  };

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
    }
  };

  recorder.onerror = failRecording;

  recorder.onstop = () => {
    const recording = finishRecording();
    resolveStop?.(recording);
  };

  try {
    recorder.start(250);
  } catch (error) {
    stopTracks();
    throw error;
  }

  return {
    startedAt,
    stop: () => {
      if (stopPromise) {
        return stopPromise;
      }

      if (finalRecording) {
        stopPromise = Promise.resolve(finalRecording);
        return stopPromise;
      }

      if (finalError) {
        stopPromise = Promise.reject(finalError);
        return stopPromise;
      }

      stopPromise = new Promise<FinishedRecording>((resolve, reject) => {
        resolveStop = resolve;
        rejectStop = reject;
      });

      if (recorder.state === 'inactive') {
        resolveStop?.(finishRecording());
      } else {
        recorder.stop();
      }

      return stopPromise;
    }
  };
}

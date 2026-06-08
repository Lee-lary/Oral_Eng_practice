import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, RotateCcw, Save, Square } from 'lucide-react';
import { createRecording } from '../data/recordingRepository';
import { formatDuration } from '../domain/practice';
import { useRecorder } from '../hooks/useRecorder';

type LatestRecording = NonNullable<ReturnType<typeof useRecorder>['latestRecording']>;

function PracticePage() {
  const recorder = useRecorder();
  const currentRecordingRef = useRef<LatestRecording | null>(null);
  const [title, setTitle] = useState('自由录音练习');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedRecording, setSavedRecording] = useState<LatestRecording | null>(null);

  useEffect(() => {
    currentRecordingRef.current = recorder.latestRecording;
    setSaveMessage(null);
    setSaveError(null);
    setIsSaving(false);
    setSavedRecording(null);

    if (!recorder.latestRecording) {
      setAudioUrl(null);
      return;
    }

    const nextAudioUrl = URL.createObjectURL(recorder.latestRecording.blob);
    setAudioUrl(nextAudioUrl);

    return () => {
      URL.revokeObjectURL(nextAudioUrl);
    };
  }, [recorder.latestRecording]);

  const durationLabel = useMemo(() => {
    return recorder.latestRecording ? formatDuration(recorder.latestRecording.durationMs) : '0:00';
  }, [recorder.latestRecording]);

  const isSaveDisabled = isSaving || !recorder.latestRecording || savedRecording === recorder.latestRecording;

  function clearSaveState() {
    setSaveMessage(null);
    setSaveError(null);
    setSavedRecording(null);
    setIsSaving(false);
  }

  function startRecording() {
    clearSaveState();
    recorder.start();
  }

  async function saveLatestRecording() {
    if (!recorder.latestRecording || isSaveDisabled) {
      return;
    }

    const recordingToSave = recorder.latestRecording;
    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      await createRecording({
        taskType: 'free-recording',
        title,
        blob: recordingToSave.blob,
        mimeType: recordingToSave.mimeType,
        durationMs: recordingToSave.durationMs
      });

      if (currentRecordingRef.current === recordingToSave) {
        setSavedRecording(recordingToSave);
        setSaveMessage('已保存到本地历史记录。');
      }
    } catch {
      if (currentRecordingRef.current === recordingToSave) {
        setSavedRecording(null);
        setSaveMessage(null);
        setSaveError('保存失败，请重试。');
      }
    } finally {
      if (currentRecordingRef.current === recordingToSave) {
        setIsSaving(false);
      }
    }
  }

  function resetRecording() {
    clearSaveState();
    recorder.reset();
  }

  return (
    <section className="content-panel practice-panel" aria-labelledby="practice-title">
      <p className="eyebrow">Practice</p>
      <h1 id="practice-title">录音练习</h1>
      <p>完成一轮自由口语录音后，可以在本页回放并保存到本地历史记录。</p>

      <section className="practice-recorder" aria-label="录音面板">
        <label className="field" htmlFor="practice-title-input">
          <span>练习标题</span>
          <input
            id="practice-title-input"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>

        <div className="timer" aria-label="本轮录音时长">
          {durationLabel}
        </div>

        <div className="control-row">
          {recorder.isRecording ? (
            <button className="danger-action" type="button" onClick={recorder.stop}>
              <Square aria-hidden="true" size={18} />
              停止录音
            </button>
          ) : (
            <button className="primary-control" type="button" onClick={startRecording}>
              <Mic aria-hidden="true" size={18} />
              开始录音
            </button>
          )}

          <button className="secondary-control" type="button" onClick={resetRecording}>
            <RotateCcw aria-hidden="true" size={18} />
            重录
          </button>
        </div>

        <div aria-live="polite">
          {recorder.status === 'starting' && <p className="notice">正在请求麦克风权限...</p>}
          {recorder.status === 'recording' && <p className="notice">正在录音...</p>}
          {recorder.status === 'stopping' && <p className="notice">正在生成录音...</p>}
          {recorder.error && <p className="error">{recorder.error}</p>}
          {saveMessage && <p className="success">{saveMessage}</p>}
          {saveError && <p className="error">{saveError}</p>}
        </div>

        {audioUrl && (
          <div className="playback">
            <audio controls src={audioUrl}>
              当前浏览器不支持音频回放。
            </audio>
            <button className="primary-control" type="button" onClick={saveLatestRecording} disabled={isSaveDisabled}>
              <Save aria-hidden="true" size={18} />
              保存本轮录音
            </button>
          </div>
        )}
      </section>
    </section>
  );
}

export default PracticePage;

import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteRecording, listRecordings } from '../data/recordingRepository';
import { formatDuration, type PracticeTaskType, type RecordingRecord } from '../domain/practice';
import { getPracticeTaskTypeLabel, listPracticeTaskTypes } from '../domain/taskCatalog';

type ReviewFilter = 'all' | PracticeTaskType;

const reviewFilters: { label: string; value: ReviewFilter }[] = [
  { label: '全部', value: 'all' },
  ...listPracticeTaskTypes().map((type) => ({
    label: getPracticeTaskTypeLabel(type),
    value: type
  }))
];

function RecordingAudio({ recording }: { recording: RecordingRecord }) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const nextAudioUrl = URL.createObjectURL(recording.blob);
    setAudioUrl(nextAudioUrl);

    return () => {
      URL.revokeObjectURL(nextAudioUrl);
    };
  }, [recording.blob]);

  if (!audioUrl) {
    return null;
  }

  return (
    <audio controls src={audioUrl}>
      当前浏览器不支持音频回放。
    </audio>
  );
}

function RecordingReviewSummary({ recording }: { recording: RecordingRecord }) {
  if (!recording.reviewSummary) {
    return <div className="recording-review-summary-placeholder" aria-hidden="true" />;
  }

  return (
    <section className="recording-review-summary" aria-label={`${recording.title} 本地复盘`}>
      <div className="review-summary-header">
        <strong>本地复盘</strong>
        <span>{recording.reviewSummary.durationLabel}</span>
      </div>
      {recording.reviewSummary.targetDurationSec && (
        <p>建议目标：{recording.reviewSummary.targetDurationSec} 秒</p>
      )}
      <ul>
        {recording.reviewSummary.checklist.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p>{recording.reviewSummary.retryTip}</p>
    </section>
  );
}

function RecordingDialogueTurn({ recording }: { recording: RecordingRecord }) {
  if (!recording.dialogueTurn) {
    return null;
  }

  return (
    <section className="recording-turn-detail" aria-label={`${recording.title} 对话轮次`}>
      <strong>
        第 {recording.dialogueTurn.turnIndex + 1}/{recording.dialogueTurn.totalTurns} 轮
      </strong>
      <p>NPC：{recording.dialogueTurn.npcLine}</p>
      <p>你的回应：{recording.dialogueTurn.userPrompt}</p>
    </section>
  );
}

function formatMetricSeconds(ms: number): string {
  return `${(ms / 1_000).toFixed(1)} 秒`;
}

function formatMetricPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function RecordingFluencyMetrics({ recording }: { recording: RecordingRecord }) {
  if (!recording.fluencyMetrics) {
    return null;
  }

  return (
    <section className="recording-fluency-metrics" aria-label={`${recording.title} 本地流利度`}>
      <strong>本地流利度</strong>
      <div>
        <span>起说延迟 {formatMetricSeconds(recording.fluencyMetrics.startDelayMs)}</span>
        <span>长停顿 {recording.fluencyMetrics.longPauseCount} 次</span>
        <span>停顿占比 {formatMetricPercent(recording.fluencyMetrics.pauseRatio)}</span>
        <span>有声时长 {formatDuration(recording.fluencyMetrics.voicedMs)}</span>
      </div>
    </section>
  );
}

function RecordingHistoryItem({
  isDeleting,
  onDelete,
  recording
}: {
  isDeleting: boolean;
  onDelete: (recording: RecordingRecord) => void;
  recording: RecordingRecord;
}) {
  return (
    <li className="recording-item">
      <div className="recording-info">
        <h2>{recording.title}</h2>
        <p>
          <span className="recording-type">{getPracticeTaskTypeLabel(recording.taskType)}</span>
          {' · '}
          {formatDuration(recording.durationMs)} · {new Date(recording.createdAt).toLocaleString()}
        </p>
        <RecordingDialogueTurn recording={recording} />
        <RecordingFluencyMetrics recording={recording} />
      </div>

      <RecordingReviewSummary recording={recording} />

      <RecordingAudio recording={recording} />

      <button
        className="icon-button"
        type="button"
        aria-label={`删除 ${recording.title}`}
        disabled={isDeleting}
        onClick={() => onDelete(recording)}
      >
        <Trash2 aria-hidden="true" size={18} />
      </button>
    </li>
  );
}

function ReviewPage() {
  const mountedRef = useRef(false);
  const refreshRequestRef = useRef(0);
  const deletingIdsRef = useRef<Set<string>>(new Set());
  const [recordings, setRecordings] = useState<RecordingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set());
  const [filter, setFilter] = useState<ReviewFilter>('all');

  const filteredRecordings =
    filter === 'all' ? recordings : recordings.filter((recording) => recording.taskType === filter);

  async function refresh() {
    if (!mountedRef.current) {
      return;
    }

    const requestId = refreshRequestRef.current + 1;
    refreshRequestRef.current = requestId;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextRecordings = await listRecordings();
      if (!mountedRef.current || refreshRequestRef.current !== requestId) {
        return;
      }

      setRecordings(nextRecordings);
    } catch {
      if (!mountedRef.current || refreshRequestRef.current !== requestId) {
        return;
      }

      setRecordings([]);
      setErrorMessage('读取历史记录失败，请重试。');
    } finally {
      if (mountedRef.current && refreshRequestRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    void refresh();

    return () => {
      mountedRef.current = false;
      refreshRequestRef.current += 1;
    };
  }, []);

  async function removeRecording(recording: RecordingRecord) {
    if (deletingIdsRef.current.has(recording.id)) {
      return;
    }

    const nextDeletingIds = new Set(deletingIdsRef.current);
    nextDeletingIds.add(recording.id);
    deletingIdsRef.current = nextDeletingIds;
    setDeletingIds(nextDeletingIds);
    setErrorMessage(null);

    try {
      await deleteRecording(recording.id);
      if (mountedRef.current) {
        await refresh();
      }
    } catch {
      if (mountedRef.current) {
        setErrorMessage('删除失败，请重试。');
      }
    } finally {
      const remainingDeletingIds = new Set(deletingIdsRef.current);
      remainingDeletingIds.delete(recording.id);
      deletingIdsRef.current = remainingDeletingIds;

      if (mountedRef.current) {
        setDeletingIds(remainingDeletingIds);
      }
    }
  }

  return (
    <section className="content-panel review-panel" aria-labelledby="review-title">
      <p className="eyebrow">Review</p>
      <h1 id="review-title">历史记录</h1>
      <p>保存后的本地录音会显示在这里，你可以回放表现、比较不同练习轮次，并删除不再需要的记录。</p>

      <div className="review-filters" aria-label="复盘筛选">
        {reviewFilters.map((nextFilter) => (
          <button
            type="button"
            aria-pressed={filter === nextFilter.value}
            key={nextFilter.value}
            onClick={() => setFilter(nextFilter.value)}
          >
            {nextFilter.label}
          </button>
        ))}
      </div>
      {!isLoading && (
        <p className="review-count">
          共 {recordings.length} 条，当前显示 {filteredRecordings.length} 条
        </p>
      )}

      <div className="review-history" aria-live="polite">
        {isLoading && <p className="notice">正在读取本地记录...</p>}
        {errorMessage && <p className="error">{errorMessage}</p>}

        {!isLoading && recordings.length === 0 && (
          <section className="empty-state" aria-labelledby="empty-recordings-title">
            <h2 id="empty-recordings-title">还没有录音</h2>
            <p>先去练习页完成一轮录音，再回来复盘。</p>
          </section>
        )}

        {!isLoading && recordings.length > 0 && filteredRecordings.length === 0 && (
          <section className="empty-state" aria-labelledby="empty-filtered-recordings-title">
            <h2 id="empty-filtered-recordings-title">没有符合筛选的录音</h2>
            <p>切换筛选条件，或先完成对应类型的练习。</p>
          </section>
        )}

        {!isLoading && filteredRecordings.length > 0 && (
          <ul className="recording-list" aria-label="录音历史">
            {filteredRecordings.map((recording) => (
              <RecordingHistoryItem
                isDeleting={deletingIds.has(recording.id)}
                key={recording.id}
                onDelete={(nextRecording) => void removeRecording(nextRecording)}
                recording={recording}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default ReviewPage;

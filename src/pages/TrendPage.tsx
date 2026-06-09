import { useEffect, useMemo, useRef, useState } from 'react';
import { listRecordings } from '../data/recordingRepository';
import { formatDuration, type RecordingRecord } from '../domain/practice';
import { buildSevenDayTrend, type DailyTrend } from '../domain/trends';

function formatSeconds(ms: number | null): string {
  return ms === null ? '无指标' : `${(ms / 1_000).toFixed(1)} 秒`;
}

function formatPercent(value: number | null): string {
  return value === null ? '无指标' : `${Math.round(value * 100)}%`;
}

function TrendSummary({ trend }: { trend: DailyTrend[] }) {
  const totals = useMemo(() => {
    const daysWithMetrics = trend.filter((day) => day.averagePauseRatio !== null);
    const recordingCount = trend.reduce((total, day) => total + day.recordingCount, 0);
    const totalDurationMs = trend.reduce((total, day) => total + day.totalDurationMs, 0);
    const averagePauseRatio =
      daysWithMetrics.length > 0
        ? daysWithMetrics.reduce((total, day) => total + (day.averagePauseRatio ?? 0), 0) / daysWithMetrics.length
        : null;

    return {
      averagePauseRatio,
      recordingCount,
      totalDurationMs
    };
  }, [trend]);

  return (
    <section className="trend-summary" aria-label="最近 7 天摘要">
      <article>
        <span>训练次数</span>
        <strong>{totals.recordingCount}</strong>
      </article>
      <article>
        <span>训练时长</span>
        <strong>{formatDuration(totals.totalDurationMs)}</strong>
      </article>
      <article>
        <span>平均停顿占比</span>
        <strong>{formatPercent(totals.averagePauseRatio)}</strong>
      </article>
    </section>
  );
}

function TrendTable({ trend }: { trend: DailyTrend[] }) {
  return (
    <div className="trend-table-wrap">
      <table className="trend-table">
        <thead>
          <tr>
            <th scope="col">日期</th>
            <th scope="col">次数</th>
            <th scope="col">总时长</th>
            <th scope="col">停顿占比</th>
            <th scope="col">起说延迟</th>
            <th scope="col">长停顿</th>
          </tr>
        </thead>
        <tbody>
          {trend.map((day) => (
            <tr key={day.date}>
              <td>{day.date}</td>
              <td>{day.recordingCount}</td>
              <td>{formatDuration(day.totalDurationMs)}</td>
              <td>{formatPercent(day.averagePauseRatio)}</td>
              <td>{formatSeconds(day.averageStartDelayMs)}</td>
              <td>{day.longPauseCount} 次</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrendPage({ today = new Date() }: { today?: Date }) {
  const mountedRef = useRef(false);
  const [recordings, setRecordings] = useState<RecordingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const trend = useMemo(() => buildSevenDayTrend(recordings, today), [recordings, today]);
  const hasMetrics = trend.some((day) => day.averagePauseRatio !== null);

  useEffect(() => {
    mountedRef.current = true;
    setIsLoading(true);
    setErrorMessage(null);

    async function loadTrendData() {
      try {
        const nextRecordings = await listRecordings();
        if (mountedRef.current) {
          setRecordings(nextRecordings);
        }
      } catch {
        if (mountedRef.current) {
          setRecordings([]);
          setErrorMessage('读取趋势数据失败，请重试。');
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    }

    void loadTrendData();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  return (
    <section className="content-panel trend-panel" aria-labelledby="trend-title">
      <p className="eyebrow">Trend</p>
      <h1 id="trend-title">趋势</h1>
      <p>最近 7 天的本地流利度指标会显示在这里，用来观察起说速度、停顿比例和长停顿次数的变化。</p>

      {isLoading && <p className="notice">正在读取趋势数据...</p>}
      {errorMessage && <p className="error">{errorMessage}</p>}

      {!isLoading && !hasMetrics && (
        <section className="empty-state" aria-labelledby="empty-trend-title">
          <h2 id="empty-trend-title">还没有可用的流利度指标</h2>
          <p>先完成并保存一次带本地分析的训练，趋势页会开始累计最近 7 天的数据。</p>
        </section>
      )}

      {!isLoading && hasMetrics && (
        <>
          <h2 className="section-title">最近 7 天</h2>
          <TrendSummary trend={trend} />
          <TrendTable trend={trend} />
        </>
      )}
    </section>
  );
}

export default TrendPage;

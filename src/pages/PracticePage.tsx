import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, RotateCcw, Save, Square } from 'lucide-react';
import { createRecording } from '../data/recordingRepository';
import { formatDuration, type ScriptedDialogueTurnRecord } from '../domain/practice';
import { buildLocalReviewSummary } from '../domain/recordingReview';
import {
  getPracticeTaskById,
  getPracticeTaskTypeLabel,
  listPracticeModules,
  listPracticeTasksByModule,
  type PracticeModuleId,
  type PracticeTask
} from '../domain/taskCatalog';
import { useRecorder } from '../hooks/useRecorder';

type LatestRecording = NonNullable<ReturnType<typeof useRecorder>['latestRecording']>;

const practiceModules = listPracticeModules();

function buildDialogueTurnRecord(
  task: PracticeTask | null,
  turnIndex: number | null
): ScriptedDialogueTurnRecord | undefined {
  if (!task || task.type !== 'scripted-dialogue' || turnIndex === null) {
    return undefined;
  }

  const turn = task.turns[turnIndex];
  if (!turn) {
    return undefined;
  }

  return {
    turnId: turn.id,
    turnIndex,
    totalTurns: task.turns.length,
    npcLine: turn.npcLine,
    userPrompt: turn.userPrompt,
    expectedSlots: [...turn.expectedSlots]
  };
}

function TaskDetail({
  selectedDialogueTurnIndex = 0,
  task
}: {
  selectedDialogueTurnIndex?: number;
  task: PracticeTask;
}) {
  if (task.type === 'scripted-dialogue') {
    const currentTurnIndex = Math.min(Math.max(selectedDialogueTurnIndex, 0), task.turns.length - 1);
    const currentTurn = task.turns[currentTurnIndex];

    return (
      <section className="task-detail" aria-label="情境对话任务说明">
        <div>
          <span className="task-meta">{getPracticeTaskTypeLabel(task.type)} · {task.difficulty} · {task.durationSec} 秒</span>
          <h2>{task.title}</h2>
          <p>{task.scenario}</p>
          <p className="task-goal">目标：{task.userGoal}</p>
        </div>

        {currentTurn && (
          <section className="dialogue-turn-panel" aria-label="当前对话轮次">
            <div className="dialogue-turn-heading">
              <span>第 {currentTurnIndex + 1}/{task.turns.length} 轮</span>
              <strong>当前回应目标</strong>
            </div>
            <div className="dialogue-turn-lines">
              <p>
                <span>NPC：</span>
                {currentTurn.npcLine}
              </p>
              <p>
                <span>你的回应：</span>
                {currentTurn.userPrompt}
              </p>
            </div>
            <p className="slot-list">预期槽位：{currentTurn.expectedSlots.join('、')}</p>
          </section>
        )}

        <ExpressionList expressions={task.usefulExpressions} />
      </section>
    );
  }

  return (
    <section className="task-detail" aria-label="看图描述任务说明">
      <div>
        <span className="task-meta">{getPracticeTaskTypeLabel(task.type)} · {task.difficulty} · {task.durationSec} 秒</span>
        <h2>{task.title}</h2>
        <p>{task.scene}</p>
      </div>

      <div className="picture-prompt" role="img" aria-label={task.imageAlt}>
        <span>{task.imageAlt}</span>
      </div>

      <section>
        <h3>描述步骤</h3>
        <ol>
          {task.descriptionSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <ExpressionList expressions={task.usefulExpressions} />
    </section>
  );
}

function ExpressionList({ expressions }: { expressions: string[] }) {
  return (
    <section>
      <h3>可用表达</h3>
      <ul className="expression-list">
        {expressions.map((expression) => (
          <li key={expression}>{expression}</li>
        ))}
      </ul>
    </section>
  );
}

function PracticePage() {
  const recorder = useRecorder();
  const currentRecordingRef = useRef<LatestRecording | null>(null);
  const selectedTaskRef = useRef<PracticeTask | null>(null);
  const selectedDialogueTurnRef = useRef<number | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<PracticeModuleId | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedDialogueTurnIndex, setSelectedDialogueTurnIndex] = useState(0);
  const [recordingTaskId, setRecordingTaskId] = useState<string | null>(null);
  const [recordingDialogueTurnIndex, setRecordingDialogueTurnIndex] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedRecording, setSavedRecording] = useState<LatestRecording | null>(null);

  const selectedModule = selectedModuleId
    ? (practiceModules.find((module) => module.id === selectedModuleId) ?? null)
    : null;
  const moduleTasks = selectedModuleId ? listPracticeTasksByModule(selectedModuleId) : [];
  const selectedTask = selectedTaskId ? getPracticeTaskById(selectedTaskId) : null;
  const recordingTask = recordingTaskId ? getPracticeTaskById(recordingTaskId) : null;

  selectedTaskRef.current = selectedTask;
  selectedDialogueTurnRef.current = selectedTask?.type === 'scripted-dialogue' ? selectedDialogueTurnIndex : null;

  useEffect(() => {
    currentRecordingRef.current = recorder.latestRecording;
    setSaveMessage(null);
    setSaveError(null);
    setIsSaving(false);
    setSavedRecording(null);

    if (!recorder.latestRecording) {
      setAudioUrl(null);
      setRecordingTaskId(null);
      setRecordingDialogueTurnIndex(null);
      return;
    }

    setRecordingTaskId((currentTaskId) => currentTaskId ?? selectedTaskRef.current?.id ?? null);
    setRecordingDialogueTurnIndex((currentTurnIndex) => currentTurnIndex ?? selectedDialogueTurnRef.current);
    const nextAudioUrl = URL.createObjectURL(recorder.latestRecording.blob);
    setAudioUrl(nextAudioUrl);

    return () => {
      URL.revokeObjectURL(nextAudioUrl);
    };
  }, [recorder.latestRecording]);

  const durationLabel = useMemo(() => {
    return recorder.latestRecording ? formatDuration(recorder.latestRecording.durationMs) : '0:00';
  }, [recorder.latestRecording]);

  const taskToSave = recordingTask ?? selectedTask;
  const isSaveDisabled = isSaving || !recorder.latestRecording || !taskToSave || savedRecording === recorder.latestRecording;

  function clearSaveState() {
    setSaveMessage(null);
    setSaveError(null);
    setSavedRecording(null);
    setIsSaving(false);
  }

  function startRecording() {
    if (!selectedTask) {
      return;
    }

    clearSaveState();
    setRecordingTaskId(selectedTask.id);
    setRecordingDialogueTurnIndex(selectedTask.type === 'scripted-dialogue' ? selectedDialogueTurnIndex : null);
    recorder.start();
  }

  function enterModule(moduleId: PracticeModuleId) {
    setSelectedModuleId(moduleId);
    setSelectedTaskId(null);
    setSelectedDialogueTurnIndex(0);
    clearSaveState();
  }

  function backToModules() {
    setSelectedModuleId(null);
    setSelectedTaskId(null);
    setSelectedDialogueTurnIndex(0);
    clearSaveState();
  }

  function selectTask(taskId: string) {
    setSelectedTaskId(taskId);
    setSelectedDialogueTurnIndex(0);
    clearSaveState();
  }

  function moveDialogueTurn(nextIndex: number) {
    if (!selectedTask || selectedTask.type !== 'scripted-dialogue') {
      return;
    }

    setSelectedDialogueTurnIndex(Math.min(Math.max(nextIndex, 0), selectedTask.turns.length - 1));
    setSaveMessage(null);
    setSaveError(null);
  }

  async function saveLatestRecording() {
    if (!recorder.latestRecording || isSaveDisabled || !taskToSave) {
      return;
    }

    const recordingToSave = recorder.latestRecording;
    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      const dialogueTurnToSave = buildDialogueTurnRecord(
        taskToSave,
        recordingDialogueTurnIndex ?? (taskToSave.id === selectedTask?.id ? selectedDialogueTurnIndex : null)
      );

      await createRecording({
        taskType: taskToSave.type,
        taskId: taskToSave.id,
        title: taskToSave.title,
        blob: recordingToSave.blob,
        mimeType: recordingToSave.mimeType,
        durationMs: recordingToSave.durationMs,
        dialogueTurn: dialogueTurnToSave,
        reviewSummary: buildLocalReviewSummary(taskToSave, recordingToSave.durationMs)
      });

      if (currentRecordingRef.current === recordingToSave) {
        setSavedRecording(recordingToSave);
        setSaveMessage('已保存到本地历史记录。');
        if (
          dialogueTurnToSave &&
          selectedTaskRef.current?.id === taskToSave.id &&
          selectedDialogueTurnRef.current === dialogueTurnToSave.turnIndex &&
          dialogueTurnToSave.turnIndex < dialogueTurnToSave.totalTurns - 1
        ) {
          setSelectedDialogueTurnIndex(dialogueTurnToSave.turnIndex + 1);
        }
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
    setRecordingTaskId(null);
    setRecordingDialogueTurnIndex(null);
    recorder.reset();
  }

  return (
    <section className="content-panel practice-panel" aria-labelledby="practice-title">
      <p className="eyebrow">Practice</p>
      <h1 id="practice-title">录音练习</h1>
      <p>选择一个本地任务，按提示完成英文输出。当前阶段不接入 ASR 或 LLM，先训练连续开口和任务完成度。</p>

      {!selectedModule && (
        <section className="module-selector" aria-label="核心练习模块">
          {practiceModules.map((module) => (
            <button className="module-card" type="button" key={module.id} onClick={() => enterModule(module.id)}>
              <span>核心功能</span>
              <strong>{module.title}</strong>
              <small>{module.taskCount} 个素材</small>
              <p>{module.summary}</p>
              <em>进入{module.title}</em>
            </button>
          ))}
        </section>
      )}

      {selectedModule && (
        <>
          <div className="module-header">
            <button className="secondary-control" type="button" onClick={backToModules}>
              返回模块
            </button>
            <div>
              <span>当前模块</span>
              <h2>{selectedModule.title}</h2>
              <p>{selectedModule.summary}</p>
            </div>
          </div>

          <section className="task-selector" aria-label={`${selectedModule.title}素材`}>
            {moduleTasks.map((task) => (
              <button
                className="task-card"
                type="button"
                aria-pressed={task.id === selectedTask?.id}
                key={task.id}
                onClick={() => selectTask(task.id)}
              >
                <span>{getPracticeTaskTypeLabel(task.type)}</span>
                <strong>{task.title}</strong>
                <small>{task.durationSec} 秒 · {task.difficulty}</small>
              </button>
            ))}
          </section>
        </>
      )}

      {selectedTask && <TaskDetail selectedDialogueTurnIndex={selectedDialogueTurnIndex} task={selectedTask} />}

      {selectedTask?.type === 'scripted-dialogue' && (
        <div className="dialogue-turn-controls" aria-label="脚本轮次控制">
          <button
            className="secondary-control"
            type="button"
            disabled={selectedDialogueTurnIndex === 0}
            onClick={() => moveDialogueTurn(selectedDialogueTurnIndex - 1)}
          >
            上一轮
          </button>
          <button
            className="secondary-control"
            type="button"
            disabled={selectedDialogueTurnIndex >= selectedTask.turns.length - 1}
            onClick={() => moveDialogueTurn(selectedDialogueTurnIndex + 1)}
          >
            下一轮
          </button>
        </div>
      )}

      {selectedTask && (
        <section className="practice-recorder" aria-label="录音面板">
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
      )}
    </section>
  );
}

export default PracticePage;

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReviewPage from './ReviewPage';

const mocks = vi.hoisted(() => ({
  deleteRecording: vi.fn(),
  listRecordings: vi.fn()
}));

vi.mock('../data/recordingRepository', () => ({
  deleteRecording: mocks.deleteRecording,
  listRecordings: mocks.listRecordings
}));

function createSavedRecording(overrides = {}) {
  return {
    id: 'rec-1',
    taskType: 'free-recording',
    title: '自由录音练习',
    blob: new Blob(['audio'], { type: 'audio/webm' }),
    mimeType: 'audio/webm',
    durationMs: 61_000,
    createdAt: '2026-06-05T10:00:00.000Z',
    ...overrides
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

describe('ReviewPage history flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listRecordings.mockResolvedValue([createSavedRecording()]);
    mocks.deleteRecording.mockResolvedValue(undefined);
  });

  it('renders saved recordings', async () => {
    const { container } = render(<ReviewPage />);

    expect(await screen.findByText('自由录音练习')).toBeInTheDocument();
    expect(screen.getAllByText('自由录音')).toHaveLength(2);
    expect(screen.getByText(/1:01/)).toBeInTheDocument();
    expect(screen.queryByText('本地复盘')).not.toBeInTheDocument();
    expect(container.querySelector('.recording-review-summary-placeholder')).toBeInTheDocument();
  });

  it('renders local review summaries when available', async () => {
    mocks.listRecordings.mockResolvedValue([
      createSavedRecording({
        taskType: 'picture-description',
        taskId: 'picture-office-whiteboard',
        title: '办公室白板讨论',
        reviewSummary: {
          source: 'local-rules',
          durationBand: 'too-short',
          durationLabel: '时长偏短',
          targetDurationSec: 60,
          checklist: ['总述画面', '描述至少 3 个细节', '补充合理推测'],
          retryTip: '下一轮先按“总述-细节-推测”说满 60 秒。'
        }
      })
    ]);

    render(<ReviewPage />);

    expect(await screen.findByText('办公室白板讨论')).toBeInTheDocument();
    expect(screen.getByText('本地复盘')).toBeInTheDocument();
    expect(screen.getByText('时长偏短')).toBeInTheDocument();
    expect(screen.getByText('建议目标：60 秒')).toBeInTheDocument();
    expect(screen.getByText('描述至少 3 个细节')).toBeInTheDocument();
    expect(screen.getByText('下一轮先按“总述-细节-推测”说满 60 秒。')).toBeInTheDocument();
  });

  it('renders scripted dialogue turn metadata when available', async () => {
    mocks.listRecordings.mockResolvedValue([
      createSavedRecording({
        taskType: 'scripted-dialogue',
        taskId: 'dialogue-coffee-order',
        title: '咖啡店点单',
        dialogueTurn: {
          turnId: 'coffee-order-drink',
          turnIndex: 0,
          totalTurns: 3,
          npcLine: 'Hi there. What can I get for you today?',
          userPrompt: '说明你想要的饮品和杯型。',
          expectedSlots: ['drink']
        }
      })
    ]);

    render(<ReviewPage />);

    expect(await screen.findByText('咖啡店点单')).toBeInTheDocument();
    expect(screen.getByText('第 1/3 轮')).toBeInTheDocument();
    expect(screen.getByText('NPC：Hi there. What can I get for you today?')).toBeInTheDocument();
    expect(screen.getByText('你的回应：说明你想要的饮品和杯型。')).toBeInTheDocument();
  });

  it('filters recordings by task type', async () => {
    const user = userEvent.setup();
    mocks.listRecordings.mockResolvedValue([
      createSavedRecording(),
      createSavedRecording({
        id: 'rec-2',
        taskType: 'scripted-dialogue',
        taskId: 'dialogue-coffee-order',
        title: '咖啡店点单'
      }),
      createSavedRecording({
        id: 'rec-3',
        taskType: 'picture-description',
        taskId: 'picture-office-whiteboard',
        title: '办公室白板讨论'
      }),
      createSavedRecording({
        id: 'rec-4',
        taskType: 'starter',
        title: '句型启动旧记录'
      })
    ]);

    render(<ReviewPage />);

    await screen.findByText('咖啡店点单');
    expect(screen.getByText('共 4 条，当前显示 4 条')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '看图描述' }));

    expect(screen.getByText('办公室白板讨论')).toBeInTheDocument();
    expect(screen.getByText('共 4 条，当前显示 1 条')).toBeInTheDocument();
    expect(screen.queryByText('咖啡店点单')).not.toBeInTheDocument();
    expect(screen.queryByText('自由录音练习')).not.toBeInTheDocument();
  });

  it('shows and filters legacy starter recordings', async () => {
    const user = userEvent.setup();
    mocks.listRecordings.mockResolvedValue([
      createSavedRecording({
        id: 'rec-starter',
        taskType: 'starter',
        title: '句型启动旧记录'
      })
    ]);

    render(<ReviewPage />);

    expect(await screen.findByText('句型启动旧记录')).toBeInTheDocument();
    expect(screen.getAllByText('句型启动')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: '句型启动' }));

    expect(screen.getByText('句型启动旧记录')).toBeInTheDocument();
    expect(screen.getByText('共 1 条，当前显示 1 条')).toBeInTheDocument();
  });

  it('deletes a saved recording', async () => {
    const user = userEvent.setup();
    render(<ReviewPage />);

    await user.click(await screen.findByRole('button', { name: '删除 自由录音练习' }));

    await waitFor(() => expect(mocks.deleteRecording).toHaveBeenCalledWith('rec-1'));
  });

  it('refreshes the list after deleting a saved recording', async () => {
    const user = userEvent.setup();
    mocks.listRecordings.mockResolvedValueOnce([createSavedRecording()]).mockResolvedValueOnce([]);
    render(<ReviewPage />);

    await user.click(await screen.findByRole('button', { name: '删除 自由录音练习' }));

    expect(await screen.findByRole('heading', { name: '还没有录音' })).toBeInTheDocument();
    expect(screen.queryByText('自由录音练习')).not.toBeInTheDocument();
  });

  it('prevents duplicate deletes while a recording is being deleted', async () => {
    const user = userEvent.setup();
    const deleteRequest = createDeferred<void>();
    mocks.deleteRecording.mockReturnValue(deleteRequest.promise);
    render(<ReviewPage />);

    const deleteButton = await screen.findByRole('button', { name: '删除 自由录音练习' });
    await user.dblClick(deleteButton);

    expect(deleteButton).toBeDisabled();
    expect(mocks.deleteRecording).toHaveBeenCalledTimes(1);
  });

  it('shows a recoverable error when loading recordings fails', async () => {
    mocks.listRecordings.mockRejectedValue(new Error('indexeddb unavailable'));

    render(<ReviewPage />);

    expect(await screen.findByText('读取历史记录失败，请重试。')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '还没有录音' })).toBeInTheDocument();
  });

  it('shows a recoverable error when deleting a recording fails', async () => {
    const user = userEvent.setup();
    mocks.deleteRecording.mockRejectedValue(new Error('delete failed'));
    render(<ReviewPage />);

    await user.click(await screen.findByRole('button', { name: '删除 自由录音练习' }));

    expect(await screen.findByText('删除失败，请重试。')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '删除 自由录音练习' })).toBeEnabled();
  });

  it('does not refresh after unmount when a pending delete finishes', async () => {
    const user = userEvent.setup();
    const deleteRequest = createDeferred<void>();
    mocks.deleteRecording.mockReturnValue(deleteRequest.promise);
    const { unmount } = render(<ReviewPage />);

    await user.click(await screen.findByRole('button', { name: '删除 自由录音练习' }));
    unmount();
    deleteRequest.resolve();

    await waitFor(() => expect(mocks.deleteRecording).toHaveBeenCalledWith('rec-1'));
    expect(mocks.listRecordings).toHaveBeenCalledTimes(1);
  });
});

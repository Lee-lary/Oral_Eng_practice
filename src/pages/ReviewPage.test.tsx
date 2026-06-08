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

function createSavedRecording() {
  return {
    id: 'rec-1',
    taskType: 'free-recording',
    title: '自由录音练习',
    blob: new Blob(['audio'], { type: 'audio/webm' }),
    mimeType: 'audio/webm',
    durationMs: 61_000,
    createdAt: '2026-06-05T10:00:00.000Z'
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
    render(<ReviewPage />);

    expect(await screen.findByText('自由录音练习')).toBeInTheDocument();
    expect(screen.getByText(/1:01/)).toBeInTheDocument();
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

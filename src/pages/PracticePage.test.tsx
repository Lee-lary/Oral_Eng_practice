import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PracticePage from './PracticePage';

const mocks = vi.hoisted(() => ({
  createRecording: vi.fn(),
  useRecorder: vi.fn()
}));

vi.mock('../data/recordingRepository', () => ({
  createRecording: mocks.createRecording
}));

vi.mock('../hooks/useRecorder', () => ({
  useRecorder: mocks.useRecorder
}));

function createLatestRecording(durationMs = 4_200) {
  return {
    blob: new Blob(['audio'], { type: 'audio/webm' }),
    durationMs,
    mimeType: 'audio/webm'
  };
}

function createRecorderState(latestRecording: ReturnType<typeof createLatestRecording> | null = createLatestRecording()) {
  return {
    status: 'ready',
    latestRecording,
    error: null,
    isRecording: false,
    start: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn()
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

describe('PracticePage recording flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useRecorder.mockReturnValue(createRecorderState());
    mocks.createRecording.mockResolvedValue({});
  });

  it('renders the ready recording playback state', () => {
    render(<PracticePage />);

    expect(screen.getByRole('heading', { name: '录音练习' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /进入情境对话/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /进入看图描述/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /咖啡店点单/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /办公室白板讨论/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '保存本轮录音' })).not.toBeInTheDocument();
  });

  it('shows only the selected module materials after entering a module', async () => {
    const user = userEvent.setup();
    render(<PracticePage />);

    await user.click(screen.getByRole('button', { name: /进入情境对话/ }));

    expect(screen.getByRole('button', { name: /咖啡店点单/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /酒店入住登记/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /办公室白板讨论/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '返回模块' })).toBeInTheDocument();
  });

  it('returns from module materials to the module overview', async () => {
    const user = userEvent.setup();
    render(<PracticePage />);

    await user.click(screen.getByRole('button', { name: /进入看图描述/ }));
    expect(screen.getByRole('button', { name: /办公室白板讨论/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '返回模块' }));

    expect(screen.getByRole('button', { name: /进入情境对话/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /办公室白板讨论/ })).not.toBeInTheDocument();
  });

  it('shows picture description prompts after selecting a picture task', async () => {
    const user = userEvent.setup();
    render(<PracticePage />);

    await user.click(screen.getByRole('button', { name: /进入看图描述/ }));
    await user.click(screen.getByRole('button', { name: /办公室白板讨论/ }));

    expect(screen.getByText('先用一句话总述画面。')).toBeInTheDocument();
    expect(screen.getByText('再描述三处可见细节。')).toBeInTheDocument();
  });

  it('saves the selected task metadata', async () => {
    const user = userEvent.setup();
    const recording = createLatestRecording();
    mocks.useRecorder.mockReturnValue(createRecorderState(null));
    const { rerender } = render(<PracticePage />);

    await user.click(screen.getByRole('button', { name: /进入看图描述/ }));
    await user.click(screen.getByRole('button', { name: /办公室白板讨论/ }));
    mocks.useRecorder.mockReturnValue(createRecorderState(recording));
    rerender(<PracticePage />);
    await user.click(screen.getByRole('button', { name: '保存本轮录音' }));

    await waitFor(() =>
      expect(mocks.createRecording).toHaveBeenCalledWith(
        expect.objectContaining({
          taskType: 'picture-description',
          taskId: 'picture-office-whiteboard',
          title: '办公室白板讨论'
        })
      )
    );
  });

  it('keeps a completed recording bound to the task active when it was created', async () => {
    const user = userEvent.setup();
    const recording = createLatestRecording();
    mocks.useRecorder.mockReturnValue(createRecorderState(null));
    const { rerender } = render(<PracticePage />);

    await user.click(screen.getByRole('button', { name: /进入情境对话/ }));
    await user.click(screen.getByRole('button', { name: /咖啡店点单/ }));
    mocks.useRecorder.mockReturnValue(createRecorderState(recording));
    rerender(<PracticePage />);
    await user.click(screen.getByRole('button', { name: '返回模块' }));
    await user.click(screen.getByRole('button', { name: /进入看图描述/ }));
    await user.click(screen.getByRole('button', { name: /办公室白板讨论/ }));
    await user.click(screen.getByRole('button', { name: '保存本轮录音' }));

    await waitFor(() =>
      expect(mocks.createRecording).toHaveBeenCalledWith(
        expect.objectContaining({
          taskType: 'scripted-dialogue',
          taskId: 'dialogue-coffee-order',
          title: '咖啡店点单'
        })
      )
    );
  });

  it('keeps a recording bound when the user switches tasks before it is ready', async () => {
    const user = userEvent.setup();
    const recording = createLatestRecording();
    mocks.useRecorder.mockReturnValue(createRecorderState(null));
    const { rerender } = render(<PracticePage />);

    await user.click(screen.getByRole('button', { name: /进入情境对话/ }));
    await user.click(screen.getByRole('button', { name: /咖啡店点单/ }));
    await user.click(screen.getByRole('button', { name: '开始录音' }));
    await user.click(screen.getByRole('button', { name: '返回模块' }));
    await user.click(screen.getByRole('button', { name: /进入看图描述/ }));
    await user.click(screen.getByRole('button', { name: /办公室白板讨论/ }));

    mocks.useRecorder.mockReturnValue(createRecorderState(recording));
    rerender(<PracticePage />);
    await user.click(screen.getByRole('button', { name: '保存本轮录音' }));

    await waitFor(() =>
      expect(mocks.createRecording).toHaveBeenCalledWith(
        expect.objectContaining({
          taskType: 'scripted-dialogue',
          taskId: 'dialogue-coffee-order',
          title: '咖啡店点单'
        })
      )
    );
  });

  it('prevents duplicate saves for the same recording', async () => {
    const user = userEvent.setup();
    const save = createDeferred<unknown>();
    mocks.createRecording.mockReturnValue(save.promise);
    render(<PracticePage />);

    await user.click(screen.getByRole('button', { name: /进入情境对话/ }));
    await user.click(screen.getByRole('button', { name: /咖啡店点单/ }));
    const saveButton = screen.getByRole('button', { name: '保存本轮录音' });
    await user.click(saveButton);
    expect(saveButton).toBeDisabled();

    await user.click(saveButton);
    expect(mocks.createRecording).toHaveBeenCalledTimes(1);

    save.resolve({});
    await waitFor(() => expect(screen.getByText('已保存到本地历史记录。')).toBeInTheDocument());
    expect(saveButton).toBeDisabled();
  });

  it('shows a recoverable error when saving fails', async () => {
    const user = userEvent.setup();
    mocks.createRecording.mockRejectedValue(new Error('storage unavailable'));
    render(<PracticePage />);

    await user.click(screen.getByRole('button', { name: /进入情境对话/ }));
    await user.click(screen.getByRole('button', { name: /咖啡店点单/ }));
    await user.click(screen.getByRole('button', { name: '保存本轮录音' }));

    expect(await screen.findByText('保存失败，请重试。')).toBeInTheDocument();
    expect(screen.queryByText('已保存到本地历史记录。')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存本轮录音' })).toBeEnabled();
  });

  it('clears stale save state when the latest recording changes', async () => {
    const user = userEvent.setup();
    const firstRecording = createLatestRecording(4_200);
    const secondRecording = createLatestRecording(8_000);
    mocks.useRecorder.mockReturnValue(createRecorderState(firstRecording));
    const { rerender } = render(<PracticePage />);

    await user.click(screen.getByRole('button', { name: /进入情境对话/ }));
    await user.click(screen.getByRole('button', { name: /咖啡店点单/ }));
    await user.click(screen.getByRole('button', { name: '保存本轮录音' }));
    expect(await screen.findByText('已保存到本地历史记录。')).toBeInTheDocument();

    mocks.useRecorder.mockReturnValue(createRecorderState(secondRecording));
    rerender(<PracticePage />);

    expect(screen.queryByText('已保存到本地历史记录。')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存本轮录音' })).toBeEnabled();
  });

  it('does not apply a stale save completion to a later recording with matching metadata', async () => {
    const user = userEvent.setup();
    const firstRecording = createLatestRecording(4_200);
    const secondRecording = createLatestRecording(4_200);
    const save = createDeferred<unknown>();
    mocks.createRecording.mockReturnValue(save.promise);
    mocks.useRecorder.mockReturnValue(createRecorderState(firstRecording));
    const { rerender } = render(<PracticePage />);

    await user.click(screen.getByRole('button', { name: /进入情境对话/ }));
    await user.click(screen.getByRole('button', { name: /咖啡店点单/ }));
    await user.click(screen.getByRole('button', { name: '保存本轮录音' }));

    mocks.useRecorder.mockReturnValue(createRecorderState(secondRecording));
    rerender(<PracticePage />);

    save.resolve({});

    await waitFor(() => expect(mocks.createRecording).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('已保存到本地历史记录。')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存本轮录音' })).toBeEnabled();
  });
});

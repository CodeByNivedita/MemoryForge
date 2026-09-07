import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  act,
} from '@testing-library/react';
import App from '../../App';
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
describe('Store and recall workspace', () => {
  it('animates storage, then synchronizes the graph and recalled output on one timeline', () => {
    vi.useFakeTimers();
    render(<App embedded />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Load Cross into drawing' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Store Pattern' }));
    expect(
      screen.getByRole('button', { name: 'Pause weight replay' })
    ).toBeTruthy();
    act(() => {
      vi.advanceTimersByTime(6000);
    });
    expect(
      (screen.getByLabelText('Storage rows') as HTMLInputElement).value
    ).toBe('64');
    fireEvent.change(screen.getByLabelText('Network stage noise'), {
      target: { value: '20' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run recall ↗' }));
    expect(
      screen.getByRole('button', { name: 'Pause neuron playback' })
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next update' }));
    expect(
      (screen.getByLabelText('Neuron update timeline') as HTMLInputElement)
        .value
    ).toBe('0');
    expect(
      screen.getByRole('img', { name: /Recalled output at update 1:/ })
    ).toBeTruthy();
    fireEvent.click(screen.getByText('Sweep navigation & restart'));
    fireEvent.click(screen.getByRole('button', { name: 'Next sweep' }));
    expect(
      (screen.getByLabelText('Neuron update timeline') as HTMLInputElement)
        .value
    ).toBe('63');
    expect(
      screen.getByRole('img', { name: /Recalled output at update 64:/ })
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Previous sweep' }));
    expect(
      (screen.getByLabelText('Neuron update timeline') as HTMLInputElement)
        .value
    ).toBe('-1');
    fireEvent.click(screen.getByRole('button', { name: 'Reset cue' }));
    expect(screen.queryByLabelText('Neuron update timeline')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Pause weight replay' })
    ).toBeNull();
  }, 15000);
});

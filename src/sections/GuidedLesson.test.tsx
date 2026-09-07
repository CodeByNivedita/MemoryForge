import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { GuidedLesson } from './GuidedLesson';
afterEach(cleanup);
describe('Guided learning sequence', () => {
  it('gates steps, computes results and passes the completed scenario to the playground', () => {
    const open = vi.fn();
    render(<GuidedLesson onOpenLab={open} />);
    expect(screen.queryByRole('button', { name: 'Continue →' })).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: 'Store four patterns' })
    );
    expect(
      screen.getByText('4 patterns stored · 0 pixels changed')
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continue →' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Flip 20% of the pixels' })
    );
    expect(
      screen.getByText('4 patterns stored · 13 pixels changed')
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continue →' }));
    fireEvent.click(screen.getByRole('button', { name: 'Run actual recall' }));
    expect(
      screen.getByText(
        /4 patterns stored · 13 pixels changed · exact recall: yes/
      )
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Next update' }));
    expect(
      screen.getByText('Values recorded at this exact update.')
    ).toBeTruthy();
    fireEvent.click(screen.getByText('Sweep navigation & restart'));
    fireEvent.click(screen.getByRole('button', { name: 'Restart trace' }));
    expect(
      screen.queryByText('Values recorded at this exact update.')
    ).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Continue →' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Add 12 memories and recall' })
    );
    expect(
      screen.getByText(
        /16 patterns stored · 13 pixels changed · exact recall: no/
      )
    ).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continue →' }));
    const finish = screen.getByRole('button', {
      name: 'Finish the lesson',
    }) as HTMLButtonElement;
    expect(finish.disabled).toBe(true);
    fireEvent.click(
      screen.getByLabelText('It is stable; accuracy still needs to be checked.')
    );
    expect(finish.disabled).toBe(false);
    fireEvent.click(finish);
    fireEvent.click(
      screen.getByRole('button', { name: /Continue in the playground/ })
    );
    expect(open).toHaveBeenCalledOnce();
    const scenario = open.mock.calls[0][0];
    expect(scenario.stored).toHaveLength(16);
    expect(scenario.cue).not.toBe(
      scenario.stored.find((p: { id: string }) => p.id === scenario.selectedId)
        .cells
    );
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { NetworkView } from './NetworkView';
import { projectNeurons } from './networkGeometry';
import { createWeightMatrix } from '../../engine/hebbian';
afterEach(cleanup);
describe('Network camera', () => {
  it('preserves all 64 identities in bounded 2D and 3D projections', () => {
    for (const spatial of [true, false])
      for (const angle of [0, 1, 3, 6]) {
        const points = projectNeurons(angle, spatial);
        expect(new Set(points.map((p) => p.i)).size).toBe(64);
        points.forEach((p) => {
          expect(Number.isFinite(p.x + p.y + p.scale)).toBe(true);
          expect(p.x).toBeGreaterThan(0);
          expect(p.x).toBeLessThan(520);
          expect(p.y).toBeGreaterThan(0);
          expect(p.y).toBeLessThan(380);
        });
      }
  });
  it('changes the camera without changing the model, and permits keyboard inspection', () => {
    const cells = Array(64).fill(1);
    const weights = createWeightMatrix([cells]);
    const before = JSON.stringify({ weights, cells });
    const select = vi.fn();
    render(
      <NetworkView
        cells={cells}
        weights={weights}
        selected={0}
        onSelect={select}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '3D' }));
    fireEvent.change(screen.getByLabelText('Network camera rotation'), {
      target: { value: '180' },
    });
    fireEvent.click(screen.getByRole('button', { name: '2D' }));
    expect(
      (screen.getByLabelText('Network camera rotation') as HTMLInputElement)
        .disabled
    ).toBe(true);
    fireEvent.click(screen.getByLabelText('All connections'));
    fireEvent.keyDown(
      screen.getByRole('button', { name: 'Inspect neuron 5, state 1' }),
      { key: 'Enter' }
    );
    expect(select).toHaveBeenCalledWith(4);
    expect(JSON.stringify({ weights, cells })).toBe(before);
  });
});

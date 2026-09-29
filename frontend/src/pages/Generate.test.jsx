import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Generate from './Generate';
import { timetableApi } from '../services/timetableApi';

vi.mock('../services/timetableApi', () => ({
  timetableApi: {
    generateTimetable: vi.fn()
  }
}));

describe('Generate Page Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('1. Renders Generate page with configured academic parameters', () => {
    render(<Generate onNavigate={vi.fn()} />);

    expect(screen.getByText('Generate College Timetable')).toBeTruthy();
    expect(screen.getByText('Configured Academic Parameters')).toBeTruthy();
    expect(screen.getByText('Departments')).toBeTruthy();
    expect(screen.getByText('Sections')).toBeTruthy();

    const generateBtn = screen.getByTestId('generate-timetable-btn');
    expect(generateBtn).toBeTruthy();
    expect(generateBtn.textContent).toContain('Generate Timetable');
  });

  it('2. Shows loading state during generation execution', async () => {
    let resolveGeneration;
    timetableApi.generateTimetable.mockReturnValue(new Promise((resolve) => {
      resolveGeneration = resolve;
    }));

    render(<Generate onNavigate={vi.fn()} />);

    const generateBtn = screen.getByTestId('generate-timetable-btn');
    fireEvent.click(generateBtn);

    expect(screen.getByTestId('generation-loading-state')).toBeTruthy();
    expect(screen.getByText(/Generating Timetable.../i)).toBeTruthy();

    resolveGeneration({
      success: true,
      data: {
        timetableId: 10,
        conflictCount: 0,
        verified: true,
        attempts: 4,
        schedule: [{ id: 1 }]
      }
    });

    await waitFor(() => {
      expect(screen.getByTestId('generation-result-card')).toBeTruthy();
    });
  });

  it('3. Successfully displays metrics and results on successful generation', async () => {
    timetableApi.generateTimetable.mockResolvedValueOnce({
      success: true,
      data: {
        timetableId: 42,
        conflictCount: 0,
        verified: true,
        attempts: 12,
        schedule: new Array(128).fill({ id: 1 })
      }
    });

    const mockGeneratedCallback = vi.fn();
    render(<Generate onNavigate={vi.fn()} onTimetableGenerated={mockGeneratedCallback} />);

    fireEvent.click(screen.getByTestId('generate-timetable-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('generation-result-card')).toBeTruthy();
      expect(screen.getByText('#42')).toBeTruthy();
      expect(screen.getByText('128')).toBeTruthy();
      expect(screen.getByText('12')).toBeTruthy();
      expect(screen.getByText(/Clean timetable generated with 0 conflicts/i)).toBeTruthy();
      expect(mockGeneratedCallback).toHaveBeenCalledWith(42);
    });
  });

  it('4. Displays appropriate warning banner when conflicts > 0', async () => {
    timetableApi.generateTimetable.mockResolvedValueOnce({
      success: true,
      data: {
        timetableId: 43,
        conflictCount: 3,
        verified: false,
        attempts: 100,
        schedule: new Array(120).fill({ id: 1 })
      }
    });

    render(<Generate onNavigate={vi.fn()} />);
    fireEvent.click(screen.getByTestId('generate-timetable-btn'));

    await waitFor(() => {
      expect(screen.getByText(/Schedule completed with 3 validation conflicts/i)).toBeTruthy();
    });
  });

  it('5. Displays error state with Try Again button when generation fails', async () => {
    timetableApi.generateTimetable.mockRejectedValueOnce(new Error('Database lock timeout'));

    render(<Generate onNavigate={vi.fn()} />);
    fireEvent.click(screen.getByTestId('generate-timetable-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('generation-error-state')).toBeTruthy();
      expect(screen.getByText(/Database lock timeout/i)).toBeTruthy();
      expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy();
    });
  });

  it('6. Triggers Regenerate Timetable and executes authoritative generation again', async () => {
    timetableApi.generateTimetable
      .mockResolvedValueOnce({
        success: true,
        data: { timetableId: 101, conflictCount: 0, verified: true, attempts: 2, schedule: [{ id: 1 }] }
      })
      .mockResolvedValueOnce({
        success: true,
        data: { timetableId: 102, conflictCount: 0, verified: true, attempts: 5, schedule: [{ id: 2 }] }
      });

    render(<Generate onNavigate={vi.fn()} />);
    fireEvent.click(screen.getByTestId('generate-timetable-btn'));

    await waitFor(() => {
      expect(screen.getByText('#101')).toBeTruthy();
      expect(screen.getByTestId('regenerate-timetable-btn')).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId('regenerate-timetable-btn'));

    await waitFor(() => {
      expect(timetableApi.generateTimetable).toHaveBeenCalledTimes(2);
      expect(screen.getByText('#102')).toBeTruthy();
    });
  });
});

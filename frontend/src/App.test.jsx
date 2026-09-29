import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';

// Mock timetable API calls used by embedded TimetableViewer & RedesignedViewer
vi.mock('./services/timetableApi', () => ({
  timetableApi: {
    getAllRuns: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getMetadata: vi.fn().mockResolvedValue({ success: true, data: { divisions: [], instructors: [], rooms: [], batches: [] } }),
    getRunById: vi.fn().mockResolvedValue({ success: true, data: { entries: [] } }),
    getRunFiltered: vi.fn().mockResolvedValue({ success: true, data: { entries: [] } }),
    generateTimetable: vi.fn().mockResolvedValue({ success: true, data: { timetableId: 1, conflictCount: 0, verified: true, attempts: 1, schedule: [] } })
  }
}));

describe('App Phase 2 Foundation & Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it('1. Renders Navbar branding and Home page hero successfully', () => {
    render(<App />);

    // Brand check
    expect(screen.getByText('TimetableGen')).toBeTruthy();
    expect(screen.getByText('College Scheduling System')).toBeTruthy();

    // Hero title check
    expect(screen.getByText('College Timetable')).toBeTruthy();
    expect(screen.getByText('Generator')).toBeTruthy();

    // Quick start check
    expect(screen.getByText('Get Started in 8 Easy Steps')).toBeTruthy();
    expect(screen.getAllByText('Department').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sections').length).toBeGreaterThan(0);

    // Academic Data Overview check
    expect(screen.getByText('Academic Data Overview')).toBeTruthy();
  });

  it('2. Navigates to Data Entry management page and back', () => {
    render(<App />);

    const dataEntryNav = screen.getByTestId('nav-data-entry');
    fireEvent.click(dataEntryNav);

    expect(screen.getByRole('heading', { name: 'Add Department' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /departments/i })).toBeTruthy();
    expect(screen.getByRole('tab', { name: /divisions/i })).toBeTruthy();

    // Return to home
    const homeBtn = screen.getByTestId('nav-home');
    fireEvent.click(homeBtn);
    expect(screen.getByText('Get Started in 8 Easy Steps')).toBeTruthy();
  });

  it('3. Navigates to functional Generate page', () => {
    render(<App />);

    // Click the prominent Generate button in navbar
    const generateBtn = screen.getByTestId('nav-generate');
    fireEvent.click(generateBtn);

    expect(screen.getByRole('heading', { name: /generate college timetable/i })).toBeTruthy();
    expect(screen.getByTestId('generate-timetable-btn')).toBeTruthy();
  });

  it('4. Navigates to Timetable page displaying RedesignedViewer', async () => {
    render(<App />);

    const timetableNav = screen.getByTestId('nav-timetable');
    fireEvent.click(timetableNav);

    expect(screen.getByText('Timetable Schedule Viewer')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByTestId('redesigned-timetable-viewer')).toBeTruthy();
    });
  });
});

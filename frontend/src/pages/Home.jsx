import React from 'react';
import LandingHero from '../components/home/LandingHero';
import QuickStartSteps from '../components/home/QuickStartSteps';
import DataOverviewStats from '../components/home/DataOverviewStats';

export default function Home({ onNavigate }) {
  return (
    <main role="main">
      <LandingHero onNavigate={onNavigate} />
      <QuickStartSteps />
      <DataOverviewStats />
    </main>
  );
}

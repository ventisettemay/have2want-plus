import React, { useState } from 'react';
import { Satellite } from 'lucide-react';
import SpacecraftInspectorModal from './SpacecraftInspectorModal';
import { SatelliteId } from '@/lib/satelliteModularEngine';

interface OrbitalSatellitesHubProps {
  currentUser?: any;
  onOpenChat?: (merchantId: string) => void;
  onTogglePolitical?: () => void;
  isPoliticalActive?: boolean;
  onToggleWeather?: () => void;
  isWeatherActive?: boolean;
  onLaunchSatellite?: (satId: SatelliteId) => void;
  onFocusSatelliteOnGlobe?: (satId: SatelliteId) => void;
  onAddWantListing?: (listing: any) => void;
}

export default function OrbitalSatellitesHub({
  onLaunchSatellite,
  onFocusSatelliteOnGlobe,
}: OrbitalSatellitesHubProps) {
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [selectedSatForFleet, setSelectedSatForFleet] = useState<SatelliteId | null>(null);
  const [fleetTab, setFleetTab] = useState<'INSPECTOR' | 'CONTROLS'>('CONTROLS');

  return (
    <>
      {/* Pulsante Controllo Flotta 10 Satelliti (zero modali duplicati: delega sempre a MapView3DContainer) */}
      <div className="relative">
        <button
          id="btn-orbital-satellites-menu"
          type="button"
          onClick={() => {
            setFleetTab('CONTROLS');
            setIsFleetModalOpen(true);
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all shadow-lg border ${
            isFleetModalOpen
              ? 'bg-[#00ff66] text-black border-[#00ff66] shadow-[#00ff66]/20'
              : 'bg-zinc-950/90 hover:bg-zinc-900 text-white border-zinc-700/80 hover:border-emerald-500/70'
          }`}
          title="Controllo Flotta 10 Satelliti: Interruttori ON/OFF, 7 Preset e Ispezione 3D"
        >
          <Satellite className="w-3.5 h-3.5 text-[#00ff66] shrink-0" />
          <span className="font-black tracking-wide">FLOTTA 10 SATELLITI</span>
        </button>
      </div>

      {/* 🛰️ MODALE CONTROLLO FLOTTA 10 SATELLITI & ISPEZIONE 3D */}
      <SpacecraftInspectorModal
        isOpen={isFleetModalOpen}
        selectedSatelliteId={selectedSatForFleet}
        initialTab={fleetTab}
        onClose={() => setIsFleetModalOpen(false)}
        onLaunchChannel={(satId) => {
          setIsFleetModalOpen(false);
          if (onLaunchSatellite) {
            onLaunchSatellite(satId);
          }
        }}
        onSelectSatellite={(satId) => setSelectedSatForFleet(satId)}
        onFocusSatelliteOnGlobe={onFocusSatelliteOnGlobe}
      />
    </>
  );
}

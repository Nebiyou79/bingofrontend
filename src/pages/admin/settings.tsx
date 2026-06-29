/**
 * pages/admin/settings.tsx
 */
import React, { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { Card, SectionTitle, Btn, Input, Select, useToast } from '../../components/admin/AdminUI';
import { useAdminSettings } from '../../hooks/useAdmin';

const AdminSettings: NextPage = () => {
  const { settings, loading, saving, saved, save } = useAdminSettings();
  const { show, Toast } = useToast();

  const [drawInterval, setDrawInterval]       = useState('3000');
  const [lobbyDuration, setLobbyDuration]     = useState('60');
  const [minPlayers, setMinPlayers]           = useState('2');
  const [maintenance, setMaintenance]         = useState(false);
  const [maintenanceMsg, setMaintenanceMsg]   = useState('');

  useEffect(() => {
    if (!settings) return;
    setDrawInterval(String(settings.game?.drawIntervalMs ?? 3000));
    setLobbyDuration(String(settings.game?.lobbyDurationSeconds ?? 60));
    setMinPlayers(String(settings.game?.minPlayersToStart ?? 2));
    setMaintenance(settings.platform?.maintenanceMode ?? false);
    setMaintenanceMsg(settings.platform?.maintenanceMessage ?? '');
  }, [settings]);

  const handleSave = async () => {
    const res = await save({
      game: {
        drawIntervalMs:       Number(drawInterval),
        lobbyDurationSeconds: Number(lobbyDuration),
        minPlayersToStart:    Number(minPlayers),
      },
      platform: {
        maintenanceMode:    maintenance,
        maintenanceMessage: maintenanceMsg,
      },
    });
    show(res.success ? 'Settings saved' : (res as any).error, res.success ? 'ok' : 'err');
  };

  return (
    <>
      <Head>
        <title>Settings — DashBets Admin</title>
        <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&family=Exo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <AdminLayout title="Settings">
        <Toast />
        {loading ? (
          <p className="text-center py-20 text-gray-700 font-mono animate-pulse">Loading…</p>
        ) : (
          <div className="max-w-2xl space-y-5">
            {/* Game settings */}
            <Card>
              <SectionTitle>Game Settings</SectionTitle>
              <div className="space-y-4">
                <Input
                  label="Draw Interval (ms)"
                  value={drawInterval}
                  onChange={setDrawInterval}
                  type="number"
                />
                <Input
                  label="Lobby Duration (seconds)"
                  value={lobbyDuration}
                  onChange={setLobbyDuration}
                  type="number"
                />
                <Input
                  label="Min Players to Start"
                  value={minPlayers}
                  onChange={setMinPlayers}
                  type="number"
                />
              </div>
            </Card>

            {/* Platform */}
            <Card>
              <SectionTitle>Platform</SectionTitle>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">Maintenance Mode</p>
                    <p className="text-[10px] text-gray-600">All games disabled, maintenance message shown</p>
                  </div>
                  <button
                    onClick={() => setMaintenance(m => !m)}
                    className="w-11 h-6 rounded-full transition-all relative"
                    style={{
                      background: maintenance ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                      border: `1px solid ${maintenance ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
                    }}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all"
                      style={{ left: maintenance ? 'calc(100% - 22px)' : '2px' }}
                    />
                  </button>
                </div>
                {maintenance && (
                  <Input
                    label="Maintenance Message"
                    value={maintenanceMsg}
                    onChange={setMaintenanceMsg}
                    placeholder="Message shown to users…"
                  />
                )}
              </div>
            </Card>

            <Btn onClick={handleSave} disabled={saving} size="md">
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Settings'}
            </Btn>
          </div>
        )}
      </AdminLayout>
    </>
  );
};

export default AdminSettings;


// ─────────────────────────────────────────────────────────────────────────────
// pages/admin/autowin.tsx  (paste into separate file)
// ─────────────────────────────────────────────────────────────────────────────
export const AdminAutoWinPage = () => null; // placeholder — see admin-autowin.tsx


/**
 * pages/admin/analytics.tsx
 */
export const AdminAnalyticsExport = () => null;
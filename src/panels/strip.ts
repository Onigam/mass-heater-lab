import type { StripAlarm, StripValue } from '@onigam/lab-kit/ui';
import type { MassHeaterSim } from '../sim/engine';
import { SPEEDS } from '../sim/presets';
import { ALARM_TEXTS } from '../sim/texts';
import { num, st, sx } from './strings';

// What the bottom strip of the frame shows: six live values, the hour, the alarms.

export function stripValues(sim: MassHeaterSim): StripValue[] {
  const s = sim.state;
  return [
    { label: st('stripFire'), value: num(s.firePower / 1000, 1), unit: 'kW', cls: 'live--water' },
    { label: st('stripDraft'), value: num(s.draft, 0), unit: 'Pa' },
    { label: st('stripExhaust'), value: num(s.exhaustT), unit: '°C' },
    { label: st('stripDrum'), value: num(s.drumLidT), unit: '°C' },
    { label: st('stripSeat'), value: num(s.seatHotT), unit: '°C' },
    { label: st('stripRoom'), value: num(s.roomT, 1), unit: '°C' },
  ];
}

export function stripClock(sim: MassHeaterSim): { time: string; sub: string } {
  const s = sim.state;
  const hh = Math.floor(s.hour);
  const mm = Math.floor((s.hour - hh) * 60);
  return { time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, sub: sx('phase', s.phase) };
}

export function stripAlarms(sim: MassHeaterSim): StripAlarm[] {
  return sim.state.alarms.map((a) => ({ key: a, label: sx('alarm', a), severe: ALARM_TEXTS[a].severe }));
}

export const STRIP_SPEEDS = SPEEDS;

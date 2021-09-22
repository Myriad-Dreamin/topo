export interface AgendaScheduleProps {
  estimated?: number;
  percent?: number;
  maxTime?: number;
}

export interface TimeBullet extends AgendaScheduleProps {
  name: string;
  estimated: number;
}

export interface FullTimeBlock {
  id: number;
  name: string;
  estimated: number;
  charger: TimeBullet[];
}

export interface TimeBlock {
  name: string;
  charger: TimeBullet[];
}

export interface AgendaPart {
  name: string;
  start: number;
  end: number;
  estimated?: number;
  blocks: TimeBlock[];
}

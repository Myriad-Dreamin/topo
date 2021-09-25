export interface TopoNodeScheduleProps {
  estimated?: number;
  percent?: number;
  maxTime?: number;
}

export interface TimeBullet extends TopoNodeScheduleProps {
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

export interface TopoNode {
  id?: number;
  name: string;
  start: number;
  end: number;
  estimated?: number;
  blocks: TimeBlock[];
}

import {exec} from 'child_process';
import {TimeUnit} from '@proto/timeUnit';
import {AgendaPart, TimeBullet} from '@proto/agenda';
import {TopoAgendaAlgorithmService} from './agenda.algorithm.service';
import {Inject, Injectable} from '@nestjs/common';
import {convertDailyDurationToDur, convertDailyDurationToHM} from '@lib/duration';

function notifyUser(title: string, msg: string) {
  exec(`notify-send "${title}" "${msg}"`);
}

class DailyNotifier {
  lastNotified: number = 0;
  lastDay: number = 0;
  currentTime: number = 0;
  currentDay: number = 0;

  constructor() {
    this.notify();
    this.notifyEnd();
    this.lastNotified = this.lastDay;
  }

  notify() {
    const n = new Date();
    this.currentTime = n.getTime();
    this.currentDay = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  }

  notifyEnd() {
    this.lastNotified = this.currentTime;
    this.lastDay = this.currentDay;
  }

  notifiedTime(dt: number): boolean {
    if (this.lastDay != this.currentDay) {
      const lastNode = this.lastDay + dt;
      if (this.lastNotified <= lastNode && lastNode < this.currentTime) {
        return true;
      }
    }
    const node = this.currentDay + dt;
    return this.lastNotified <= node && node < this.currentTime;
  }

  notified(hh: number, mm: number = 0, ss: number = 0): boolean {
    const dt = hh * TimeUnit.Hour + mm * TimeUnit.Minute + ss * TimeUnit.Second;
    return this.notifiedTime(dt);
  }
}

function formatBullet(tb: TimeBullet): string {
  return `${tb.name} (${convertDailyDurationToDur(tb.estimated, 0)})`;
}

class TopoLinuxReporter {
  n: DailyNotifier;

  constructor() {
    this.n = new DailyNotifier();
  }

  report(context: TopoReporterContext, ex: () => boolean): Promise<void> {
    return new Promise((resolve) => {
      if (context.changed) {
        this.n.notify();

        for (const interval of context.topo) {
          if (this.n.notifiedTime(interval.start)) {
            const blocks = interval.blocks.map(block =>
              `${block.name}[${block.charger.map(bullet => formatBullet(bullet)).join(', ')}]`).join(', ');
            notifyUser('topo',
              `时间节点 (${interval.name}, ${convertDailyDurationToHM(interval.start)}~${convertDailyDurationToHM(interval.end)}): ${blocks}`);
          }
        }

        this.n.notifyEnd();
      }
      resolve(undefined);
    });
  }
}

interface TopoReporterContext {
  topo: AgendaPart[];
  changed: boolean;
}

@Injectable()
export class TopoReporterService implements TopoReporterContext {
  topo: AgendaPart[] = [];
  changed = false;
  protected linuxReporter: TopoLinuxReporter;

  constructor(@Inject(TopoAgendaAlgorithmService) protected algorithmService: TopoAgendaAlgorithmService) {
    this.linuxReporter = new TopoLinuxReporter();
  }

  report(ex: () => boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      let entering = false;
      const iTimer = setInterval(() => {
        if (ex()) {
          clearInterval(iTimer);
          resolve(undefined);
        }

        if (entering) {
          return;
        }

        entering = true;
        this.reportInternal(ex).catch(console.error).finally(() => {
          entering = false;
        });

      }, 1000);
    });
  }

  protected async reportInternal(ex: () => boolean): Promise<void> {
    if (this.topo.length === 0) {
      this.topo = this.algorithmService.getUserRes();
      if (this.topo.length) {
        this.changed = true;
      }
    }
    await Promise.all([
      this.linuxReporter.report(this, ex),
    ]);
    this.changed = false;
  }
}

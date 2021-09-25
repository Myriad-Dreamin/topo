import {AgendaPart, AgendaScheduleProps, FullTimeBlock, TimeBlock, TimeBullet} from '@proto/agenda';
import {TimeUnit} from '@proto/timeUnit';
import {TopoAlgorithmParams} from '@proto/backend.algorithm';


type WithAgendaScheduleProps<T> = {
  value: T;
} & AgendaScheduleProps;

class AgendaScheduler {
  public leftTime: number;

  constructor(
    public totalTime: number) {
    this.leftTime = totalTime;
  }

  schedule(g: AgendaScheduleProps, defaultValue = 0): number {
    let e = 0;
    if (g.percent) {
      e = this.totalTime * g.percent / 100;
    } else {
      e = g.estimated || defaultValue;
    }

    e = Math.min(e, this.leftTime);
    this.leftTime -= e;
    return e;
  }

  reclaim(t: number): void {
    this.leftTime += t;
  }

  noMore(): boolean {
    return this.leftTime <= 0;
  }
}

function generateAgendaBlock(block: FullTimeBlock, estimateTime: number): [TimeBlock, number] {
  const charger: TimeBullet[] = [];
  let pSum = 100;

  // todo: all with force percent

  const insertBullet = (bullet: TimeBullet, scheduleTime: number) => {
    if (estimateTime <= 0) {
      return estimateTime;
    }

    if (scheduleTime) {
      if (bullet.maxTime) {
        scheduleTime = Math.min(scheduleTime, bullet.maxTime);
      }

      if (scheduleTime % (TimeUnit.Hour / 2)) {
        scheduleTime += TimeUnit.Hour / 2 - scheduleTime % (TimeUnit.Hour / 2);
      }
      charger.push({
        name: bullet.name,
        estimated: scheduleTime,
      })
      estimateTime -= scheduleTime;
    }
    // log(bullet.name, estimateTime);
    return estimateTime;
  }

  if (estimateTime > 0) {
    for (const bullet of block.charger) {
      if (bullet.percent) {
        const p = Math.min(bullet.percent, pSum);
        pSum -= p;
        const scheduleTime = Math.round(estimateTime * p / 100);
        if (insertBullet(bullet, scheduleTime) <= 0) {
          break;
        }
      }
    }
  }

  if (estimateTime > 0) {
    for (const bullet of block.charger) {
      if (!bullet.percent) {
        const scheduleTime = Math.min(estimateTime, bullet.estimated);
        if (insertBullet(bullet, bullet.estimated ? scheduleTime : estimateTime) <= 0) {
          break;
        }
      }
    }
  }

  return [{
    name: block.name,
    charger,
  }, estimateTime];
}

function generateAgendaPart(part: AgendaPart, restTime: number, blocks: WithAgendaScheduleProps<FullTimeBlock>[]): [AgendaPart, number] {
  const scheduler = new AgendaScheduler(restTime);
  for (const block of blocks) {
    const scheduleTime = scheduler.schedule(block, scheduler.leftTime);
    if (scheduleTime) {
      // log(block.value.name, scheduleTime);
      const [g, rest] = generateAgendaBlock(block.value, scheduleTime);
      part.blocks.push(g);
      if (rest > 0) {
        scheduler.reclaim(rest);
      }
    }
    if (scheduler.noMore()) {
      break;
    }
  }
  return [part, scheduler.leftTime];
}

type AgendaTask = {
  part: AgendaPart;
  blocks: WithAgendaScheduleProps<FullTimeBlock>[];
} & AgendaScheduleProps;

function generateAgendaTask(params: TopoAlgorithmParams): AgendaTask[] {
  const taskParts: AgendaTask[] = [];
  const blockIndices = new Map<number, FullTimeBlock>();
  const taskIndices = new Map<number, AgendaTask & {
    bullets: Map<FullTimeBlock, TimeBullet[]>,
  }>();
  const intervalIndices = new Map<number, AgendaPart>();
  const affSum = new Map<string, number>();
  const affChn = new Map<string, number>();
  let incId = 0xfff00000;

  for (const block of params.blocks) {
    if (!block.id && block.id !== 0) {
      block.id = incId++;
    }
    blockIndices.set(block.id, block);
  }

  for (const inv of params.intervals) {
    if (!inv.id && inv.id !== 0) {
      inv.id = incId++;
    }
    intervalIndices.set(inv.id, inv);
    taskIndices.set(inv.id, {
      part: {...inv, blocks: []},
      bullets: new Map<FullTimeBlock, TimeBullet[]>(),
      blocks: [],
    });
  }

  for (const aff of params.topology.blockAffinity) {
    const block = blockIndices.get(aff.blockId);
    const inv = intervalIndices.has(aff.intervalId);
    if (!block || !inv) {
      throw new Error('invalid block affinity config');
    }
    let names: string[];
    if (aff.bulletName) {
      names = [aff.bulletName];
    } else {
      names = block.charger.map(bullet => bullet.name);
    }
    for (const n of names) {
      {
        const dotPath = [aff.intervalId, aff.blockId, n].map(x => x.toString()).join('.');
        const sum = affChn.get(dotPath) || 0;
        affChn.set(dotPath, sum + 1);
      }
      {
        const dotPath = [aff.blockId, n].map(x => x.toString()).join('.');
        const sum = affSum.get(dotPath) || 0;
        affSum.set(dotPath, sum + 1);
      }
    }
  }

  const defId = params.topology.defaultIntervalId;

  for (const block of params.blocks) {
    for (const bullet of block.charger) {
      let forbidden = false;
      if (params.topology.bulletForbidden) {
        for (const fb of params.topology.bulletForbidden) {
          if (fb.blockId === block.id && fb.bulletName === bullet.name) {
            forbidden = true;
            break;
          }
        }
      }
      if (forbidden) {
        continue;
      }

      let pathExists = false;
      for (const inv of params.intervals) {
        const arrPath: (string | number)[] = [inv.id!, block.id!, bullet.name];
        const dotPath = arrPath.map((x: string | number) => x.toString()).join('.');
        const chn = affChn.get(dotPath);
        if (chn && pathExists) {
          throw new Error('not supported affinity mode');
        }

        if (chn) {
          pathExists = true;
          const bulletMapping = taskIndices.get(inv.id!)!.bullets;
          const b = bulletMapping.get(block) || [];
          b.push({...bullet});
          bulletMapping.set(block, b);
        }
      }

      if (!pathExists) {
        const bulletMapping = taskIndices.get(defId)!.bullets;
        const b = bulletMapping.get(block) || [];
        b.push({...bullet});
        bulletMapping.set(block, b);
      }
    }
  }

  for (const inv of params.intervals) {
    const task = taskIndices.get(inv.id!)!;
    const bulletMapping = task.bullets;
    if (bulletMapping) {
      bulletMapping.forEach((v, k) => {

        const cloneBlock: FullTimeBlock = {...k};
        cloneBlock.charger = v;
        task.blocks.push({
          value: cloneBlock,
        });
      });
    }
    // delete (task as any).bullets;
    taskParts.push(task);
  }

  return taskParts;
}

export function generateTopoAgendaGreedyImpl(params: TopoAlgorithmParams): AgendaPart[] {
  const parts = [];
  const scheduler = new AgendaScheduler(params.topology.workTime);
  const taskParts = generateAgendaTask(params);

  for (const taskPart of taskParts) {
    let scheduleTime = scheduler.schedule(taskPart, taskPart.part.end - taskPart.part.start);
    // log(taskPart.part.name, scheduleTime);
    if (scheduleTime) {
      const [g, rest] = generateAgendaPart(taskPart.part, scheduleTime, taskPart.blocks);
      parts.push(g);
      if (rest > 0) {
        scheduler.reclaim(rest);
      }
    }
    if (scheduler.noMore()) {
      break;
    }
  }
  return parts;
}

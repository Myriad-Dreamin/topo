import {Component, OnInit} from '@angular/core';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {AgendaPart, AgendaScheduleProps, FullTimeBlock, TimeBlock, TimeBullet} from '@proto/agenda';
import {TimeUnit} from '@proto/timeUnit';

const research: FullTimeBlock = {
  id: 1,
  name: '科研',
  estimated: 0,
  charger: [
    {
      name: '网络调研',
      estimated: 30 * TimeUnit.Day,
    },
    {
      name: '论文阅读',
      estimated: 30 * TimeUnit.Day,
      percent: 10,
    },
    {
      name: '代码',
      estimated: 30 * TimeUnit.Day,
      percent: 30,
    },
    {
      name: '实验',
      estimated: 30 * TimeUnit.Day,
    },
    {
      name: '写作',
      estimated: 30 * TimeUnit.Day,
    },
    {
      name: '摸鱼',
      estimated: 1 * TimeUnit.Day,
      percent: 30,
    },
  ],
};

const study: FullTimeBlock = {
  id: 2,
  name: '学习',
  estimated: 0,
  charger: [
    {
      name: '写作',
      estimated: 0,
      maxTime: 1 * TimeUnit.Hour,
    },
    {
      name: '英语',
      estimated: 0,
      maxTime: 1 * TimeUnit.Hour,
    },
    {
      name: '音乐',
      estimated: 0,
    },
  ],
};

const entertainment: FullTimeBlock = {
  id: 2,
  name: '摸',
  estimated: 0,
  charger: [
    {
      name: '摸鱼',
      estimated: 0,
      maxTime: 1 * TimeUnit.Hour,
    },
    {
      name: '听音乐',
      estimated: 0,
      maxTime: 1 * TimeUnit.Hour,
    },
    {
      name: '看小说',
      estimated: 0,
      maxTime: 1 * TimeUnit.Hour,
    },
  ],
};

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

function generatePreviewBlock(block: FullTimeBlock): TimeBlock {
  const charger: TimeBullet[] = block.charger.map(bullet => ({
    name: bullet.name,
    estimated: bullet.estimated || 0,
  }));

  return {
    name: block.name,
    charger,
  };
}

function generateAgendaPart(part: AgendaPart, restTime: number, blocks: WithAgendaScheduleProps<FullTimeBlock>[]): AgendaPart {
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
  return part;
}

function generateAgenda(task: ({
  part: AgendaPart;
  blocks: WithAgendaScheduleProps<FullTimeBlock>[];
} & AgendaScheduleProps)[
  ], estimated?: number): AgendaPart[] {
  const parts = [];
  const scheduler = new AgendaScheduler(estimated || TimeUnit.Day);
  for (const taskPart of task) {
    let scheduleTime = scheduler.schedule(taskPart, taskPart.part.end - taskPart.part.start);
    // log(taskPart.part.name, scheduleTime);
    if (scheduleTime) {
      parts.push(generateAgendaPart(taskPart.part, scheduleTime, taskPart.blocks));
    }
    if (scheduler.noMore()) {
      break;
    }
  }
  return parts;
}

function splitCharger(tb: FullTimeBlock, parts: string[], commonParts?: string[]): [FullTimeBlock, FullTimeBlock] {
  commonParts = commonParts || [];
  const left: FullTimeBlock = {...tb, charger: []}, right: FullTimeBlock = {...tb, charger: []};
  for (const bullet of tb.charger) {
    if (parts.includes(bullet.name)) {
      left.charger.push(bullet);
    } else if (commonParts.includes(bullet.name)) {
      left.charger.push(bullet);
      right.charger.push(bullet);
    } else {
      right.charger.push(bullet);
    }
  }
  return [left, right];
}

const [researchAM, researchPMFull] = splitCharger(research, ['网络调研'], ['论文阅读']);
const [researchPM, researchFull] = splitCharger(researchPMFull, ['论文阅读', '代码']);

interface FlattenBullet {
  block: TimeBlock;
  bullet: TimeBullet;
}

interface FlattenAgendaPart {
  part: AgendaPart;
  bullets: FlattenBullet[];
}

function flattenPart(parts: AgendaPart[]): FlattenAgendaPart[] {
  const bullets: FlattenAgendaPart[] = [];
  for (const part of parts) {
    for (const block of part.blocks) {
      const newPart: FlattenAgendaPart = {
        part,
        bullets: [],
      };
      bullets.push(newPart);
      for (const bullet of block.charger) {
        newPart.bullets.push({
          block,
          bullet,
        });
      }
    }
  }
  return bullets;
}

function flattenBlock(blocks: TimeBlock[]): FlattenBullet[] {
  const bullets: FlattenBullet[] = [];
  for (const block of blocks) {
    for (const bullet of block.charger) {
      bullets.push({
        block,
        bullet,
      });
    }
  }
  return bullets;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit {
  title = 'todo';
  editing = false;
  todoBlocks: AgendaPart[] = generateAgenda([
    {
      part: {
        name: '上午',
        start: 9 * TimeUnit.Hour,
        end: 11.5 * TimeUnit.Hour,
        blocks: [],
      },
      blocks: [
        {value: researchAM},
      ]
    },
    {
      part: {
        name: '下午',
        start: 13.5 * TimeUnit.Hour,
        end: 18 * TimeUnit.Hour,
        blocks: [],
      },
      blocks: [
        {value: researchPM},
      ]
    },
    {
      part: {
        name: '全日 (晚上)',
        start: 9 * TimeUnit.Hour,
        end: 21 * TimeUnit.Hour,
        blocks: [],
      },
      blocks: [
        {value: researchFull, percent: 30},
        {value: study, percent: 30},
        {value: entertainment},
      ]
    }
  ], 12 * TimeUnit.Hour);
  doneBlocks: TimeBlock[] = [
    generatePreviewBlock(research),
    generatePreviewBlock(study),
    generatePreviewBlock(entertainment),
  ];
  flattenTodo: FlattenAgendaPart[] = [];
  flattenDone: FlattenBullet[] = [];

  ngOnInit(): void {
    this.flattenTodo = flattenPart(this.todoBlocks);
    this.flattenDone = flattenBlock(this.doneBlocks);
  }

  dayDur(dur: number): string {
    const hh = Math.floor(dur / TimeUnit.Hour);
    const mm = Math.round((dur - hh * TimeUnit.Hour) / TimeUnit.Minute);
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  }

  drop(event: CdkDragDrop<FlattenBullet[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex);
    }
  }
}

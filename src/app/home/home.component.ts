import {AfterViewInit, Component, OnInit} from '@angular/core';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {AgendaPart, AgendaScheduleProps, FullTimeBlock, TimeBlock, TimeBullet} from '@proto/agenda';
import {TimeUnit} from '@proto/timeUnit';
import {BezierEdge, BezierEdgeModel, h, LogicFlow, RectNode, RectNodeModel} from '@logicflow/core';
import {HttpClient} from '@angular/common/http';
import {TopoAppGenericData} from '@proto/backend';


class FlowEdge extends BezierEdge {
  getEdge(): h.JSX.Element {
    const edge = super.getEdge();
    edge.props.class = 'flow-edge-path';
    return edge;
  }

  getArrow(): h.JSX.Element {
    const edge = super.getArrow();
    edge.props.class = 'flow-edge-arrow';
    edge.props.style.strokeWidth = 0;
    edge.props.style.stroke = 'rgba(0,0,0,0)';
    edge.props.style.fill = 'rgba(0,0,0,0)';
    // edge.props.style = {};
    return edge;
  }
}

class BulletNode extends RectNode {
}

class BulletNodeModel extends RectNodeModel {
  setAttributes() {
    this.height = 25;
  }
}

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

function generateAgenda(params: TopoAlgorithmParams): AgendaPart[] {
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

type TopoDurationConfig = string | number;

interface TopoConfig {
  intervals: (Omit<AgendaPart, 'estimated' | 'start' | 'end'> & {
    estimated: TopoDurationConfig;
    start: TopoDurationConfig;
    end: TopoDurationConfig;
  })[];
  blocks: (Omit<FullTimeBlock, 'estimated' | 'maxTime' | 'charger'> & {
    estimated: TopoDurationConfig;
    maxTime: TopoDurationConfig;
    charger: (Omit<FullTimeBlock['charger'][number], 'estimated' | 'maxTime'> & {
      estimated: TopoDurationConfig;
      maxTime: TopoDurationConfig;
    })[]
  })[];
  topology: {
    workTime: TopoDurationConfig;
    defaultIntervalId: number;
    bulletForbidden: {
      blockId: number;
      bulletName: string;
    }[];
    blockAffinity: {
      intervalId: number;
      blockId: number;
      bulletName?: string;
      weight?: number;
    }[];
  };
}

interface TopoAlgorithmParams {
  intervals: AgendaPart[];
  blocks: FullTimeBlock[];
  topology: {
    workTime: number;
    defaultIntervalId: number;
    bulletForbidden: {
      blockId: number;
      bulletName: string;
    }[];
    blockAffinity: {
      intervalId: number;
      blockId: number;
      bulletName?: string;
      weight?: number;
    }[];
  },
}

const algorithms = new Map<string, (topo: TopoAlgorithmParams) => (AgendaPart[])>();
algorithms.set('default', generateAgenda);

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

const units = new Map<string, number>();
units.set('h', TimeUnit.Hour);
units.set('mi', TimeUnit.Minute);
units.set('s', TimeUnit.Second);
units.set('ms', TimeUnit.Millisecond);
units.set('d', TimeUnit.Day);

function convertDurationString(str: string | number): number {
  if (typeof str !== 'string') {
    return str;
  }

  const xxx = /([\d.]+)(\w+)/g;
  let ea: RegExpExecArray | null;
  let sumDuration = 0;
  while ((ea = xxx.exec(str))) {
    const b = Number.parseInt(ea[1]);
    const u = units.get(ea[2]) || 1;
    sumDuration += b * u;
  }
  return sumDuration;
}

function convertConfig(conf: TopoConfig): TopoAlgorithmParams {
  for (const block of conf.blocks) {
    if (typeof block.estimated === 'string') {
      block.estimated = convertDurationString(block.estimated);
    }
    for (const bullet of block.charger) {
      if (typeof bullet.estimated === 'string') {
        bullet.estimated = convertDurationString(bullet.estimated);
      }
      if (typeof bullet.maxTime === 'string') {
        bullet.maxTime = convertDurationString(bullet.maxTime);
      }
    }
  }
  for (const interval of conf.intervals) {
    if (typeof interval.estimated === 'string') {
      interval.estimated = convertDurationString(interval.estimated);
    }
    if (typeof interval.start === 'string') {
      interval.start = convertDurationString(interval.start);
    }
    if (typeof interval.end === 'string') {
      interval.end = convertDurationString(interval.end);
    }
  }

  if (conf.topology.workTime) {
    let wt = conf.topology.workTime;
    if (typeof wt === 'string') {
      wt = convertDurationString(conf.topology.workTime);
    }
    conf.topology.workTime = wt;
  } else {
    conf.topology.workTime = 18 * TimeUnit.Hour;
  }

  return conf as TopoAlgorithmParams;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit, AfterViewInit {
  title = 'todo';
  todoBlocks: AgendaPart[] = [];
  doneBlocks: TimeBlock[] = [];
  flattenTodo: FlattenAgendaPart[] = [];
  flattenDone: FlattenBullet[] = [];
  flow: LogicFlow;
  params: {
    intervals: AgendaPart[];
    blocks: FullTimeBlock[];
  }

  constructor(protected httpClient: HttpClient) {
    this.flow = undefined as unknown as LogicFlow;
    this.params = {
      intervals: [],
      blocks: [],
    };
  }

  ngOnInit(): void {
    this.flattenTodo = flattenPart(this.todoBlocks);
    this.flattenDone = flattenBlock(this.doneBlocks);
    this.httpClient.get<TopoAppGenericData<TopoConfig>>('http://localhost:13308/v1/app/full').subscribe((res) => {
      if (res && res.code) {
        console.log(res.code, 'error');
      } else {
        const params = convertConfig(res.data);

        for (const block of params.blocks) {
          this.doneBlocks.push(generatePreviewBlock(block));
        }

        if (params.topology) {

          const algorithmName = 'default';
          const impl = algorithms.get(algorithmName);
          if (!impl) {
            throw new Error('invalid schedule name');
          }
          this.todoBlocks = impl(params);
        }
        this.params = params;
      }

      this.flattenTodo = flattenPart(this.todoBlocks);
      this.flattenDone = flattenBlock(this.doneBlocks);
    });
  }

  initGraphView(): void {
    const elem = document.getElementById('edit-graph');

    if (elem) {
      this.flow = new LogicFlow({
        container: elem,
        stopScrollGraph: true,
        stopZoomGraph: true,
        width: window.innerWidth,
        height: window.innerHeight * 0.9,
      });
      this.flow.register({
        type: 'flow-edge',
        view: FlowEdge,
        model: BezierEdgeModel,
      });
      this.flow.register({
        type: 'bullet-node',
        view: BulletNode,
        model: BulletNodeModel,
      });
      this.flow.setDefaultEdgeType('flow-edge');
    }
  }

  ngAfterViewInit(): void {
    this.initGraphView();
    this.resetData();
  }

  resetData() {
    let incId = 0;
    const partNodes = [];
    const blockRawNodes = [];
    const bulletRawNodes = [];
    const blockBulletEdges = [];
    const nodeMap = new Map<number, any>();
    const refMap = new Map<any, any>();

    for (const part of this.params.intervals) {
      const tn = {
        id: incId++,
        type: 'circle',
        x: 1000,
        y: 0,
        text: part.name,
        data: part,
      };
      partNodes.push(tn);
      nodeMap.set(tn.id, tn);
      refMap.set(tn.data.name, tn);
    }

    for (const block of this.params.blocks) {
      const bln = {
        id: incId++,
        type: 'circle',
        x: 300,
        y: 0,
        text: block.name,
        data: block,
      };
      nodeMap.set(bln.id, bln);
      refMap.set(bln.data.name, bln);
      blockRawNodes.push(bln);

      for (const bullet of block.charger) {
        const bun = {
          id: incId++,
          type: 'bullet-node',
          x: 600,
          y: 0,
          text: bullet.name,
          data: bullet,
        };
        bulletRawNodes.push(bun);
        blockBulletEdges.push({
          type: 'flow-edge',
          sourceNodeId: bln.id,
          targetNodeId: bun.id,
        });
        nodeMap.set(bun.id, bun);
        refMap.set(bln.data.name + bun.data.name, bun);
      }
    }

    if (bulletRawNodes.length) {
      const yOffset = 650 / bulletRawNodes.length;
      for (let i = 0; i < bulletRawNodes.length; i++) {
        bulletRawNodes[i].y = 100 + yOffset * i;
      }
    }

    if (blockBulletEdges.length && blockRawNodes.length) {
      for (let i = 0; i < blockBulletEdges.length; i++) {
        const u = nodeMap.get(blockBulletEdges[i].sourceNodeId);
        const v = nodeMap.get(blockBulletEdges[i].targetNodeId);
        u.y += v.y;
      }
      for (let i = 0; i < blockRawNodes.length; i++) {
        blockRawNodes[i].y /= blockRawNodes[i].data.charger.length;
      }
    } else if (blockRawNodes.length) {
      const yOffset = 600 / blockRawNodes.length;
      for (let i = 0; i < blockRawNodes.length; i++) {
        blockRawNodes[i].y = 100 + yOffset * i;
      }
    }

    if (bulletRawNodes.length && partNodes.length) {
      const l = bulletRawNodes[0].y, r = bulletRawNodes[bulletRawNodes.length - 1].y;
      const d = (r - l) / (partNodes.length + 2);
      for (let i = 0; i < partNodes.length; i++) {
        partNodes[i].y = l + d + d * i;
      }
    } else if (partNodes.length) {
      const yOffset = 600 / partNodes.length;
      for (let i = 0; i < partNodes.length; i++) {
        partNodes[i].y = 100 + yOffset * i;
      }
    }

    for (const p of this.flattenTodo) {
      const partNode = refMap.get(p.part.name);
      for (const b of p.bullets) {
        const bulletNode = refMap.get(b.block.name + b.bullet.name);
        blockBulletEdges.push({
          type: 'flow-edge',
          sourceNodeId: bulletNode.id,
          targetNodeId: partNode.id,
        });
      }
    }


    const data = {
      nodes: [
        ...partNodes,
        ...blockRawNodes,
        ...bulletRawNodes,
      ],
      edges: [
        ...blockBulletEdges,
      ]
    };

    this.flow.clearData();
    this.flow.render(data);
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

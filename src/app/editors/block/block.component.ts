import {AfterViewInit, Component, OnInit} from '@angular/core';
import {TopoAppGenericData} from '@proto/backend';
import {TopoAlgorithmParams} from '@proto/backend.algorithm';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {BezierEdge, BezierEdgeModel, h, LogicFlow, RectNode, RectNodeModel} from '@logicflow/core';
import {FullTimeBlock, TimeBlock, TimeBullet, TopoNode} from '@proto/agenda';
import {HttpClient} from '@angular/common/http';


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

interface FlattenBullet {
  block: TimeBlock;
  bullet: TimeBullet;
}

interface FlattenAgendaPart {
  part: TopoNode;
  bullets: FlattenBullet[];
}

function flattenPart(parts: TopoNode[]): FlattenAgendaPart[] {
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
  selector: 'app-block',
  templateUrl: './block.component.html',
  styleUrls: ['./block.component.sass']
})
export class BlockEditorComponent implements OnInit, AfterViewInit {
  flattenTodo: FlattenAgendaPart[] = [];
  flattenDone: FlattenBullet[] = [];
  flow: LogicFlow;
  params: {
    intervals: TopoNode[];
    blocks: FullTimeBlock[];
  }
  todoBlocks: TopoNode[] = [];
  doneBlocks: TimeBlock[] = [];

  constructor(protected httpClient: HttpClient) {
    this.flow = undefined as unknown as LogicFlow;
    this.params = {
      intervals: [],
      blocks: [],
    };
  }

  ngOnInit(): void {
    this.httpClient.get<TopoAppGenericData<TopoAlgorithmParams>>('http://localhost:13308/v1/app/params').subscribe((res) => {
      if (res && res.code) {
        console.log(res.code, 'error');
      } else {
        this.params = res.data;
        this.doneBlocks = res.data.blocks;
      }
      this.flattenDone = flattenBlock(this.doneBlocks);
      if (this.flow) {
        this.resetData();
      }
    });
    this.httpClient.get<TopoAppGenericData<TopoNode[]>>('http://localhost:13308/v1/app/topo').subscribe((res) => {
      if (res && res.code) {
        console.log(res.code, 'error');
      } else {
        this.todoBlocks = res.data;
      }
      this.flattenTodo = flattenPart(this.todoBlocks);
      if (this.flow) {
        this.resetData();
      }
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

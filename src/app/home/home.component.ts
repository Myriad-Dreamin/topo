import {Component, OnInit} from '@angular/core';
import {AgendaPart, FullTimeBlock, TimeBlock, TimeBullet} from '@proto/agenda';
import {TimeUnit} from '@proto/timeUnit';
import {HttpClient} from '@angular/common/http';
import {TopoAppGenericData} from '@proto/backend';
import {TopoAlgorithmParams} from '@proto/backend.algorithm';

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

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit {
  title = 'todo';
  todoBlocks: AgendaPart[] = [];
  doneBlocks: TimeBlock[] = [];

  constructor(protected httpClient: HttpClient) {
  }

  ngOnInit(): void {
    this.httpClient.get<TopoAppGenericData<TopoAlgorithmParams>>('http://localhost:13308/v1/app/params').subscribe((res) => {
      if (res && res.code) {
        console.log(res.code, 'error');
      } else {
        const params = res.data;

        for (const block of params.blocks) {
          this.doneBlocks.push(generatePreviewBlock(block));
        }
      }
    });

    this.httpClient.get<TopoAppGenericData<AgendaPart[]>>('http://localhost:13308/v1/app/topo').subscribe((res) => {
      if (res && res.code) {
        console.log(res.code, 'error');
      } else {
        this.todoBlocks = res.data;
      }
    });
  }

  dayDur(dur: number): string {
    const hh = Math.floor(dur / TimeUnit.Hour);
    const mm = Math.round((dur - hh * TimeUnit.Hour) / TimeUnit.Minute);
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  }
}

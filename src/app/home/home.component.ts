import {Component, OnInit} from '@angular/core';
import {TimeBlock, TopoNode} from '@proto/agenda';
import {HttpClient} from '@angular/common/http';
import {TopoAppGenericData} from '@proto/backend';
import {TopoAlgorithmParams} from '@proto/backend.algorithm';
import {convertDailyDurationToHM} from '../../lib/duration';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.sass']
})
export class HomeComponent implements OnInit {
  title = 'todo';
  todoBlocks: TopoNode[] = [];
  doneBlocks: TimeBlock[] = [];

  constructor(protected httpClient: HttpClient) {
  }

  ngOnInit(): void {
    this.httpClient.get<TopoAppGenericData<TopoAlgorithmParams>>('http://localhost:13308/v1/app/params').subscribe((res) => {
      if (res && res.code) {
        console.log(res.code, 'error');
      } else {
        this.doneBlocks = res.data.blocks;
      }
    });

    this.httpClient.get<TopoAppGenericData<TopoNode[]>>('http://localhost:13308/v1/app/topo').subscribe((res) => {
      if (res && res.code) {
        console.log(res.code, 'error');
      } else {
        this.todoBlocks = res.data;
      }
    });
  }

  dayDur = convertDailyDurationToHM;
}

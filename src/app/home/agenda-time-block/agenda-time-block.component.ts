import {Component, Input, OnInit} from '@angular/core';
import {TimeBlock} from '@proto/agenda';
import {convertDailyDurationToDur} from '../../../lib/duration';

@Component({
  selector: 'agenda-time-block',
  templateUrl: './agenda-time-block.component.html',
  styleUrls: ['./agenda-time-block.component.sass']
})
export class AgendaTimeBlockComponent implements OnInit {
  @Input() item: TimeBlock = {name: '', charger: []};

  constructor() {
  }

  ngOnInit(): void {
  }

  durHuman = convertDailyDurationToDur;
}

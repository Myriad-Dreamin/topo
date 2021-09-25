import {Component, Input, OnInit} from '@angular/core';
import {TimeBlock, TimeBullet} from '@proto/agenda';
import {convertDailyDurationToDur} from '../../../../lib/duration';

@Component({
  selector: 'agenda-edit-block',
  templateUrl: './agenda-edit-block.component.html',
  styleUrls: ['./agenda-edit-block.component.sass']
})
export class AgendaEditBlockComponent implements OnInit {
  @Input() item: TimeBlock = {name: '', charger: []};
  @Input() bullet: TimeBullet = {name: '', estimated: 0};

  constructor() {
  }

  ngOnInit(): void {
  }

  durHuman = convertDailyDurationToDur;
}

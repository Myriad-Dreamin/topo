import {Component, Input, OnInit} from '@angular/core';
import {TimeUnit} from '@proto/timeUnit';
import {TimeBlock, TimeBullet} from '@proto/agenda';

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

  durHuman(s: number): string {
    if (s == 0) {
      return '无期限';
    }
    if (s >= TimeUnit.Day) {
      return `${(s / TimeUnit.Day).toFixed(2)} 天`;
    }
    if (s >= TimeUnit.Hour) {
      return `${(s / TimeUnit.Hour).toFixed(2)} 时`;
    }
    if (s >= TimeUnit.Minute) {
      return `${(s / TimeUnit.Minute).toFixed(2)} 分`;
    }
    if (s >= TimeUnit.Second) {
      return `${(s / TimeUnit.Second).toFixed(2)} 秒`;
    }
    return '0.00 秒';
  }

}

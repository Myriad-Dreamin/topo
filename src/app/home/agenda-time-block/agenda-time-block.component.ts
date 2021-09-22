import {Component, Input, OnInit} from '@angular/core';
import {TimeBlock} from '@proto/agenda';
import {TimeUnit} from '@proto/timeUnit';

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

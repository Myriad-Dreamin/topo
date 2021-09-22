import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HomeComponent} from './home.component';
import {HomeService} from './home.service';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {FlexLayoutModule} from '@angular/flex-layout';
import {HomeRoutingModule} from './home-routing.module';
import {AgendaTimeBlockComponent} from './agenda-time-block/agenda-time-block.component';
import {AgendaEditBlockComponent} from './agenda-edit-block/agenda-edit-block.component';


@NgModule({
  declarations: [
    HomeComponent,
    AgendaTimeBlockComponent,
    AgendaEditBlockComponent
  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
    DragDropModule,
    FlexLayoutModule,
  ],
  providers: [
    HomeService,
  ]
})
export class HomeModule {
}

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HomeComponent} from './home.component';
import {HomeService} from './home.service';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {FlexLayoutModule} from '@angular/flex-layout';
import {HomeRoutingModule} from './home-routing.module';
import {AgendaTimeBlockComponent} from './agenda-time-block/agenda-time-block.component';
import {HttpClientModule} from '@angular/common/http';


@NgModule({
  declarations: [
    HomeComponent,
    AgendaTimeBlockComponent,
  ],
  imports: [
    CommonModule,
    HomeRoutingModule,
    DragDropModule,
    FlexLayoutModule,
    HttpClientModule,
  ],
  providers: [
    HomeService,
  ]
})
export class HomeModule {
}

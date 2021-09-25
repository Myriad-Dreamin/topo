import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BlockEditorComponent} from './block.component';
import {AgendaEditBlockComponent} from './agenda-edit-block/agenda-edit-block.component';
import {HttpClientModule} from '@angular/common/http';


@NgModule({
  declarations: [
    BlockEditorComponent,
    AgendaEditBlockComponent,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
  ]
})
export class BlockEditorModule {
}

import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BlockEditorComponent} from './block.component';
import {AgendaEditBlockComponent} from './agenda-edit-block/agenda-edit-block.component';


@NgModule({
  declarations: [
    BlockEditorComponent,
    AgendaEditBlockComponent,
  ],
  imports: [
    CommonModule
  ]
})
export class BlockEditorModule {
}

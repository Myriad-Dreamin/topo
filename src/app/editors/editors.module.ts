import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BlockEditorModule} from './block/block.module';
import {EditorsRoutingModule} from './editors-routing.module';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    EditorsRoutingModule,
    BlockEditorModule,
  ]
})
export class EditorsModule {
}

import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {BlockEditorComponent} from './block/block.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'block',
  },
  {
    path: 'block',
    component: BlockEditorComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EditorsRoutingModule {
}

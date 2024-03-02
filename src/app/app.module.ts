import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WorkspaceComponent } from './workspace/containers/workspace/workspace.component';
import { StoreModule } from '@ngrx/store';
import { segmentReducer } from './workspace/store/segments/segments.reducer';
import { pointsReducer } from './workspace/store/points/points.reducer';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    WorkspaceComponent,
    StoreModule.forRoot(
      { segments: segmentReducer, points: pointsReducer },
      {}
    ),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

import { WorkspaceComponent } from './workspace.component';
import { MockBuilder, MockRender } from 'ng-mocks';
import { ZoomService } from '../../services/zoom/zoom.service';
import { WorkspaceStateService } from '../../services/workspace-state/workspace-state.service';
import { of } from 'rxjs';
import { GridLines } from '../../models';
import { ProximityService } from '../../services/proximity/proximity.service';
import { KeyboardService } from '../../services/keyboard/keyboard.service';

describe('WorkspaceComponent', () => {
  let component: WorkspaceComponent;

  const mockedGridLines: GridLines = {
    step: 10,
    stepWidth: 100,
    vertical: [-20, -10, 0, 10, 20],
    horizontal: [-20, -10, 0, 10, 20],
  };

  beforeEach(async () =>
    MockBuilder(WorkspaceComponent)
      .mock(WorkspaceStateService, {
        gridLines$: of(mockedGridLines),
      } as Partial<WorkspaceStateService>)
      .mock(ZoomService)
      .mock(ProximityService)
      .mock(KeyboardService)
      .then(() => {
        component = MockRender(WorkspaceComponent).point.componentInstance;
      })
  );

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

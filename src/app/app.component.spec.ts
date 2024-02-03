import { AppComponent } from './app.component';
import { MockBuilder, MockRender, ngMocks } from 'ng-mocks';
import { WorkspaceComponent } from './workspace/containers/workspace/workspace.component';

describe('AppComponent', () => {
  let component: AppComponent;

  beforeEach(() =>
    MockBuilder(AppComponent)
      .mock(WorkspaceComponent)
      .then(() => {
        component = MockRender(AppComponent, null, { reset: true }).point
          .componentInstance;
      })
  );

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should have as title 'CAD'`, () => {
    expect(component.title).toEqual('CAD');
  });

  it('should render Workspace component', () => {
    expect(ngMocks.findInstance(WorkspaceComponent)).toBeTruthy();
  });
});

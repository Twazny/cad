import {
  MockBuilder,
  MockRender,
  MockedComponentFixture,
  ngMocks,
} from 'ng-mocks';
import { ToolbarComponent } from './toolbar.component';
import {
  ButtonComponent,
  ButtonGroupComponent,
  ButtonGroupOptionDirective,
} from 'src/app/ui/components';
import { WorkspaceStateService } from '../../services/workspace-state/workspace-state.service';
import { Command } from '../../models';
import { BehaviorSubject, Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

class WorkspaceStateServiceMock implements Partial<WorkspaceStateService> {
  public command$!: Observable<Command>;
  public delete$!: Observable<void>;
  public isAnythingSelectedSub$ = new BehaviorSubject<boolean>(false);
  public mainCommandSub$ = new BehaviorSubject<Command>(Command.SELECT);
  public get isAnythingSelected$(): Observable<boolean> {
    return this.isAnythingSelectedSub$.asObservable();
  }
  public get mainCommand$(): Observable<Command> {
    return this.mainCommandSub$.asObservable();
  }

  public connectMainCommand = jest.fn((command$: Observable<Command>): void => {
    this.command$ = command$;
  });

  public connectDelete = jest.fn((delete$: Observable<void>): void => {
    this.delete$ = delete$;
  });
}

describe('ToolbarComponent', () => {
  let fixture: MockedComponentFixture<ToolbarComponent>;
  let component: ToolbarComponent;
  let service: WorkspaceStateServiceMock;

  beforeEach(() =>
    MockBuilder(ToolbarComponent)
      .keep(AsyncPipe)
      .keep(ReactiveFormsModule)
      .mock(ButtonGroupComponent)
      .mock(ButtonGroupOptionDirective)
      .mock(ButtonComponent)
      .provide({
        provide: WorkspaceStateService,
        useClass: WorkspaceStateServiceMock,
      })
      .then(() => {
        fixture = MockRender(ToolbarComponent);
        component = fixture.point.componentInstance;
        service = ngMocks.findInstance(
          WorkspaceStateService
        ) as unknown as WorkspaceStateServiceMock;
      })
  );

  describe('component init', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render button group', () => {
      const buttonGroup = ngMocks.findInstance(ButtonGroupComponent);
      const selectOptionDirective = ngMocks.findInstance(
        'app-button-group button:nth-child(1)',
        ButtonGroupOptionDirective
      );
      const lineOptionDirective = ngMocks.findInstance(
        'app-button-group button:nth-child(2)',
        ButtonGroupOptionDirective
      );

      expect(buttonGroup).toBeTruthy();
      expect(selectOptionDirective).toBeTruthy();
      expect(selectOptionDirective.value).toBe(Command.SELECT);
      expect(lineOptionDirective).toBeTruthy();
      expect(lineOptionDirective.value).toBe(Command.LINE);
    });

    it('should render delete button', () => {
      expect(
        ngMocks.findInstance('[data-test=delete-button]', ButtonComponent)
      ).toBeTruthy();
    });
  });

  describe('component actions', () => {
    it('should disable delete button if there is nothing selected', () => {
      service.isAnythingSelectedSub$.next(true);
      fixture.detectChanges();

      expect(
        ngMocks.findInstance('[data-test=delete-button]', ButtonComponent)
          .disabled
      ).toBe(false);

      service.isAnythingSelectedSub$.next(false);
      fixture.detectChanges();

      expect(
        ngMocks.findInstance('[data-test=delete-button]', ButtonComponent)
          .disabled
      ).toBe(true);
    });

    it('should patch value in button group when mainCommand changes', () => {
      const buttonGroup = ngMocks.findInstance(ButtonGroupComponent);
      jest.spyOn(buttonGroup, 'writeValue');
      service.mainCommandSub$.next(Command.LINE);

      fixture.detectChanges();

      expect(buttonGroup.writeValue).toHaveBeenCalledWith(Command.LINE);
    });

    it('should connect delete$ stream', () => {
      const observer = jest.fn(() => void 0);
      service.delete$.subscribe(observer);

      ngMocks.click('[data-test=delete-button]');

      expect(service.connectDelete).toHaveBeenCalled();
      expect(observer).toHaveBeenCalled();
    });

    it('should connect mainCommand$ stream', () => {
      const observer = jest.fn(() => void 0);
      service.command$.subscribe(observer);

      ngMocks.change('app-button-group', Command.LINE);

      expect(service.connectMainCommand).toHaveBeenCalled();
      expect(observer).toHaveBeenCalledWith(Command.LINE);
    });
  });
});

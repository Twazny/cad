import { MockBuilder, MockRender } from 'ng-mocks';
import { ZoomService } from './zoom.service';
import { TestScheduler } from 'rxjs/testing';
import { WorkspaceStateService } from '../workspace-state/workspace-state.service';
import { of } from 'rxjs';

describe('ZoomService', () => {
  let service: ZoomService;
  let testScheduler: TestScheduler;

  beforeEach(() =>
    MockBuilder(ZoomService)
      .mock(WorkspaceStateService, {
        zoom$: of(1),
        workspaceSize$: of({ width: 100, height: 100 }),
      })
      .then(() => {
        service = MockRender(ZoomService).point.componentInstance;
        testScheduler = new TestScheduler((actual, expected) => {
          expect(actual).toEqual(expected);
        });
      })
  );

  describe('service init', () => {
    it('should create', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('scale change stream', () => {
    it('should emit scale change after changing zoom from +/- controls', () => {
      testScheduler.run(({ cold, expectObservable }) => {
        const zoomMarble = '  --a--b--c-';
        const resultMarble = '--a--b--c-';
        const subsMarble = '  ^--------!';

        const zoomValues = {
          a: -1,
          b: 1,
          c: 1,
        };

        const resultValues = {
          a: {
            newScale: 0.95,
            scalingCenter: {
              x: 50,
              y: 50,
            },
          },
          b: {
            newScale: 1,
            scalingCenter: {
              x: 50,
              y: 50,
            },
          },
          c: {
            newScale: 1.5,
            scalingCenter: {
              x: 50,
              y: 50,
            },
          },
        };

        const zoom$ = cold(zoomMarble, zoomValues);

        service.connectZoom(zoom$);

        expectObservable(service.scaleChange$, subsMarble).toBe(
          resultMarble,
          resultValues
        );
      });
    });

    it('should emit scale change after changing zoom with mouse wheel', () => {
      testScheduler.run(({ cold, expectObservable }) => {
        const zoomMarble = '  --a--b--c-';
        const resultMarble = '--a--b--c-';
        const subsMarble = '  ^--------!';

        const zoomValues = {
          a: new WheelEvent('wheel', { deltaY: -1, clientX: 10, clientY: 10 }),
          b: new WheelEvent('wheel', { deltaY: 1, clientX: 35, clientY: 53 }),
          c: new WheelEvent('wheel', { deltaY: 1, clientX: 90, clientY: 5 }),
        };

        const resultValues = {
          a: {
            newScale: 0.95,
            scalingCenter: {
              x: 10,
              y: 10,
            },
          },
          b: {
            newScale: 1,
            scalingCenter: {
              x: 35,
              y: 53,
            },
          },
          c: {
            newScale: 1.5,
            scalingCenter: {
              x: 90,
              y: 5,
            },
          },
        };

        const zoom$ = cold(zoomMarble, zoomValues);

        service.connectWheel(zoom$);

        expectObservable(service.scaleChange$, subsMarble).toBe(
          resultMarble,
          resultValues
        );
      });
    });
  });
});

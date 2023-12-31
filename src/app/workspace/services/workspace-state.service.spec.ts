import { MockBuilder, MockRender } from "ng-mocks"
import { WorkspaceStateService } from "./workspace-state.service"
import { provideMockStore } from '@ngrx/store/testing';
import { EntityState } from "@ngrx/entity";
import { WorkspaceObject } from "../models";
import { TestScheduler } from "rxjs/testing";
import { ColdObservable } from "rxjs/internal/testing/ColdObservable";
import { of } from "rxjs";

const initialState: { objects: EntityState<WorkspaceObject> } = {
  objects: {
    ids: ['1', '2', '3'],
    entities: {
      '1': {
        id: '1',
        geometry: [{ x: 10, y: 10 }, { x: 10, y: 30 }]
      },
      '2': {
        id: '2',
        geometry: [{ x: 10, y: 10 }, { x: 30, y: 30 }]
      },
      '3': {
        id: '3',
        geometry: [{ x: 10, y: 30 }, { x: 30, y: 30 }]
      }
    }
  }
};

describe('WorkspaceStateService', () => {
  let service: WorkspaceStateService;
  let testScheduler: TestScheduler;

  beforeEach(async () => MockBuilder(WorkspaceStateService)
    .provide(provideMockStore({ initialState }))
    .then(() => {
      service = MockRender(WorkspaceStateService).point.componentInstance;
      service.connectResize(of({ width: 100, height: 100 }));
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

  describe('zoom', () => {
    it('should zoom objects according to cursor position', () => {
      testScheduler.run(({ cold, expectObservable }) => {
        const subsMarble = ' ---^----!';
        const wheelMarble = '-a---b-c-';
        const resMarble = '  ---a-b-c-';

        const wheelValues = {
          a: new WheelEvent('wheel', { deltaY: -1, clientX: 10, clientY: 10 }),
          b: new WheelEvent('wheel', { deltaY: 1, clientX: 10, clientY: 10 }),
          c: new WheelEvent('wheel', { deltaY: 1, clientX: 10, clientY: 10 })
        };

        const resValues = {
          a: [
            { id: '1', geometry: [{ x: 10, y: 10 }, { x: 10, y: 29 }], selected: false },
            { id: '2', geometry: [{ x: 10, y: 10 }, { x: 29, y: 29 }], selected: false },
            { id: '3', geometry: [{ x: 10, y: 29 }, { x: 29, y: 29 }], selected: false }
          ],
          b: [
            { id: '1', geometry: [{ x: 10, y: 10 }, { x: 10, y: 30 }], selected: false },
            { id: '2', geometry: [{ x: 10, y: 10 }, { x: 30, y: 30 }], selected: false },
            { id: '3', geometry: [{ x: 10, y: 30 }, { x: 30, y: 30 }], selected: false }
          ],
          c: [
            { id: '1', geometry: [{ x: 10, y: 10 }, { x: 10, y: 40 }], selected: false },
            { id: '2', geometry: [{ x: 10, y: 10 }, { x: 40, y: 40 }], selected: false },
            { id: '3', geometry: [{ x: 10, y: 40 }, { x: 40, y: 40 }], selected: false }
          ],
        };

        const wheel$: ColdObservable<WheelEvent> = cold(wheelMarble, wheelValues);

        service.connectWheel(wheel$);

        expectObservable(service.viewportObjects$, subsMarble).toBe(resMarble, resValues);

      });
    });

    it('should zoom objects according to center of screen', () => {
      testScheduler.run(({ cold, expectObservable }) => {
        const subsMarble = ' ---^----!';
        const zoomMarble = '-a---b-c-';
        const resMarble = ' ---a-b-c-';

        const zoomValues = { a: -1, b: 1, c: 1 };

        const resValues = {
          a: [
            { id: '1', geometry: [{ x: 12, y: 12 }, { x: 12, y: 31 }], selected: false },
            { id: '2', geometry: [{ x: 12, y: 12 }, { x: 31, y: 31 }], selected: false },
            { id: '3', geometry: [{ x: 12, y: 31 }, { x: 31, y: 31 }], selected: false }
          ],
          b: [
            { id: '1', geometry: [{ x: 10, y: 10 }, { x: 10, y: 30 }], selected: false },
            { id: '2', geometry: [{ x: 10, y: 10 }, { x: 30, y: 30 }], selected: false },
            { id: '3', geometry: [{ x: 10, y: 30 }, { x: 30, y: 30 }], selected: false }
          ],
          c: [
            { id: '1', geometry: [{ x: -10, y: -10 }, { x: -10, y: 20 }], selected: false },
            { id: '2', geometry: [{ x: -10, y: -10 }, { x: 20, y: 20 }], selected: false },
            { id: '3', geometry: [{ x: -10, y: 20 }, { x: 20, y: 20 }], selected: false }
          ],
        };

        const zoom$: ColdObservable<number> = cold(zoomMarble, zoomValues);

        service.connectZoom(zoom$);

        expectObservable(service.viewportObjects$, subsMarble).toBe(resMarble, resValues);
      });
    });
  });
});

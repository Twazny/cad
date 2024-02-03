import { MockBuilder, MockRender } from 'ng-mocks';
import { WorkspaceStateService } from './workspace-state.service';
import { provideMockStore } from '@ngrx/store/testing';
import { EntityState } from '@ngrx/entity';
import { ScaleChange, WorkspaceObject } from '../../models';
import { TestScheduler } from 'rxjs/testing';
import { ColdObservable } from 'rxjs/internal/testing/ColdObservable';
import { of } from 'rxjs';

const initialState: { objects: EntityState<WorkspaceObject> } = {
  objects: {
    ids: ['1', '2', '3'],
    entities: {
      '1': {
        id: '1',
        geometry: [
          { x: 10, y: 10 },
          { x: 10, y: 30 },
        ],
      },
      '2': {
        id: '2',
        geometry: [
          { x: 10, y: 10 },
          { x: 30, y: 30 },
        ],
      },
      '3': {
        id: '3',
        geometry: [
          { x: 10, y: 30 },
          { x: 30, y: 30 },
        ],
      },
    },
  },
};

describe('WorkspaceStateService', () => {
  let service: WorkspaceStateService;
  let testScheduler: TestScheduler;

  beforeEach(async () =>
    MockBuilder(WorkspaceStateService)
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

  describe('scale change', () => {
    it('should scale objects according to scale value and scaling center', () => {
      testScheduler.run(({ cold, expectObservable }) => {
        const subsMarble = ' ---^----!';
        const scaleMarble = '-a---b-c-';
        const resMarble = '  ---a-b-c-';

        const scaleChanges: Record<string, ScaleChange> = {
          a: { newScale: 0.95, scalingCenter: { x: 10, y: 10 } },
          b: { newScale: 1, scalingCenter: { x: 10, y: 10 } },
          c: { newScale: 1.1, scalingCenter: { x: 10, y: 10 } },
        };

        const resValues = {
          a: [
            {
              id: '1',
              geometry: [
                { x: 10, y: 10 },
                { x: 10, y: 29 },
              ],
              selected: false,
            },
            {
              id: '2',
              geometry: [
                { x: 10, y: 10 },
                { x: 29, y: 29 },
              ],
              selected: false,
            },
            {
              id: '3',
              geometry: [
                { x: 10, y: 29 },
                { x: 29, y: 29 },
              ],
              selected: false,
            },
          ],
          b: [
            {
              id: '1',
              geometry: [
                { x: 10, y: 10 },
                { x: 10, y: 30 },
              ],
              selected: false,
            },
            {
              id: '2',
              geometry: [
                { x: 10, y: 10 },
                { x: 30, y: 30 },
              ],
              selected: false,
            },
            {
              id: '3',
              geometry: [
                { x: 10, y: 30 },
                { x: 30, y: 30 },
              ],
              selected: false,
            },
          ],
          c: [
            {
              id: '1',
              geometry: [
                { x: 10, y: 10 },
                { x: 10, y: 40 },
              ],
              selected: false,
            },
            {
              id: '2',
              geometry: [
                { x: 10, y: 10 },
                { x: 40, y: 40 },
              ],
              selected: false,
            },
            {
              id: '3',
              geometry: [
                { x: 10, y: 40 },
                { x: 40, y: 40 },
              ],
              selected: false,
            },
          ],
        };

        const scaleChange$: ColdObservable<ScaleChange> = cold(
          scaleMarble,
          scaleChanges
        );
        service.connectScaleChange(scaleChange$);
        expectObservable(service.viewportObjects$, subsMarble).toBe(
          resMarble,
          resValues
        );
      });
    });
  });
});

import { MockBuilder, MockRender } from 'ng-mocks';
import { WorkspaceStateService } from './workspace-state.service';
import { provideMockStore } from '@ngrx/store/testing';
import { ScaleChange, SegmentState } from '../../models';
import { TestScheduler } from 'rxjs/testing';
import { ColdObservable } from 'rxjs/internal/testing/ColdObservable';
import { of } from 'rxjs';
import { selectAllObjects } from '../../store/object.selectors';

const initialState: SegmentState[] = [
  {
    id: '1',
    geometry: [
      { id: 'p1', x: 10, y: 10 },
      { id: 'p2', x: 10, y: 30 },
    ],
  },
  {
    id: '2',
    geometry: [
      { id: 'p3', x: 10, y: 10 },
      { id: 'p4', x: 30, y: 30 },
    ],
  },
  {
    id: '3',
    geometry: [
      { id: 'p5', x: 10, y: 30 },
      { id: 'p6', x: 30, y: 30 },
    ],
  },
];

describe('WorkspaceStateService', () => {
  let service: WorkspaceStateService;
  let testScheduler: TestScheduler;

  beforeEach(async () =>
    MockBuilder(WorkspaceStateService)
      .provide(
        provideMockStore({
          selectors: [{ selector: selectAllObjects, value: initialState }],
        })
      )
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
          c: { newScale: 1.5, scalingCenter: { x: 10, y: 10 } },
        };

        const resValues = {
          a: [
            {
              id: '1',
              geometry: [
                { id: 'p1', x: 10, y: 10, inProximity: false },
                { id: 'p2', x: 10, y: 29, inProximity: false },
              ],
              inProximity: false,
              isSelected: false,
            },
            {
              id: '2',
              geometry: [
                { id: 'p3', x: 10, y: 10, inProximity: false },
                { id: 'p4', x: 29, y: 29, inProximity: false },
              ],
              inProximity: false,
              isSelected: false,
            },
            {
              id: '3',
              geometry: [
                { id: 'p5', x: 10, y: 29, inProximity: false },
                { id: 'p6', x: 29, y: 29, inProximity: false },
              ],
              inProximity: false,
              isSelected: false,
            },
          ],
          b: [
            {
              id: '1',
              geometry: [
                { id: 'p1', x: 10, y: 10, inProximity: false },
                { id: 'p2', x: 10, y: 30, inProximity: false },
              ],
              inProximity: false,
              isSelected: false,
            },
            {
              id: '2',
              geometry: [
                { id: 'p3', x: 10, y: 10, inProximity: false },
                { id: 'p4', x: 30, y: 30, inProximity: false },
              ],
              inProximity: false,
              isSelected: false,
            },
            {
              id: '3',
              geometry: [
                { id: 'p5', x: 10, y: 30, inProximity: false },
                { id: 'p6', x: 30, y: 30, inProximity: false },
              ],
              inProximity: false,
              isSelected: false,
            },
          ],
          c: [
            {
              id: '1',
              geometry: [
                { id: 'p1', x: 10, y: 10, inProximity: false },
                { id: 'p2', x: 10, y: 40, inProximity: false },
              ],
              inProximity: false,
              isSelected: false,
            },
            {
              id: '2',
              geometry: [
                { id: 'p3', x: 10, y: 10, inProximity: false },
                { id: 'p4', x: 40, y: 40, inProximity: false },
              ],
              inProximity: false,
              isSelected: false,
            },
            {
              id: '3',
              geometry: [
                { id: 'p5', x: 10, y: 40, inProximity: false },
                { id: 'p6', x: 40, y: 40, inProximity: false },
              ],
              inProximity: false,
              isSelected: false,
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

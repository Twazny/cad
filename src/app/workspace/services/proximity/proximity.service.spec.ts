import { MockBuilder, MockRender, ngMocks } from 'ng-mocks';
import { ProximityService } from './proximity.service';
import { WorkspaceStateService } from '../workspace-state/workspace-state.service';
import { KeyboardService } from '../keyboard/keyboard.service';
import { TestScheduler } from 'rxjs/testing';
import { DOCUMENT } from '@angular/common';
import { of } from 'rxjs';

describe('ProximityService', () => {
  let service: ProximityService;
  let testScheduler: TestScheduler;

  beforeEach(() =>
    MockBuilder(ProximityService)
      .mock(WorkspaceStateService)
      .mock(KeyboardService, { getHotkeyStream: jest.fn(() => of()) })
      .keep(DOCUMENT)
      .then(() => {
        testScheduler = new TestScheduler((actual, expected) => {
          expect(actual).toEqual(expected);
        });
      })
  );

  describe('service init', () => {
    it('should create', () => {
      service = MockRender(ProximityService).point.componentInstance;
      expect(service).toBeTruthy();
    });
  });

  describe('proximityId stream', () => {
    it('should return correct value', () => {
      testScheduler.run(({ cold, expectObservable }) => {
        const hotkeyMarbles = '    -----h--h-h-h--';
        const mousemouveMarbles = '--m-m-m--------';
        const subsMarbles = '      ^-------------!';
        const resultMarbles = '    a---b-c-d-e-f--';

        const hotkey$ = cold(hotkeyMarbles, { h: void 0 });
        const mousemove$ = cold(mousemouveMarbles, {
          m: new MouseEvent('mousemove'),
        });

        jest
          .spyOn(ngMocks.findInstance(KeyboardService), 'getHotkeyStream')
          .mockReturnValue(hotkey$);

        const document = ngMocks.findInstance(DOCUMENT);
        document.elementsFromPoint = jest.fn();

        jest
          .spyOn(document, 'elementsFromPoint')
          .mockReturnValueOnce([mockElement('1'), mockElement('3')])
          .mockReturnValueOnce([
            mockElement('3', false),
            mockElement('4', true),
          ])
          .mockReturnValueOnce([
            mockElement('5', true),
            mockElement('6', true),
          ]);

        const resultValues = {
          i: null,
          a: null,
          b: '4',
          c: '5',
          d: '6',
          e: '5',
          f: '6',
        };

        service = MockRender(ProximityService, undefined, { reset: true }).point
          .componentInstance;
        service.connectMousemouve(mousemove$);
        expectObservable(service.proximityId$, subsMarbles).toBe(
          resultMarbles,
          resultValues
        );
      });
    });
  });

  function mockElement(id: string, hasProximityAttr: boolean = false): Element {
    return {
      id,
      hasAttribute: jest.fn(() => hasProximityAttr),
    } as unknown as Element;
  }
});

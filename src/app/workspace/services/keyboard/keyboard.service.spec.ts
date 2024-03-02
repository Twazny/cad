import { TestScheduler } from 'rxjs/testing';
import { KeyboardService } from './keyboard.service';
import { MockBuilder, MockRender } from 'ng-mocks';
import { R, T, U } from '@angular/cdk/keycodes';

describe('KeyboardService', () => {
  let service: KeyboardService;
  let testScheduler: TestScheduler;

  beforeEach(() =>
    MockBuilder(KeyboardService).then(() => {
      service = MockRender(KeyboardService).point.componentInstance;
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

  describe('service methods', () => {
    it('should return hotkey stream', () => {
      testScheduler.run(({ cold, expectObservable }) => {
        const keydownMarbles = '--a--b--c--';
        const resultMarbles = ' -----a-----';
        const subsMarbles = '   ^---------!';

        const keydownValues = {
          a: new KeyboardEvent('keydown', { keyCode: R }),
          b: new KeyboardEvent('keydown', { keyCode: T }),
          c: new KeyboardEvent('keydown', { keyCode: U }),
        };

        const resultValues = {
          a: void 0,
        };

        const keydown$ = cold(keydownMarbles, keydownValues);

        service.connectKeyDown(keydown$);

        expectObservable(service.getHotkeyStream(T), subsMarbles).toBe(
          resultMarbles,
          resultValues
        );
      });
    });
  });
});

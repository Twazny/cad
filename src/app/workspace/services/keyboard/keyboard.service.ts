import { Injectable } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';

@Injectable()
export class KeyboardService {
  private _keyDownSub$: Subject<KeyboardEvent> = new Subject();
  private _keyDown$: Observable<KeyboardEvent> =
    this._keyDownSub$.asObservable();

  public connectKeyDown(keydown$: Observable<KeyboardEvent>): void {
    keydown$.subscribe(this._keyDownSub$);
  }

  public getHotkeyStream(keyCode: number): Observable<void> {
    return this._keyDown$.pipe(
      filter(event => event.keyCode === keyCode),
      map(() => void 0)
    );
  }
}

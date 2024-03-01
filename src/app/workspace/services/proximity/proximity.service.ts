import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { rxState } from '@rx-angular/state';
import { Observable, map } from 'rxjs';
import { WorkspaceStateService } from '../workspace-state/workspace-state.service';
import { KeyboardService } from '../keyboard/keyboard.service';
import { T } from '@angular/cdk/keycodes';

interface ProximityState {
  ids: string[];
  activeIdx: number | null;
}

@Injectable()
export class ProximityService {
  private readonly document = inject(DOCUMENT);
  private readonly workspaceState = inject(WorkspaceStateService);
  private readonly keyboardService = inject(KeyboardService);

  private state = rxState<ProximityState>(({ set, connect }) => {
    set({
      ids: [],
      activeIdx: 0,
    });
    connect(this.keyboardService.getHotkeyStream(T), ({ ids, activeIdx }) => ({
      activeIdx: ((activeIdx || 0) + 1) % ids.length,
    }));
  });

  public proximityId$: Observable<string | null> = this.state.select(
    ['ids', 'activeIdx'],
    ({ ids, activeIdx }) => {
      return typeof activeIdx === 'number' ? ids[activeIdx] || null : null;
    }
  );

  public constructor() {
    this.workspaceState.connectProximity(this.proximityId$);
  }

  public connectMousemouve(mousemove$: Observable<MouseEvent>): void {
    this.state.connect(
      'ids',
      mousemove$.pipe(
        map(({ clientX, clientY }) =>
          this.document
            .elementsFromPoint(clientX, clientY)
            .filter(element => element.hasAttribute('proximity'))
            .map(element => element.id)
        )
      )
    );
  }
}

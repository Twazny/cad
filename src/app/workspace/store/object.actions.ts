import { createAction, props } from '@ngrx/store';
import { PointEntity } from '../models';

export interface AddSegmentActionPayload {
  id: string;
  geometry: [string | PointEntity, string | PointEntity];
}

export const addObject = createAction(
  '[Objects] Add Object',
  props<AddSegmentActionPayload>()
);
export const deleteObjects = createAction(
  '[Objects] Delete objects',
  props<{ objectIds: string[] }>()
);

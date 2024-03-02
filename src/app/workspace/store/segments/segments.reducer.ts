import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { PointEntity, SegmentEntity } from '../../models';
import { createReducer, on } from '@ngrx/store';
import * as ObjectActions from '../object.actions';

export interface State extends EntityState<SegmentEntity> {}

export const adapter: EntityAdapter<SegmentEntity> =
  createEntityAdapter<SegmentEntity>({
    selectId: (segment: SegmentEntity) => segment.id,
  });

export const initialState: State = adapter.getInitialState();

export const segmentReducer = createReducer(
  initialState,
  on(ObjectActions.addObject, (state, payload) => {
    return adapter.addOne(addPayloadToSegment(payload), state);
  }),
  on(ObjectActions.deleteObjects, (state, { objectIds }) => {
    return adapter.removeMany(objectIds, state);
  })
);

function addPayloadToSegment(
  payload: ObjectActions.AddSegmentActionPayload
): SegmentEntity {
  return {
    ...payload,
    geometry: payload.geometry.map(pointRef => onlyId(pointRef)) as [
      string,
      string,
    ],
  };
}

function onlyId(pointRef: string | PointEntity): string {
  return typeof pointRef === 'string' ? pointRef : pointRef.id;
}

const { selectAll } = adapter.getSelectors();

export const selectAllSegments = selectAll;

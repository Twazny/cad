import { createReducer, on } from '@ngrx/store';
import { PointEntity } from '../../models';
import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import * as ObjectActions from '../object.actions';

export const adapter: EntityAdapter<PointEntity> =
  createEntityAdapter<PointEntity>({
    selectId: (object: PointEntity) => object.id,
  });

export interface State extends EntityState<PointEntity> {}

export const initialState: State = adapter.getInitialState();

export const pointsReducer = createReducer(
  initialState,
  on(ObjectActions.addObject, (state, { geometry }) => {
    return adapter.addMany(
      geometry.filter(
        pointRef => !isNewPoint(pointRef)
      ) as unknown as PointEntity[],
      state
    );
  }),
  on(ObjectActions.deleteObjects, (state, { objectIds }) => {
    return adapter.removeMany(objectIds, state);
  })
);

function isNewPoint(pointRef: string | PointEntity): boolean {
  return typeof pointRef === 'string';
}

const { selectAll } = adapter.getSelectors();

export const selectAllPoints = selectAll;

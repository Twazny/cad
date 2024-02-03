import { EntityAdapter, EntityState, createEntityAdapter } from '@ngrx/entity';
import { WorkspaceObject } from '../models';
import { createReducer, on } from '@ngrx/store';
import * as ObjectActions from './object.actions';

export interface State extends EntityState<WorkspaceObject> {}

export const adapter: EntityAdapter<WorkspaceObject> =
  createEntityAdapter<WorkspaceObject>({
    selectId: (object: WorkspaceObject) => object.id,
  });

export const initialState: State = adapter.getInitialState();

export const objectReducer = createReducer(
  initialState,
  on(ObjectActions.addObject, (state, { object }) => {
    return adapter.addOne(object, state);
  }),
  on(ObjectActions.deleteObjects, (state, { objectIds }) => {
    return adapter.removeMany(objectIds, state);
  })
);

const { selectAll } = adapter.getSelectors();

export const selectAllObjects = selectAll;

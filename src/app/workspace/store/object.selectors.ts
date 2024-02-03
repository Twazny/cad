import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromObject from './object.reducer';

export const selectObjectState =
  createFeatureSelector<fromObject.State>('objects');

export const selectAllObjects = createSelector(
  selectObjectState,
  fromObject.selectAllObjects
);

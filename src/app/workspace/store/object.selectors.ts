import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromSegment from './segments/segments.reducer';
import * as fromPoint from './points/points.reducer';
import { PointEntity, SegmentEntity, SegmentState } from '../models';

const selectSegmentsState =
  createFeatureSelector<fromSegment.State>('segments');

const selectPointsState = createFeatureSelector<fromPoint.State>('points');

const selectAllSegments = createSelector(
  selectSegmentsState,
  fromSegment.selectAllSegments
);

const selectAllPoints = createSelector(
  selectPointsState,
  fromPoint.selectAllPoints
);

export const selectAllObjects = createSelector(
  selectAllSegments,
  selectAllPoints,
  (segments: SegmentEntity[], points: PointEntity[]) => {
    return segments.map(segment => ({
      ...segment,
      geometry: [
        points.find(point => point.id === segment.geometry[0]),
        points.find(point => point.id === segment.geometry[1]),
      ],
    })) as SegmentState[];
  }
);

import { PointEntity } from './point-entity.interface';

export interface SegmentState {
  id: string;
  geometry: [PointEntity, PointEntity];
}

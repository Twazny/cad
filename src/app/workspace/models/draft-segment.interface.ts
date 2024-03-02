import { PointEntity } from './point-entity.interface';

export interface DraftSegment {
  id: string;
  geometry: [string | PointEntity, string | PointEntity];
}

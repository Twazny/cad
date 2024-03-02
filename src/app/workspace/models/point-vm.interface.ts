import { PointEntity } from './point-entity.interface';

export interface PointViewModel extends PointEntity {
  inProximity: boolean;
}

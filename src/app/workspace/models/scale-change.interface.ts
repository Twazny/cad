import { Point } from 'src/app/geometry/models';

export interface ScaleChange {
  newScale: number;
  scalingCenter: Point;
}

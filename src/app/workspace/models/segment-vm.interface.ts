import { PointViewModel } from './point-vm.interface';

export interface SegmentViewModel {
  id: string;
  inProximity: boolean;
  isSelected: boolean;
  geometry: [PointViewModel, PointViewModel];
}

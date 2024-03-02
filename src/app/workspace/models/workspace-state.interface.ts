import { Point } from 'src/app/geometry/models/point';
import { Rect } from 'src/app/geometry/models/rect';
import { Segment } from 'src/app/geometry/models/segment';
import { Command } from './command.enum';
import { SegmentState } from './segment-state.interface';

export interface WorkspaceState {
  objects: SegmentState[];
  willBeSelectedIds: string[];
  selectedObjectIds: string[];
  scale: number;
  lastPosition: Point;
  position: Point;
  viewportSize: Rect;
  mouseScreenPosition: Point;
  draftSegment: Segment | null;
  mainCommand: Command;
  selectionArea: Segment | null;
  proximityId: string | null;
}

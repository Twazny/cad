import { Point } from 'src/app/geometry/models/point';
import { WorkspaceObject } from './workspace-object.interface';
import { Rect } from 'src/app/geometry/models/rect';
import { Segment } from 'src/app/geometry/models/segment';
import { Command } from './command.enum';

export interface WorkspaceState {
  objects: WorkspaceObject[];
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
}

import { Point } from "src/app/geometry/models/point";
import { WorkspaceObject } from "./workspace-object";
import { Rect } from "src/app/geometry/models/rect";

export interface WorkspaceState {
    objects: WorkspaceObject[];
    zoom: number;
    lastPosition: Point;
    position: Point;
    viewportSize: Rect;
}

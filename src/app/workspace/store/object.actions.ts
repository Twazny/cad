import { createAction, props } from "@ngrx/store";
import { WorkspaceObject } from "../models/workspace-object";

export const addObject = createAction('[Objects] Add Object', props<{object: WorkspaceObject}>());

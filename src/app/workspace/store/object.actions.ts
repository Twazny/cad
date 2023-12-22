import { createAction, props } from "@ngrx/store";
import { WorkspaceObject } from "../models";

export const addObject = createAction('[Objects] Add Object', props<{ object: WorkspaceObject }>());
export const deleteObjects = createAction('[Objects] Delete objects', props<{ objectIds: string[] }>());

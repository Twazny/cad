import { createAction, props } from "@ngrx/store";
import { WorkspaceObject } from "../models";

export const addObject = createAction('[Objects] Add Object', props<{ object: WorkspaceObject }>());

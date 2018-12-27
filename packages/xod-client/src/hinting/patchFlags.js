import * as R from 'ramda';
import * as XP from 'xod-project';
import { foldMaybe, isAmong } from 'xod-func-tools';
import * as PAT from '../project/actionTypes';
import * as EAT from '../editor/actionTypes';

// :: Action -> Boolean
const isLoadingProjectAction = R.propSatisfies(
  isAmong([PAT.PROJECT_IMPORT, PAT.PROJECT_OPEN]),
  'type'
);

// :: String -> Boolean
const oneOfInfoMarkers = isAmong([
  XP.DEPRECATED_MARKER_PATH,
  XP.UTILITY_MARKER_PATH,
]);

// :: Action -> Boolean
const doesMarkerNodeAdded = R.allPass([
  R.propEq('type', PAT.NODE_ADD),
  R.pathSatisfies(oneOfInfoMarkers, ['payload', 'typeId']),
]);

const doesMarkerNodePasted = R.allPass([
  R.propEq('type', EAT.PASTE_ENTITIES),
  R.pathSatisfies(R.any(R.pipe(XP.getNodeType, oneOfInfoMarkers)), [
    'payload',
    'entities',
    'nodes',
  ]),
]);

// :: Action -> Boolean
const doesAnyNodeDeleted = R.allPass([
  R.propEq('type', PAT.BULK_DELETE_ENTITIES),
  R.pathSatisfies(nodeList => nodeList.length > 0, ['payload', 'nodeIds']),
]);

// :: Action -> Boolean
export const shallUpdatePatchFlags = R.anyPass([
  // Update on loading a project
  isLoadingProjectAction,
  // Update on adding a marker Node
  doesMarkerNodeAdded,
  // Update on pasting a marker Node
  doesMarkerNodePasted,
  // Update on deleting any Node
  // Without checking for deleting only marker nodes,
  // because it worst by performance
  doesAnyNodeDeleted,
]);

// :: Patch -> PatchFlags
const getPatchFlagsForPatch = patch => ({
  utility: XP.isUtilityPatch(patch),
  deprecated: XP.isDeprecatedPatch(patch),
});

// :: StrMap PatchPath PatchFlags -> Project -> StrMap PatchPath PatchFlags
const getPatchFlagsForEntireProject = R.curry((oldPatchFlags, newProject) =>
  R.compose(
    R.map(getPatchFlagsForPatch),
    R.indexBy(XP.getPatchPath),
    XP.listPatches
  )(newProject)
);

// :: StrMap PatchPath PatchFlags -> PatchPath -> Project -> StrMap PatchPath PatchFlags
const updatePatchFlagsForChangedPatch = R.curry(
  (oldPatchFlags, patchPath, newProject) =>
    R.compose(
      foldMaybe(
        R.omit([patchPath], oldPatchFlags),
        R.compose(
          R.assoc(patchPath, R.__, oldPatchFlags),
          getPatchFlagsForPatch
        )
      ),
      XP.getPatchByPath
    )(patchPath, newProject)
);

// :: StrMap PatchPath PatchFlags -> Project -> Action -> StrMap PatchPath PatchFlags
export const getNewPatchFlags = R.curry((oldPatchFlags, newProject, action) =>
  R.ifElse(
    isLoadingProjectAction,
    () => getPatchFlagsForEntireProject(oldPatchFlags, newProject),
    R.compose(
      updatePatchFlagsForChangedPatch(oldPatchFlags, R.__, newProject),
      R.path(['payload', 'patchPath'])
    )
  )(action)
);

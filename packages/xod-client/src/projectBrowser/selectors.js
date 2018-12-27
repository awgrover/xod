import * as R from 'ramda';
import { createSelector } from 'reselect';

import * as XP from 'xod-project';

import { createMemoizedSelector } from '../utils/selectorTools';
import * as ProjectSelectors from '../project/selectors';
import * as HintingSelectors from '../hinting/selectors';
import { isPatchDeadTerminal } from '../project/utils';

export const getProjectBrowser = R.prop('projectBrowser');

export const shouldShowDeprecatedPatches = createSelector(
  getProjectBrowser,
  R.path(['filters', 'deprecated'])
);

export const shouldShowUtilityPatches = createSelector(
  getProjectBrowser,
  R.path(['filters', 'utility'])
);

export const getSelectedPatchPath = createSelector(
  getProjectBrowser,
  R.prop('selectedPatchPath')
);

export const getProjectName = createSelector(
  ProjectSelectors.getProject,
  R.compose(R.when(R.isEmpty, R.always('My Project')), XP.getProjectName)
);

// :: HintingErrors -> Patch -> Patch
const markDeadPatches = R.curry((errors, patch) =>
  R.pipe(XP.getPatchPath, R.has(R.__, errors), R.assoc('dead', R.__, patch))(
    patch
  )
);

// :: StrMap PatchPath PathFlags -> Patch -> Patch
const markDeprecatedPatches = R.curry((patchFlags, patch) =>
  R.compose(
    R.assoc('isDeprecated', R.__, patch),
    patchPath => R.pathOr(false, [patchPath, 'deprecated'], patchFlags),
    XP.getPatchPath
  )(patch)
);

// :: StrMap PatchPath PathFlags -> Patch -> Patch
const markUtilityPatches = R.curry((patchFlags, patch) =>
  R.compose(
    R.assoc('isUtility', R.__, patch),
    patchPath => R.pathOr(false, [patchPath, 'utility'], patchFlags),
    XP.getPatchPath
  )(patch)
);

const getPatchPaths = R.pipe(R.indexBy(XP.getPatchPath), R.keys);
// :: [Patch] -> [Patch] -> Boolean
const samePatchPaths = R.useWith(R.equals, [getPatchPaths, getPatchPaths]);

const getLocalPatchesList = createSelector(
  ProjectSelectors.getProject,
  XP.listLocalPatches
);

export const getLocalPatches = createMemoizedSelector(
  [
    HintingSelectors.getErrors,
    HintingSelectors.getPatchFlags,
    getLocalPatchesList,
  ],
  [R.equals, R.equals, samePatchPaths],
  (errors, patchFlags, patches) =>
    R.compose(
      R.sortBy(XP.getPatchPath),
      R.map(
        R.compose(
          markUtilityPatches(patchFlags),
          markDeprecatedPatches(patchFlags),
          markDeadPatches(errors)
        )
      )
    )(patches)
);

// TODO: this is not actually label anymore
export const getSelectedPatchLabel = createSelector(
  [ProjectSelectors.getProject, getSelectedPatchPath],
  (project, selectedPatchPath) =>
    selectedPatchPath
      ? XP.getPatchByPath(selectedPatchPath, project)
          .map(R.pipe(XP.getPatchPath, XP.getBaseName))
          .getOrElse('')
      : ''
);

const getLibraryPatchesList = createSelector(
  ProjectSelectors.getProject,
  XP.listLibraryPatches
);

export const getLibs = createMemoizedSelector(
  [
    HintingSelectors.getErrors,
    HintingSelectors.getPatchFlags,
    getLibraryPatchesList,
  ],
  [R.equals, R.equals, samePatchPaths],
  (errors, patchFlags, patches) =>
    R.compose(
      R.map(R.sort(R.ascend(XP.getPatchPath))),
      R.groupBy(R.pipe(XP.getPatchPath, XP.getLibraryName)),
      R.reject(isPatchDeadTerminal),
      R.map(
        R.compose(
          markUtilityPatches(patchFlags),
          markDeprecatedPatches(patchFlags),
          markDeadPatches(errors)
        )
      )
    )(patches)
);

export const getInstallingLibraries = R.compose(
  R.prop('installingLibraries'),
  getProjectBrowser
);

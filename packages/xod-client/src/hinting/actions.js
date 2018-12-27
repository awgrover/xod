import UPDATE_HINTING from './actionType';

export default (deducedTypes, errors, patchSearchData, patchFlags) => ({
  type: UPDATE_HINTING,
  payload: { deducedTypes, errors, patchSearchData, patchFlags },
});

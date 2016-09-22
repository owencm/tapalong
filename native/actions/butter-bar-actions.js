import {
  SHOW_BUTTER_BAR,
  HIDE_BUTTER_BAR,
} from '../constants/action-types.js'

export function showButterBar() {
  return {
    type: SHOW_BUTTER_BAR,
  }
}

export function hideButterBar() {
  return {
    type: HIDE_BUTTER_BAR,
  }
}

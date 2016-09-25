import {
  ADD_EVENTS,
  REMOVE_EVENT,
  EXPAND_EVENT,
  UNEXPAND_EVENT,
} from '../constants/action-types.js'

import network from '../network.js'

/* Events actions */

export function addEvents(events) {
  return {
    type: ADD_EVENTS,
    events,
  }
}

export function removeEvent(clientId) {
  return {
    type: REMOVE_EVENT,
    clientId,
  }
}

export function expandEvent(plan) {
  return {
    type: EXPAND_EVENT,
    plan,
  }
}

export function unexpandEvent(plan) {
  return {
    type: UNEXPAND_EVENT,
    plan,
  }
}

/* Event thunks */

export function requestRefreshEvents(userId, sessionToken) {
  return (dispatch) => {
    return network.requestEventsFromServer({userId, sessionToken}).then((events) => {
      dispatch(addEvents(events))
    })
  }
}

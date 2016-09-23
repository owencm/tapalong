import {
  ADD_PLAN,
  REMOVE_PLAN,
  EXPAND_PLAN,
  UNEXPAND_PLAN,
  UPDATE_PLAN,
} from '../constants/action-types.js'

import {
  showButterBar,
  hideButterBar,
} from './butter-bar-actions.js'

import network from '../network.js'
import validatePlan from '../lib/validate-plan.js'

/* Plans actions */

export function addPlan(plan) {
  return {
    type: ADD_PLAN,
    plan,
  }
}

export function removePlan(clientId) {
  return {
    type: REMOVE_PLAN,
    clientId,
  }
}

export function updatePlan(clientId, plan) {
  return {
    type: UPDATE_PLAN,
    clientId,
    plan,
  }
}

export function expandPlan(plan) {
  return {
    type: EXPAND_PLAN,
    plan,
  }
}

export function unexpandPlan(plan) {
  return {
    type: UNEXPAND_PLAN,
    plan,
  }
}

/* Plans thunks */

// Todo: why do these take session tokens and user ids?

export function requestSetAttending(userId, sessionToken, plan, attending) {
  return (dispatch) => {
    // This is the poor man's optimistic UI. We dispatch an update and mark
    //   it as pending and then replace with the real plan when we get it
    //   back from the server
    const optimisticPlan = Object.assign({}, plan, { isAttending: attending, pending: true })
    dispatch(updatePlan(plan.clientId, optimisticPlan))
    // Hacky butter bar
    if (attending) {
      setTimeout(() => {
        dispatch(showButterBar())
        setTimeout(() => { dispatch(hideButterBar()) }, 4000)
      }, 1000)
    }
    return network.requestSetAttending({userId, sessionToken}, plan, attending)
      .then((updatedPlan) => {
        dispatch(updatePlan(plan.clientId, updatedPlan));
      })
  }
};

export function requestRefreshPlans(userId, sessionToken) {
  return (dispatch) => {
    return network.requestPlansFromServer({userId, sessionToken}).then((plans) => {
      for (let i = 0; i < plans.length; i++) {
        const plan = plans[i]
        dispatch(addPlan(plan))
      }
    })
  }
}

export function requestCreatePlan(userId, sessionToken, newPlan) {
  return (dispatch) => {
    const validity = validatePlan(newPlan);
    if (validity.isValid) {
      return network.requestCreatePlan({userId, sessionToken}, newPlan)
        .then((updatedPlan) => {
          dispatch(addPlan(updatedPlan))
        })
    } else {
      alert(validity.reason)
      console.log('Plan wasn\'t valid because '+validity.reason, newPlan)
      return new Promise((resolve, reject) => {
        throw new Error('Plan wasn\'t valid because '+validity.reason, newPlan)
      })
    }
  }
}

// TODO: Implement client side validity checking
export function requestUpdatePlan(userId, sessionToken, plan, planChanges) {
  return (dispatch) => {
    const validity = validatePlan(Object.assign({}, plan, planChanges))
    if (validity.isValid) {
      return network.requestUpdatePlan({userId, sessionToken}, plan, planChanges)
        .then((updatedPlan) => {
          dispatch(removePlan(plan.clientId));
          dispatch(addPlan(updatedPlan));
        })
    } else {
      alert(validity.reason)
      console.log('Plan wasn\'t valid because '+validity.reason, plan, planChanges)
      return new Promise((resolve, reject) => {
        throw new Error('Plan wasn\'t valid because '+validity.reason, plan, planChanges)
      })
    }
  }
}

export function requestDeletePlan(userId, sessionToken, plan) {
  return (dispatch) => {
    return network.requestCancelPlan({userId, sessionToken}, plan)
      .then((updatedPlan) => {
        dispatch(removePlan(plan.clientId));
      })
  }
}

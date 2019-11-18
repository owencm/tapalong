import {
  ADD_PLANS,
  REMOVE_PLAN,
  EXPAND_PLAN,
  UNEXPAND_PLAN,
  UPDATE_PLAN,
  SET_PLANS_INITIALIZED_STATE,
  CLEAR_NON_MATCHING_PLANS,
} from '../constants/action-types.js'

import {
  showButterBar,
  hideButterBar,
} from './butter-bar-actions.js'

import network from '../network.js'
import validatePlan from '../lib/validate-plan.js'

import { setUser } from './user-actions.js'

/* Plans actions */

export function addPlans(plans) {
  return {
    type: ADD_PLANS,
    plans,
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

export function expandPlan(planId) {
  return {
    type: EXPAND_PLAN,
    planId,
  }
}

export function unexpandPlan(planId) {
  return {
    type: UNEXPAND_PLAN,
    planId,
  }
}

export function setPlansInitialized(initialized) {
  return {
    type: SET_PLANS_INITIALIZED_STATE,
    initialized,
  }
}

export function clearNonMatchingPlans(plans) {
  return {
    type: CLEAR_NON_MATCHING_PLANS,
    plans,
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
        setTimeout(() => { dispatch(hideButterBar()) }, 6000)
      }, 1500)
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
      dispatch(setPlansInitialized(true))
      // This adds or updates plans, but need to ensure we clear any plans that weren't returned (because deleted, ACLs changed etc)
      dispatch(addPlans(plans))
      dispatch(clearNonMatchingPlans(plans))
    }).catch((e) => {
      // If the session token has become invalid, this logs the user out so they can reauthenticate.
      // This is a hack because I couldn't see a nice way to listen for any 403s for any requests and trigger logout.
      if (e === 403) {
        dispatch(setUser())
        // TODO: navigate the user to the login screen and suppress the errors from the network stack.
        // Note, not possible today because screen navigation is not within redux
      }
    }).catch((e) => { alert(e) })
  }
}

export function requestCreatePlan(userId, sessionToken, newPlan) {
  return (dispatch) => {
    const validity = validatePlan(newPlan);
    if (validity.isValid) {
      return network.requestCreatePlan({userId, sessionToken}, newPlan)
        .then((updatedPlan) => {
          dispatch(addPlans([updatedPlan]))
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
          dispatch(addPlans([updatedPlan]));
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

export function requestReportPlan(userId, sessionToken, plan) {
  return (dispatch) => {
    return network.requestReportPlan({userId, sessionToken}, plan)
      .then(() => {
        alert('Your report has been received. A member of our team will review it as soon as possible and take action as appropriate.')
        // dispatch(removePlan(plan.clientId));
      })
  }
}

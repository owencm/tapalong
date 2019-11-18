import {
  ADD_PLANS,
  REMOVE_PLAN,
  EXPAND_PLAN,
  UNEXPAND_PLAN,
  UPDATE_PLAN,
  SET_PLANS_INITIALIZED_STATE,
  CLEAR_NON_MATCHING_PLANS,
} from '../constants/action-types.js'
import m from '../m.js'

// TODO: determine whether concept of clientID is still needed and consider removing to simplify

// TODO: Refactor to somewhere else (duplicated with actions.js)
let validateNewPlan = function (plan) {
  // TODO: Validate values of the properties
  // TODO: Validate client generated ones separately to server given ones
  let properties = ['description', 'startTime', 'title'];
  let hasProperties = properties.reduce(function(previous, property) {
    return (previous && plan.hasOwnProperty(property));
  }, true);
  if (!hasProperties) {
    return {isValid: false, reason: 'some properties were missing'};
  }
  if (plan.title == '') {
    return {isValid: false, reason: 'missing title'};
  }
  if (!plan.startTime || !(plan.startTime instanceof Date)) {
    return {isValid: false, reason: 'startTime wasnt a date object or was missing'};
  }
  if (plan.startTime && plan.startTime instanceof Date) {
    // Allow users to see and edit events up to 2 hours in the past
    let now = new Date;
    now = now.add(-2).hours();
    if (plan.startTime < now) {
      return {isValid: false, reason: `date must be in the future (${plan.startTime.toString()} was invalid)`};
    }
  }
  return {isValid: true};
};

const sortByTime = (a, b) => {
  if (a.startTime - b.startTime === 0) {
    return a.clientId - b.clientId
  }
  return a.startTime - b.startTime
}

const planReducer = (state = {
                          plans: [],
                          maxPlanId: 0,
                          initialized: false,
                          selectedPlans: [],
                        }, action) => {

  switch (action.type) {

    // This adds the plans given, but if a plan with the same server ID already exists we replace it
    case ADD_PLANS:

      // Validate the new plans to be added
      let newPlans = action.plans.filter(plan => {
        let validity = validateNewPlan(plan)
        if (!validity.isValid) {
          // console.log(`Invalid plan attempted to be added: ${validity.reason}`);
        }
        return validity.isValid
      })

      // For each existing plan, check if it has a matching server ID to any new plan.
      // If so, copy the client IDs to the new plan, if not, push it to a list of plans we're keeping
      let plansToKeep = []
      for (let oldPlan of state.plans) {
        let foundMatchingOldPlan = false
        for (let newPlan of newPlans) {
          if (oldPlan.id === newPlan.id) {
            newPlan.clientId = oldPlan.clientId
            foundMatchingOldPlan = true
            break;
          }
        }
        if (!foundMatchingOldPlan) {
          plansToKeep.push(oldPlan)
        }
      }

      let maxPlanId = state.maxPlanId
      // For each new plan, check that it has a clientId or give it one
      for (let newPlan of newPlans) {
        if (newPlan.clientId === undefined) {
          newPlan.clientId = maxPlanId++
        }
      }

      // Join the plans to keep from before with the new plans
      return Object.assign(
        {},
        state,
        {
          plans: [...plansToKeep, ...newPlans].sort(sortByTime),
          maxPlanId: maxPlanId
        },
      );
    case REMOVE_PLAN:
      return Object.assign({}, state,
        {
          plans: [...state.plans].filter((plan) => {
            return plan.clientId !== action.clientId;
          })
        }
      );
    // Can maybe remove this and just use ADD_PLANS since it keeps newer versions of plans
    case UPDATE_PLAN:
      // TODO: validate plan

      const oneRemoved = [...state.plans].filter((plan) => {
        return plan.clientId !== action.clientId;
      })

      const updatedPlans = [...oneRemoved, action.plan].sort(sortByTime)

      return Object.assign(
        {},
        state,
        {
          plans: updatedPlans,
          initialized: true
        }
      );
    case EXPAND_PLAN:
      return Object.assign({}, state,
        {
          selectedPlans: [...state.selectedPlans, action.planId]
        }
      )
    case UNEXPAND_PLAN:
      return Object.assign({}, state,
        {
          selectedPlans: state.selectedPlans.filter(planId => planId !== action.planId)
        }
      )
    case SET_PLANS_INITIALIZED_STATE:
      return Object.assign({}, state, {
        initialized: action.initialized
      })
    case CLEAR_NON_MATCHING_PLANS:
      idsOfPlansToKeep = action.plans.map(plan => plan.id)

      return Object.assign({}, state,
        {
          plans: [...state.plans].filter((plan) => {
            return idsOfPlansToKeep.indexOf(plan.id) > -1
          })
        }
      );
    default:
      return state;
    }
  }

  export default planReducer

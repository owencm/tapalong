import {
  ADD_PLAN,
  REMOVE_PLAN,
  EXPAND_PLAN,
  UNEXPAND_PLAN,
  UPDATE_PLAN,
} from '../constants/action-types.js'
import m from '../m.js'

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
    console.log('Sort time was the same so sorting by clientId', a, b)
    return a.clientId - b.clientId
  }
  return a.startTime - b.startTime
}

const planReducer = (state = {
                          plans: [],
                          maxPlanId: 0,
                          initialized: false,
                        }, action) => {

  switch (action.type) {
    case ADD_PLAN:
      let validity = validateNewPlan(action.plan);
      if (!validity.isValid) {
        console.log(`Invalid plan attempted to be added: ${validity.reason}`);
        return Object.assign({}, state, { initialized: true });
      }
      return Object.assign(
        {},
        state,
        {
          plans: [...state.plans,
            Object.assign({}, action.plan, { clientId: state.maxPlanId })
          ].sort(sortByTime),
          maxPlanId: state.maxPlanId + 1
        },
        { initialized: true }
      );
    case REMOVE_PLAN:
      return Object.assign({}, state,
        {
          plans: [...state.plans].filter((plan) => {
            return plan.clientId !== action.clientId;
          })
        }
      );
    case UPDATE_PLAN:
      // TODO: validate plan

      const oneRemoved = [...state.plans].filter((plan) => {
        return plan.clientId !== action.clientId;
      })

      const newPlans = [...oneRemoved, action.plan].sort(sortByTime)

      return Object.assign(
        {},
        state,
        {
          plans: newPlans,
          initialized: true
        }
      );
    case EXPAND_PLAN:
      return Object.assign({}, state,
        {
          selectedPlan: action.plan
        }
      )
    case UNEXPAND_PLAN:
      return Object.assign({}, state,
        {
          selectedPlan: undefined
        }
      )
    default:
      return state;
    }
  }

  export default planReducer

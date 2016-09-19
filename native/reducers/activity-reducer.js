import {
  ADD_ACTIVITY,
  REMOVE_ACTIVITY,
  EXPAND_ACTIVITY,
  UNEXPAND_ACTIVITY,
} from '../constants/action-types.js'
import m from '../m.js'

// TODO: Refactor to somewhere else (duplicated with actions.js)
let validateNewActivity = function (activity) {
  // TODO: Validate values of the properties
  // TODO: Validate client generated ones separately to server given ones
  let properties = ['description', 'startTime', 'title'];
  let hasProperties = properties.reduce(function(previous, property) {
    return (previous && activity.hasOwnProperty(property));
  }, true);
  if (!hasProperties) {
    return {isValid: false, reason: 'some properties were missing'};
  }
  if (activity.title == '') {
    return {isValid: false, reason: 'missing title'};
  }
  if (!activity.startTime || !(activity.startTime instanceof Date)) {
    return {isValid: false, reason: 'startTime wasnt a date object or was missing'};
  }
  if (activity.startTime && activity.startTime instanceof Date) {
    // Allow users to see and edit events up to 2 hours in the past
    let now = new Date;
    now = now.add(-2).hours();
    if (activity.startTime < now) {
      return {isValid: false, reason: `date must be in the future (${activity.startTime.toString()} was invalid)`};
    }
  }
  return {isValid: true};
};

const activityReducer = (state = {
                          activities: [],
                          maxActivityId: 0,
                          initialized: false,
                        }, action) => {
  switch (action.type) {
    case ADD_ACTIVITY:
      let validity = validateNewActivity(action.activity);
      if (!validity.isValid) {
        console.log(`Invalid activity attempted to be added: ${validity.reason}`);
        return state;
      }
      return Object.assign({}, state,
        {
          activities: [...state.activities,
            Object.assign({}, action.activity, { clientId: state.maxActivityId })
          ].sort((a, b) => { return a.startTime < b.startTime ? -1 : 1 }),
          maxActivityId: state.maxActivityId + 1
        }
      );
    case REMOVE_ACTIVITY:
      return Object.assign({}, state,
        {
          activities: [...state.activities].filter((activity) => {
            return activity.clientId !== action.clientId;
          })
        }
      );
    case EXPAND_ACTIVITY:
      return Object.assign({}, state,
        {
          selectedActivity: action.activity
        }
      )
    case UNEXPAND_ACTIVITY:
      return Object.assign({}, state,
        {
          selectedActivity: undefined
        }
      )
    default:
      return state;
    }
  }

  export default activityReducer

import {
  ADD_EVENT,
  REMOVE_EVENT,
  EXPAND_EVENT,
  UNEXPAND_EVENT,
} from '../constants/action-types.js'
import m from '../m.js'

// const sortByTime = (a, b) => {
//   if (a.startTime - b.startTime === 0) {
//     console.log('Sort time was the same so sorting by clientId', a, b)
//     return a.clientId - b.clientId
//   }
//   return a.startTime - b.startTime
// }

const eventReducer = (state = {
                        events: [],
                        initialized: false,
                      }, action) => {

  switch (action.type) {
    case ADD_EVENT:
      return Object.assign(
        {},
        state,
        {
          events: [...state.events, action.event],
        },
        { initialized: true }
      )
    // case REMOVE_PLAN:
    //   return Object.assign({}, state,
    //     {
    //       plans: [...state.plans].filter((plan) => {
    //         return plan.clientId !== action.clientId;
    //       })
    //     }
    //   );
    // case EXPAND_PLAN:
    //   return Object.assign({}, state,
    //     {
    //       selectedPlan: action.plan
    //     }
    //   )
    // case UNEXPAND_PLAN:
    //   return Object.assign({}, state,
    //     {
    //       selectedPlan: undefined
    //     }
    //   )
    default:
      return state;
    }
  }

  export default eventReducer

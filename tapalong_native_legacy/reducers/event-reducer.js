import {
  ADD_EVENTS,
  REMOVE_EVENT,
  EXPAND_EVENT,
  UNEXPAND_EVENT,
} from '../constants/action-types.js'
import m from '../m.js'

const eventReducer = (state = {
                        events: [],
                        initialized: false,
                      }, action) => {

  switch (action.type) {
    case ADD_EVENTS:
      return Object.assign(
        {},
        state,
        {
          events: [...state.events, ...action.events],
        },
        { initialized: true }
      )
    default:
      return state;
    }
  }

  export default eventReducer

import { combineReducers } from 'redux'
import nav from './nav-reducer.js'
import activities from './activity-reducer.js'
import user from './user-reducer.js'

const rootReducer = combineReducers({
  nav, activities, user
})

export default rootReducer

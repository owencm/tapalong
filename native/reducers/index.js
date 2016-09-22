import { combineReducers } from 'redux'
import nav from './nav-reducer.js'
import activities from './activity-reducer.js'
import user from './user-reducer.js'
import butterBar from './butter-bar-reducer.js'

const rootReducer = combineReducers({
  nav, activities, user, butterBar
})

export default rootReducer

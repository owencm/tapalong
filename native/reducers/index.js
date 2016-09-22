import { combineReducers } from 'redux'
import nav from './nav-reducer.js'
import plans from './plan-reducer.js'
import user from './user-reducer.js'
import butterBar from './butter-bar-reducer.js'

const rootReducer = combineReducers({
  nav, plans, user, butterBar
})

export default rootReducer

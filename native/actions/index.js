// Note this probably isn't the best way to group a set of imports. Find a better way
import * as activityActions from './activity-actions.js'
import * as userActions from './user-actions.js'
import * as navActions from './nav-actions.js'
import m from '../m.js'

const actions = m(activityActions, userActions, navActions)

export default actions

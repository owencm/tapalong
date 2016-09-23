// Note this probably isn't the best way to group a set of imports. Find a better way
import * as planActions from './plan-actions.js'
import * as userActions from './user-actions.js'
import * as navActions from './nav-actions.js'
import * as butterBarActions from './butter-bar-actions.js'
import * as eventActinos from './event-actions.js'
import m from '../m.js'

const actions = m(planActions, userActions, navActions, butterBarActions, eventActinos)

export default actions

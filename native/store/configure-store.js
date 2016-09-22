import { createStore, combineReducers, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import rootReducer from '../reducers/index.js'
import actions from '../actions/index.js'
const { setUser, requestRefreshPlans } = actions

const configureStore = () => {
  const store = createStore(rootReducer, applyMiddleware(thunk))

  // To ease debugging, output state whenever it changes
  store.subscribe(() => console.log('Store updated: ', store.getState()))

  return store;
}

export default configureStore

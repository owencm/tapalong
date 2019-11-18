import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import rootReducer from '../reducers/index.js'

const configureStore = () => {
  const store = createStore(rootReducer, applyMiddleware(thunk))

  // To ease debugging, output state whenever it changes
  // store.subscribe(() => console.log('Store updated: ', store.getState()))

  // if (module.hot) {
  //   // Enable Webpack hot module replacement for reducers
  //   module.hot.accept(() => {
  //     const nextRootReducer = require('../reducers/index.js').default
  //     store.replaceReducer(nextRootReducer);
  //   });
  // }

  return store
}

export default configureStore

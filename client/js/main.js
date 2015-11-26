import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux'
import App from './app.js';
import m from './m.js';

// Require model
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { gotoScreen, gotoEditScreen,
  gotoNextScreen, queueNextScreen,
  setUser, addActivity,
  requestRefreshActivities, login } from './actions.js';
import { screens, user, activities } from './reducers.js';

import persistence from './persistence.js';
import { SCREEN } from './screens.js';

const createStoreWithMiddleware = applyMiddleware(
  thunk
)(createStore);

const store = createStoreWithMiddleware(combineReducers({screens, user, activities}));

store.subscribe(() => console.log(store.getState()));

// TODO: Handle the session token expiring
persistence.isLoggedIn().then(({userId, userName, sessionToken}) => {
  store.dispatch(setUser(userId, userName, sessionToken));
  return store.dispatch(requestRefreshActivities(userId, sessionToken));
}).then(() => {
  return store.dispatch(gotoScreen(SCREEN.list));
}).catch((e) => {
  store.dispatch(gotoScreen(SCREEN.loggedOut));
});

render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('appShell')
);

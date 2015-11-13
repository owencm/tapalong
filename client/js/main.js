let FastClick = require('fastclick');
FastClick(document.body);

// Require react and UI components
import React from 'react';
import ReactDOM from 'react-dom';
import Login from './login.js';
import ActivityCardList from './activity-card-list.js';
import EditActivity from './edit-activity-card.js';
import OptIn from './opt-in.js';
import Header from './header.js';
import FabButton from './fab.js';

// Require model
import { createStore, combineReducers } from 'redux';
import { gotoScreen, gotoEditScreen,
  gotoNextScreen, queueNextScreen,
  setUser } from './actions.js';
import { screens, user } from './reducers.js';

// Require core logic
import objectDB from './objectdb.js';
import models from './models.js';
import swLibrary from './swsetup.js'
import m from './m.js';

import { SCREEN } from './screens.js';

let store = createStore(combineReducers({screens, user}));

store.subscribe(() => {
    console.log(store.getState());
    redrawCurrentView();
  }
);

let db = objectDB.open('db-1');

// TODO: Ideally remove this by moving to a redux persistence library
// TODO: Handle the session token expiring
// Note objectDB does not use actual promises so we can't properly chain this
db.get().then((data) => {
  let sessionToken = data.sessionToken;
  let userName = data.userName;
  let userId = data.userId;
  let loggedIn = !(sessionToken == null || userId == null || userName == null);
  if (loggedIn) {
    store.dispatch(setUser(userId, userName, sessionToken));
    models.user.setUserName(userName);
    models.user.setUserId(userId);
    models.user.setSessionToken(sessionToken);
    models.activities.tryRefreshActivities(handleViewList, () => {});
  } else {
    store.dispatch(gotoScreen(SCREEN.loggedOut));
  }
});

let App = (props) => {

  // Get state from store
  let screen = store.getState().screens.screen;
  let optInReason = store.getState().screens.optInReason;
  let nextScreen = store.getState().screens.nextScreen;
  let activityForEditing = store.getState().screens.activityForEditing;
  // Move me into props and redux etc etc
  let activities = models.activities.getActivities();

  if (screen == SCREEN.uninitialized) {
    // TODO: Work out how to return nothing from a stateless component
    return <div/>;
  }

  // TODO: Refactor this mess!
  if (screen == SCREEN.loggedOut) {
    return <Login onLoginComplete={handleViewList} />;
  } else {
    let mainContents;
    if (screen == SCREEN.list) {
      mainContents = (
        <ActivityCardList
          activities ={activities}
          onAttendClick={handleAttend}
          onUnattendClick={handleUnattend}
          onEditClick={(activity) => store.dispatch(gotoEditScreen(activity))}
        />
      );
    } else if (screen == SCREEN.notificationsOptIn) {
      mainContents = (
        <OptIn
          reason={optInReason}
          nextState={nextScreen}
          onOptInComplete={() => store.dispatch(gotoNextScreen())}
        />
      );
    } else if ([SCREEN.create, SCREEN.edit].indexOf(screen) > -1) {
      mainContents = (
        <EditActivity
          activity={activityForEditing}
          userName={models.user.getUserName()}
          onSaveComplete={handleActivitySaveComplete}
          onCreateComplete={handleActivityCreateComplete}
          onDeleteComplete={handleViewList}
        />
      );
    }
    let headerIfNeeded = null;
    if (shouldShowHeader(screen)) {
      headerIfNeeded = (
        <Header
          title={getScreenTitle(screen)}
          shouldShowBackButton={shouldShowBackButton(screen)}
          onBackButtonClick={handleViewList}
        />
      );
    }
    let createButtonIfNeeded = null;
    if (shouldShowCreateButton(screen)) {
      createButtonIfNeeded = <FabButton onClick={() => store.dispatch(gotoEditScreen(undefined)) } />;
    }
    return (
      <div>
        <div id='container'>
          {mainContents}
          <div style={{height: '100px'}}></div>
        </div>
        { /* Note these must be below the container to capture the clicks */ }
        { headerIfNeeded }
        { createButtonIfNeeded }
      </div>
    )
  }
}

/* Stateless helpers */

let shouldShowHeader = (screen) => {
  return !([SCREEN.uninitialized, SCREEN.loggedOut].indexOf(screen) > -1);
};

let shouldShowBackButton = (screen) => {
  return ([SCREEN.create, SCREEN.edit].indexOf(screen) > -1);
};

let shouldShowCreateButton = (screen) => {
  return (screen == SCREEN.list);
};

let getScreenTitle = (screen) => {
  if (screen == SCREEN.list) {
    return 'Upcoming Plans';
  } else if (screen == SCREEN.edit) {
    return 'Edit';
  } else if (screen == SCREEN.create) {
    return 'Create'
  } else if (screen == SCREEN.notificationsOptIn) {
    return 'Stay up to date'
  } else {
    return 'Uh oh: title shouldn\'t be showing';
  }
};

/* Stateful action wrapper */

let handleScreenChange = (newScreen, options, userTriggered) => {
  if (options && options.nextScreen) {
    store.dispatch(queueNextScreen(options.nextScreen, options.reason));
  }
  store.dispatch(gotoScreen(newScreen));
};

// Syntactic sugar since we call this all the time
let handleViewList = () => {
  handleScreenChange(SCREEN.list);
};

let handleActivitySaveComplete = () => {
  // Don't ask the user to grant permission unless the browser supports it
  if (swLibrary.browserSupportsSWAndNotifications()) {
    swLibrary.hasPushNotificationPermission(() => {
      handleViewList();
    }, () => {
      handleScreenChange(SCREEN.notificationsOptIn, {nextScreen: SCREEN.list, userTriggered: true, reason: 'when a friend says they want to come along'}, false);
    });
  } else {
    handleViewList();
  }
};

let handleActivityCreateComplete = () => {
  // From a flow standpoint we do the same when creating as saving
  handleActivitySaveComplete();
};

let handleAttend = (activity) => {
  // Note we change screen without waiting for network to complete
  // Don't ask the user to grant permission unless the browser supports it
  if (swLibrary.browserSupportsSWAndNotifications()) {
    swLibrary.hasPushNotificationPermission(() => {
      handleViewList();
    }, () => {
      handleScreenChange(SCREEN.notificationsOptIn, {nextScreen: SCREEN.list, userTriggered: true, reason: 'if the plan changes'}, false);
    });
  } else {
    handleViewList();
  }
  // Note no callback since the list will automatically redraw when this changes
  let optimistic = activity.dirty == undefined;
  models.activities.trySetAttending(activity, !activity.is_attending, optimistic, () => {}, () => {
    console.log('Uhoh, an optimistic error was a mistake!!');
    alert('An unexpected error occurred. Please refresh.');
  });
};

let handleUnattend = (activity) => {
  // Note no callback since the list will automatically redraw when this changes
  let optimistic = activity.dirty == undefined;
  models.activities.trySetAttending(activity, !activity.is_attending, optimistic, () => {}, () => {
    console.log('Uhoh, an optimistic error was a mistake!!');
    alert('An unexpected error occurred. Please refresh.');
  });
};

// TODO: Re-add history support
// window.addEventListener('popstate', function(e) {
//   console.log('User pressed back, popping a state');
//   console.log(e);
//   if (e.state !== null && e.state.state !== undefined) {
//     console.log('Moving back in history to state '+e.state.state);
//     changeState(e.state.state, {}, false);
//   } else {
//     // Note safari calls popstate on page load so this is expected
//     console.log('Uh oh, no valid state in history to move back to (this is expected on safari pageload)');
//   }
// });

// TODO: set form fields to blur after enter pressed
  // titleInputElem.addEventListener('keydown', function(key) {
  //   if (key.keyCode == 13) {
  //     this.blur();
  //   }
  // });

let redrawCurrentView = function () {
  ReactDOM.render(
    <App />,
    document.getElementById('appShell')
  );
};

models.activities.addListener(redrawCurrentView);
redrawCurrentView();

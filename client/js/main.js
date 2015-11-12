var FastClick = require('fastclick');
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
import { createStore } from 'redux';

// Require core logic
import objectDB from './objectdb.js';
import models from './models.js';
import swLibrary from './swsetup.js'
import m from './m.js';

var GOTO_SCREEN = 'GOTO_SCREEN';
var GOTO_EDIT_SCREEN = 'GOTO_EDIT_SCREEN';
var GOTO_NEXT_SCREEN = 'GOTO_NEXT_SCREEN';
var QUEUE_NEXT_SCREEN = 'QUEUE_NEXT_SCREEN';
var SCREEN = {create: 0, list: 1, edit: 2, loggedOut: 3, uninitialized: 4, notificationsOptIn: 5};

var defaultState = {
  screen: SCREEN.uninitialized
}

function reducer(state = defaultState, action) {
  switch (action.type) {
    case GOTO_SCREEN:
      return m({}, state, { screen: action.screen });
    case GOTO_EDIT_SCREEN:
      return m({}, state, { screen: SCREEN.edit, activityForEditing: action.activityForEditing });
    case GOTO_NEXT_SCREEN:
      return m({}, state, { screen: state.nextScreen });
    case QUEUE_NEXT_SCREEN:
      return m({}, state, { nextScreen: action.nextScreen, optInReason: action.optInReason });
    default:
      return state;
  }
}

let store = createStore(reducer);

store.subscribe(() => {
    // console.log(store.getState());
    redrawCurrentView();
  }
);

var db = objectDB.open('db-1');
var dbAfterGet = db.get();

// TODO: Handle the session token expiring
// Note objectDB does not use actual promises so we can't properly chain this
dbAfterGet.then((data) => {
  var sessionToken = data.sessionToken;
  var userName = data.userName;
  var userId = data.userId;
  var loggedIn = !(sessionToken == null || userId == null || userName == null);
  if (loggedIn) {
    models.user.setUserName(userName);
    models.user.setUserId(userId);
    models.user.setSessionToken(sessionToken);
    models.activities.tryRefreshActivities(() => {
      store.dispatch({type: GOTO_SCREEN, screen: SCREEN.list});
    }, () => {
      console.log('Failed to download activities');
    });
  } else {
    store.dispatch({ type: GOTO_SCREEN, screen: SCREEN.loggedOut });
  }
});

var App = (props) => {

  let screen = store.getState().screen;
  let optInReason = store.getState().optInReason;
  let nextScreen = store.getState().nextScreen;
  let activityForEditing = store.getState().activityForEditing;
  if (screen == SCREEN.uninitialized) {
    // TODO: Work out how to return nothing from a stateless component
    return <div/>;
  }
  var activities = models.activities.getActivities();
  // TODO: Refactor this mess!
  if (screen == SCREEN.loggedOut) {
    return <Login onLoginComplete={handleViewList} />;
  } else {
    var mainContents;
    if (screen == SCREEN.list) {
      mainContents = (
        <ActivityCardList
          activities ={activities}
          onAttendClick={handleAttend}
          onUnattendClick={handleUnattend}
          onEditClick={handleStartEditing}
        />
      );
    } else if (screen == SCREEN.notificationsOptIn) {
      mainContents = (
        <OptIn
          reason={optInReason}
          nextState={nextScreen}
          onOptInComplete={handleOptInComplete}
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
    var headerIfNeeded = null;
    if (shouldShowHeader()) {
      headerIfNeeded = (
        <Header
          title={getScreenTitle()}
          shouldShowBackButton={shouldShowBackButton()}
          onBackButtonClick={handleViewList}
        />
      );
    }
    var createButtonIfNeeded = null;
    if (shouldShowCreateButton()) {
      createButtonIfNeeded = <FabButton onClick={handleStartCreating} />;
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

let shouldShowHeader = () => {
  let screen = store.getState().screen;
  return !([SCREEN.uninitialized, SCREEN.loggedOut].indexOf(screen) > -1);
};

let shouldShowBackButton = () => {
  let screen = store.getState().screen;
  return ([SCREEN.create, SCREEN.edit].indexOf(screen) > -1);
};

let shouldShowCreateButton = () => {
  let screen = store.getState().screen;
  return (screen == SCREEN.list);
};

let handleScreenChange = (newScreen, options, userTriggered) => {
  if (options && options.nextScreen) {
    store.dispatch({ type: QUEUE_NEXT_SCREEN, nextScreen: options.nextScreen, optInReason: options.reason })
  }
  store.dispatch({ type: GOTO_SCREEN, screen: newScreen });
};

let handleStartEditing = (activity) => {
  store.dispatch({ type: GOTO_EDIT_SCREEN, activityForEditing: activity });
};

let handleStartCreating = () =>{
  // Create mode and edit are the same, so make sure we aren't still referring
  // to another activity for editing
  store.dispatch({ type: GOTO_EDIT_SCREEN, activityForEditing: undefined });
};

// Syntactic sugar since we call this all the time
let handleViewList = () => {
  handleScreenChange(SCREEN.list);
};

let getScreenTitle = () => {
  let screen = store.getState().screen;
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

let handleOptInComplete = () => {
  store.dispatch({ type: GOTO_NEXT_SCREEN });
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
  var optimistic = activity.dirty == undefined;
  models.activities.trySetAttending(activity, !activity.is_attending, optimistic, () => {}, () => {
    console.log('Uhoh, an optimistic error was a mistake!!');
    alert('An unexpected error occurred. Please refresh.');
  });
};

let handleUnattend = (activity) => {
  // Note no callback since the list will automatically redraw when this changes
  var optimistic = activity.dirty == undefined;
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

var redrawCurrentView = function () {
  ReactDOM.render(
    <App />,
    document.getElementById('appShell')
  );
};

models.activities.addListener(redrawCurrentView);
redrawCurrentView();

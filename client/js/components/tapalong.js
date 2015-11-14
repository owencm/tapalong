import React from 'react';
import { render } from 'react-dom';
import Login from './login.js';
import ActivityCardList from './activity-card-list.js';
import EditActivity from './edit-activity-card.js';
import OptIn from './opt-in.js';
import Header from './header.js';
import FabButton from './fab.js';

// Require model
import { gotoScreen, gotoEditScreen,
  gotoNextScreen, queueNextScreen,
  setUser, addActivity } from '../actions.js';

// Require core logic
import swLibrary from '../swsetup.js'
import m from '../m.js';

import { SCREEN } from '../screens.js';

let FastClick = require('fastclick');
FastClick(document.body);

let Tapalong = (props) => {
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

  let gotoListViaOptIn = (reason) => {
    // Don't ask the user to grant permission unless the browser supports it
    if (swLibrary.browserSupportsSWAndNotifications()) {
      swLibrary.hasPushNotificationPermission(() => {
        props.gotoScreen(SCREEN.list);
      }, () => {
        props.queueNextScreen(SCREEN.list, reason);
        props.gotoScreen(SCREEN.notificationsOptIn);
      });
    } else {
      props.gotoScreen(SCREEN.list);
    }
  }

  /* Stateful action wrapper */

  let handleActivitySaveClicked = (activity, activityChanges) => {
    props.requestUpdateActivity(props.user.userId, props.user.sessionToken,
            activity, activityChanges).then(() => {
      gotoListViaOptIn('if the plan changes');
    });
  };

  let handleActivityCreateClicked = (activity) => {
    props.requestCreateActivity(props.user.userId, props.user.sessionToken,
            activity).then(() => {
      gotoListViaOptIn('if the plan changes');
    });
  };

  let handleActivityDeleteClicked = (activity) => {
    props.requestDeleteActivity(props.user.userId, props.user.sessionToken,
            activity).then(() => {
      props.gotoScreen(SCREEN.list);
    });
  }

  let handleAttend = (activity) => {
    let {userId, sessionToken} = props.user;
    // Note we change screen without waiting for network to complete
    // Don't ask the user to grant permission unless the browser supports it
    if (swLibrary.browserSupportsSWAndNotifications()) {
      swLibrary.hasPushNotificationPermission(() => {
        props.gotoScreen(SCREEN.list);
      }, () => {
        props.queueNextScreen(SCREEN.list, 'if the plan changes');
        props.gotoScreen(SCREEN.notificationsOptIn);
      });
    } else {
      props.gotoScreen(SCREEN.list);
    }
    props.requestSetAttending(userId, sessionToken, activity, !activity.is_attending);
  };

  let handleUnattend = (activity) => {
    let {userId, sessionToken} = props.user;
    // Note no callback since the list will automatically redraw when this changes
    props.requestSetAttending(userId, sessionToken, activity, !activity.is_attending)
  };

  let handleLoginToFacebook = (fbToken) => {
    props.login(fbToken).then(({userId, sessionToken}) => {
      return props.requestRefreshActivities(userId, sessionToken);
    }).then(() => {
      return props.gotoScreen(SCREEN.list);
    }).catch((e) => {
      console.log(e);
    });
  }

  let { screen, optInReason, nextScreen, activityForEditing } = props.screens;
  let {userId, userName, sessionToken} = props.user;
  let activities = props.activities.activities;

  if (screen == SCREEN.uninitialized) {
    // TODO: Work out how to return nothing from a stateless component
    return <div/>;
  }

  // TODO: Refactor this mess!
  if (screen == SCREEN.loggedOut) {
    return <Login onLoginToFacebook={ (fbToken) => handleLoginToFacebook(fbToken) } />;
  } else {
    let mainContents;
    if (screen == SCREEN.list) {
      mainContents = (
        <ActivityCardList
          activities ={activities}
          onAttendClick={handleAttend}
          onUnattendClick={handleUnattend}
          onEditClick={(activity) => props.gotoEditScreen(activity)}
        />
      );
    } else if (screen == SCREEN.notificationsOptIn) {
      mainContents = (
        <OptIn
          reason={optInReason}
          nextState={nextScreen}
          onOptInComplete={() => props.gotoNextScreen()}
        />
      );
    } else if ([SCREEN.create, SCREEN.edit].indexOf(screen) > -1) {
      mainContents = (
        <EditActivity
          activity={activityForEditing}
          userName={userName}
          onSaveClicked={handleActivitySaveClicked}
          onCreateClicked={handleActivityCreateClicked}
          onDeleteClicked={handleActivityDeleteClicked}
        />
      );
    }
    let headerIfNeeded = null;
    if (shouldShowHeader(screen)) {
      headerIfNeeded = (
        <Header
          title={getScreenTitle(screen)}
          shouldShowBackButton={shouldShowBackButton(screen)}
          onBackButtonClick={() => { props.gotoScreen(SCREEN.list) } }
        />
      );
    }
    let createButtonIfNeeded = null;
    if (shouldShowCreateButton(screen)) {
      createButtonIfNeeded = <FabButton onClick={() => props.gotoEditScreen(undefined) } />;
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

module.exports = Tapalong;

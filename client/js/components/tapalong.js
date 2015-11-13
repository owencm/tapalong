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
import models from '../models.js';
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

  /* Stateful action wrapper */

  let handleScreenChange = (newScreen, options, userTriggered) => {
    if (options && options.nextScreen) {
      props.queueNextScreen(options.nextScreen, options.reason);
    }
    props.gotoScreen(newScreen);
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
    let {userId, sessionToken} = props.user;
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
    models.trySetAttending(userId, sessionToken, activity, !activity.is_attending, optimistic, () => {}, () => {
      console.log('Uhoh, an optimistic error was a mistake!!');
      alert('An unexpected error occurred. Please refresh.');
    });
  };

  let handleUnattend = (activity) => {
    let {userId, sessionToken} = props.user;
    // Note no callback since the list will automatically redraw when this changes
    let optimistic = activity.dirty == undefined;
    models.trySetAttending(userId, sessionToken, activity, !activity.is_attending, optimistic, () => {}, () => {
      console.log('Uhoh, an optimistic error was a mistake!!');
      alert('An unexpected error occurred. Please refresh.');
    });
  };

  let { screen, optInReason, nextScreen, activityForEditing } = props.screens;
  let {userId, userName, sessionToken} = props.user;
  let activities = props.activities.activities;

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

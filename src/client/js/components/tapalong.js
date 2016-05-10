import React from 'react';
import { render } from 'react-dom';
import m from '../m.js';
import Login from './login.js';
import ActivityCardList from './activity-card-list.js';
import ActivityCardListPlaceholder from './activity-card-list-placeholder.js';
import EditActivity from './edit-activity-card.js';
import OptIn from './opt-in.js';
import Header from './header.js';
import FabButton from './fab.js';
import If from './if.js';
import Hint from './hint.js';
import InstallPromptDimmer from './install-prompt-dimmer.js';

import { gotoScreen, gotoEditScreen, gotoCreateScreen,
  gotoNextScreen, queueNextScreen,
  setUser, addActivity } from '../actions.js';

// Require core logic
import swLibrary from '../swsetup.js'
// Initialize the SW installation and push subscriptions
swLibrary.init();

import { SCREEN } from '../screens.js';

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

  let gotoListViaOptIn = (reason) => {
    window.swLibrary = swLibrary;
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

  let handleSaveClick = (activity, activityChanges) => {
    props.requestUpdateActivity(props.user.userId, props.user.sessionToken,
            activity, activityChanges).then(() => {
      gotoListViaOptIn('when a user says they\'re coming along');
    });
  };

  let handleCreateClick = (activity) => {
    props.requestCreateActivity(props.user.userId, props.user.sessionToken,
            activity).then(() => {
      gotoListViaOptIn('when a user says they\'re coming along');
    });
  };

  let handleDeleteClick = (activity) => {
    props.requestDeleteActivity(props.user.userId, props.user.sessionToken,
            activity).then(() => {
      props.gotoScreen(SCREEN.list);
    });
  }

  let handleAttendClick = (activity) => {
    let {userId, sessionToken} = props.user;
    gotoListViaOptIn('if the plan changes');
    props.requestSetAttending(userId, sessionToken, activity, !activity.isAttending);
  };

  let handleUnattendClick = (activity) => {
    let {userId, sessionToken} = props.user;
    props.requestSetAttending(userId, sessionToken, activity, !activity.isAttending)
  };

  let handleLoginToFacebook = (fbToken) => {
    props.login(fbToken).then(({userId, sessionToken}) => {
      return props.requestRefreshActivities(userId, sessionToken);
    }).then(() => {
      return props.gotoScreen(SCREEN.list);
    }).catch((e) => {
      setTimeout(() => { throw e }, 0);
    });
  }

  let { screen, optInReason, nextScreen, activityForEditing } = props.screens;
  let {userId, userName, sessionToken} = props.user;
  let activities = props.activities.activities;

  if (screen == SCREEN.uninitialized) {
    // TODO: Work out how to return nothing from a stateless component
    return <div/>;
  }

  // TODO: Move to a router solution
  if (screen == SCREEN.loggedOut) {
    return <Login onLoginToFacebook={handleLoginToFacebook} />;
  } else {
    let mainContents;
    if (screen == SCREEN.list) {
      if (activities.length === 0) {
        mainContents = (
          <ActivityCardListPlaceholder
            onCreateClick={() => props.gotoCreateScreen()}
          />
        )
      } else {
        mainContents = (
          <ActivityCardList
            activities ={activities}
            onAttendClick={handleAttendClick}
            onUnattendClick={handleUnattendClick}
            onEditClick={(activity) => props.gotoEditScreen(activity)}
          />
        );
      }
    } else if (screen == SCREEN.notificationsOptIn) {
      mainContents = (
        <OptIn
          reason={optInReason}
          nextState={nextScreen}
          onOptInComplete={() => props.gotoNextScreen()}
          user={props.user}
        />
      );
    } else if (screen == SCREEN.create || screen == SCREEN.edit) {
      mainContents = (
        <div>
          <If condition={screen == SCREEN.create}>
            <Hint text="What's one plan you have that you'd like to have some Facebook friends join you for?" />
          </If>
          <EditActivity
            activity={activityForEditing}
            userName={userName}
            onSaveClick={handleSaveClick}
            onCreateClick={handleCreateClick}
            onDeleteClick={handleDeleteClick}
          />
        </div>
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
      createButtonIfNeeded = <FabButton onClick={ () => props.gotoCreateScreen() } />;
    }
    return (
      <div>
        <InstallPromptDimmer />
        <div id='container'>
          { mainContents }
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

// Require react and UI components
'use strict';

var React = require('react');
var Login = require('./login.js');
var ActivityCardList = require('./activity-card-list.js');
var OptIn = require('./opt-in.js');
var EditActivity = require('./edit-activity.js');
var Header = require('./header.js');
var FabButton = require('./fab.js');

// Require core logic
var models = require('./models.js');
var swLibrary = require('./swsetup.js');
var m = require('./m.js');

var SCREEN = { create: 0, list: 1, edit: 2, loggedOut: 3, notificationsOptIn: 5 };

var App = React.createClass({
  displayName: 'App',

  getInitialState: function getInitialState() {
    return { screen: SCREEN.loggedOut };
  },
  shouldShowHeader: function shouldShowHeader() {
    return !([SCREEN.uninitialized, SCREEN.loggedOut].indexOf(this.state.screen) > -1);
  },
  shouldShowBackButton: function shouldShowBackButton() {
    return [SCREEN.create, SCREEN.edit].indexOf(this.state.screen) > -1;
  },
  shouldShowCreateButton: function shouldShowCreateButton() {
    return this.state.screen == SCREEN.list;
  },
  handleScreenChange: function handleScreenChange(newScreen, options, userTriggered) {
    if (options && options.nextScreen) {
      this.setState({ nextScreen: options.nextScreen, optInReason: options.reason });
    }
    console.log('Changing state to ' + newScreen);
    this.setState({ screen: newScreen });
  },
  handleActivitySelected: function handleActivitySelected(activity) {
    this.setState({ selectedActivity: activity });
  },
  // Activity is plumbed through here but not used
  handleActivityUnselected: function handleActivityUnselected(activity) {
    this.setState({ selectedActivity: undefined });
  },
  handleStartEditing: function handleStartEditing() {
    this.setState({ screen: SCREEN.edit });
  },
  handleStartCreating: function handleStartCreating() {
    // TODO: Tidy up how selection works to avoid issues like this
    // Unset a selected activity as otherwise EditActivity doesn't work in creation mode
    this.setState({ selectedActivity: undefined });
    this.setState({ screen: SCREEN.create });
  },
  // Syntactic sugar since we call this all the time
  handleViewList: function handleViewList() {
    this.handleScreenChange(SCREEN.list);
  },
  getScreenTitle: function getScreenTitle() {
    if (this.state.screen == SCREEN.list) {
      return 'Upcoming Plans';
    } else if (this.state.screen == SCREEN.edit) {
      return 'Edit';
    } else if (this.state.screen == SCREEN.create) {
      return 'Create';
    } else if (this.state.screen == SCREEN.notificationsOptIn) {
      return 'Stay up to date';
    } else {
      return 'Uh oh: title shouldn\'t be showing';
    }
  },
  handleOptInComplete: function handleOptInComplete() {
    this.setState({ screen: this.state.nextScreen });
  },
  handleActivitySaveComplete: function handleActivitySaveComplete() {
    // Don't ask the user to grant permission unless the browser supports it
    if (swLibrary.browserSupportsSWAndNotifications()) {
      swLibrary.hasPushNotificationPermission((function () {
        this.handleViewList();
      }).bind(this), (function () {
        this.handleScreenChange(SCREEN.notificationsOptIn, { nextScreen: SCREEN.list, userTriggered: true, reason: 'when a friend says they want to come along' }, false);
      }).bind(this));
    } else {
      this.handleViewList();
    }
  },
  handleActivityCreateComplete: function handleActivityCreateComplete() {
    // From a flow standpoint we do the same when creating as saving
    this.handleActivitySaveComplete();
  },
  handleAttendClicked: function handleAttendClicked(activity) {
    // Note we change screen without waiting for network to complete
    // Don't ask the user to grant permission unless the browser supports it
    if (swLibrary.browserSupportsSWAndNotifications()) {
      swLibrary.hasPushNotificationPermission((function () {
        this.handleViewList();
      }).bind(this), (function () {
        this.handleScreenChange(SCREEN.notificationsOptIn, { nextScreen: SCREEN.list, userTriggered: true, reason: 'if the plan changes' }, false);
      }).bind(this));
    } else {
      this.handleViewList();
    }
    // Note no callback since the list will automatically redraw when this changes
    var optimistic = activity.dirty == undefined;
    models.activities.trySetAttending(activity, !activity.is_attending, optimistic, function () {}, function () {
      console.log('Uhoh, an optimistic error was a mistake!!');
      alert('An unexpected error occurred. Please refresh.');
    });
  },
  render: function render() {
    // TODO: Refactor this mess!
    if (this.state.screen == SCREEN.loggedOut) {
      return React.createElement(Login, { onLoginComplete: this.handleViewList });
    } else {
      var mainContents;
      if (this.state.screen == SCREEN.list) {
        mainContents = React.createElement(ActivityCardList, {
          onActivitySelected: this.handleActivitySelected,
          onActivityUnselected: this.handleActivityUnselected,
          onAttendClicked: this.handleAttendClicked,
          onEditModeEnabled: this.handleStartEditing,
          selectedActivity: this.state.selectedActivity
        });
      } else if (this.state.screen == SCREEN.notificationsOptIn) {
        mainContents = React.createElement(OptIn, {
          reason: this.state.optInReason,
          nextState: this.state.nextScreen,
          onOptInComplete: this.handleOptInComplete
        });
      } else if ([SCREEN.create, SCREEN.edit].indexOf(this.state.screen) > -1) {
        mainContents = React.createElement(EditActivity, {
          activity: this.state.selectedActivity,
          userName: models.user.getUserName(),
          onSaveComplete: this.handleActivitySaveComplete,
          onCreateComplete: this.handleActivityCreateComplete,
          onDeleteComplete: this.props.onReturnToList
        });
      }
      var headerIfNeeded = null;
      if (this.shouldShowHeader()) {
        headerIfNeeded = React.createElement(Header, {
          title: this.getScreenTitle(),
          shouldShowBackButton: this.shouldShowBackButton(),
          onBackButtonClicked: this.handleViewList
        });
      }
      var createButtonIfNeeded = null;
      if (this.shouldShowCreateButton()) {
        createButtonIfNeeded = React.createElement(FabButton, { onClick: this.handleStartCreating });
      }
      return React.createElement(
        'div',
        null,
        React.createElement(
          'div',
          { id: 'container' },
          mainContents,
          React.createElement('div', { style: { height: '100px' } })
        ),
        headerIfNeeded,
        createButtonIfNeeded
      );
    }
  }
});

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

var redrawCurrentView = function redrawCurrentView() {
  React.render(React.createElement(App, null), document.getElementById('appShell'));
};

models.activities.addListener(redrawCurrentView);
redrawCurrentView();
/* Note these must be below the container to capture the clicks */

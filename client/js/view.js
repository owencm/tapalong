// Require react and UI components
var React = require('react');
var ReactDOM = require('react-dom');
var Login = require('./login.js');
var ActivityCardList = require('./activity-card-list.js');
var EditActivity = require('./edit-activity-card.js');
var OptIn = require('./opt-in.js');
var Header = require('./header.js');
var FabButton = require('./fab.js');

// Require core logic
var objectDB = require('./objectdb.js');
var models = require('./models.js');
var swLibrary = require('./swsetup.js')
var m = require('./m.js');

var SCREEN = {create: 0, list: 1, edit: 2, loggedOut: 3, uninitialized: 4, notificationsOptIn: 5};

var db = objectDB.open('db-1');
var dbAfterGet = db.get();

var App = React.createClass({

  getInitialState: function () {
    return {
      screen: SCREEN.uninitialized,
    }
  },

  // TODO: Work out where a login flow like this should actually go
  // TODO: Handle the case where the session token expires
  componentDidMount: function () {
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
        models.activities.tryRefreshActivities(this.handleViewList, () => {
          console.log('Failed to download activities');
        });
      } else {
        this.setState({screen: SCREEN.loggedOut});
      }
    });
  },

  render: function() {
    if (this.state.screen == SCREEN.uninitialized) {
      return null;
    }
    var activities = models.activities.getActivities();
    // TODO: Refactor this mess!
    if (this.state.screen == SCREEN.loggedOut) {
      return <Login onLoginComplete={this.handleViewList} />;
    } else {
      var mainContents;
      if (this.state.screen == SCREEN.list) {
        mainContents = (
          <ActivityCardList
            activities ={activities}
            onAttendClick={this.handleAttend}
            onUnattendClick={this.handleUnattend}
            onEditClick={this.handleStartEditing}
          />
        );
      } else if (this.state.screen == SCREEN.notificationsOptIn) {
        mainContents = (
          <OptIn
            reason={this.state.optInReason}
            nextState={this.state.nextScreen}
            onOptInComplete={this.handleOptInComplete}
          />
        );
      } else if ([SCREEN.create, SCREEN.edit].indexOf(this.state.screen) > -1) {
        mainContents = (
          <EditActivity
            activity={this.state.activityForEditing}
            userName={models.user.getUserName()}
            onSaveComplete={this.handleActivitySaveComplete}
            onCreateComplete={this.handleActivityCreateComplete}
            onDeleteComplete={this.handleViewList}
          />
        );
      }
      var headerIfNeeded = null;
      if (this.shouldShowHeader()) {
        headerIfNeeded = (
          <Header
            title={this.getScreenTitle()}
            shouldShowBackButton={this.shouldShowBackButton()}
            onBackButtonClick={this.handleViewList}
          />
        );
      }
      var createButtonIfNeeded = null;
      if (this.shouldShowCreateButton()) {
        createButtonIfNeeded = <FabButton onClick={this.handleStartCreating} />;
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
  },

  shouldShowHeader: function () {
    return !([SCREEN.uninitialized, SCREEN.loggedOut].indexOf(this.state.screen) > -1);
  },

  shouldShowBackButton: function () {
    return ([SCREEN.create, SCREEN.edit].indexOf(this.state.screen) > -1);
  },

  shouldShowCreateButton: function () {
    return (this.state.screen == SCREEN.list);
  },

  handleScreenChange: function (newScreen, options, userTriggered) {
    if (options && options.nextScreen) {
      this.setState({nextScreen: options.nextScreen, optInReason: options.reason});
    }
    this.setState({screen: newScreen});
  },

  handleStartEditing: function (activity) {
    this.setState({screen: SCREEN.edit, activityForEditing: activity});
  },

  handleStartCreating: function () {
    // Create mode and edit are the same, so make sure we aren't still referring
    // to another activity for editing
    this.setState({screen: SCREEN.create, activityForEditing: undefined});
  },

  // Syntactic sugar since we call this all the time
  handleViewList: function () {
    this.handleScreenChange(SCREEN.list);
  },

  getScreenTitle: function() {
    if (this.state.screen == SCREEN.list) {
      return 'Upcoming Plans';
    } else if (this.state.screen == SCREEN.edit) {
      return 'Edit';
    } else if (this.state.screen == SCREEN.create) {
      return 'Create'
    } else if (this.state.screen == SCREEN.notificationsOptIn) {
      return 'Stay up to date'
    } else {
      return 'Uh oh: title shouldn\'t be showing';
    }
  },

  handleOptInComplete: function () {
    this.setState({screen: this.state.nextScreen});
  },

  handleActivitySaveComplete: function () {
    // Don't ask the user to grant permission unless the browser supports it
    if (swLibrary.browserSupportsSWAndNotifications()) {
      swLibrary.hasPushNotificationPermission(() => {
        this.handleViewList();
      }, () => {
        this.handleScreenChange(SCREEN.notificationsOptIn, {nextScreen: SCREEN.list, userTriggered: true, reason: 'when a friend says they want to come along'}, false);
      });
    } else {
      this.handleViewList();
    }
  },

  handleActivityCreateComplete: function () {
    // From a flow standpoint we do the same when creating as saving
    this.handleActivitySaveComplete();
  },

  handleAttend: function (activity) {
    // Note we change screen without waiting for network to complete
    // Don't ask the user to grant permission unless the browser supports it
    if (swLibrary.browserSupportsSWAndNotifications()) {
      swLibrary.hasPushNotificationPermission(() => {
        this.handleViewList();
      }, () => {
        this.handleScreenChange(SCREEN.notificationsOptIn, {nextScreen: SCREEN.list, userTriggered: true, reason: 'if the plan changes'}, false);
      });
    } else {
      this.handleViewList();
    }
    // Note no callback since the list will automatically redraw when this changes
    var optimistic = activity.dirty == undefined;
    models.activities.trySetAttending(activity, !activity.is_attending, optimistic, () => {}, () => {
      console.log('Uhoh, an optimistic error was a mistake!!');
      alert('An unexpected error occurred. Please refresh.');
    });
  },

  handleUnattend: function (activity) {
    // Note no callback since the list will automatically redraw when this changes
    var optimistic = activity.dirty == undefined;
    models.activities.trySetAttending(activity, !activity.is_attending, optimistic, () => {}, () => {
      console.log('Uhoh, an optimistic error was a mistake!!');
      alert('An unexpected error occurred. Please refresh.');
    });
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

var redrawCurrentView = function () {
  ReactDOM.render(
    <App />,
    document.getElementById('appShell')
  );
};

models.activities.addListener(redrawCurrentView);
redrawCurrentView();

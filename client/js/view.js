// Require react and UI components
var React = require('react');
var Login = require('./login.js');
var ActivityCardList = require('./activity-card-list.js');
var OptIn = require('./opt-in.js');
var EditActivity = require('./edit-activity.js');
var Header = require('./header.js');
var FabButton = require('./fab.js');

// Require core logic
var models = require('./models.js');
var swLibrary = require('./swsetup.js')
var m = require('./m.js');

var SCREEN = {create: 0, list: 1, edit: 2, loggedOut: 3, notificationsOptIn: 5};

var App = React.createClass({
  getInitialState: function() {
    return { screen: SCREEN.loggedOut }
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
    console.log('Changing state to '+newScreen);
    this.setState({screen: newScreen});
  },
  handleActivitySelected: function (activity) {
    this.setState({selectedActivity: activity});
  },
  // Activity is plumbed through here but not used
  handleActivityUnselected: function (activity) {
    this.setState({selectedActivity: undefined});
  },
  handleStartEditing: function () {
    this.setState({screen: SCREEN.edit});
  },
  handleStartCreating: function () {
    // TODO: Tidy up how selection works to avoid issues like this
    // Unset a selected activity as otherwise EditActivity doesn't work in creation mode
    this.setState({selectedActivity: undefined});
    this.setState({screen: SCREEN.create});
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
  handleAttendClicked: function (activity) {
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
  render: function() {
    // TODO: Refactor this mess!
    if (this.state.screen == SCREEN.loggedOut) {
      return <Login onLoginComplete={this.handleViewList} />;
    } else {
      var mainContents;
      if (this.state.screen == SCREEN.list) {
        mainContents = (
          <ActivityCardList
            onActivitySelected={this.handleActivitySelected}
            onActivityUnselected={this.handleActivityUnselected}
            onAttendClicked={this.handleAttendClicked}
            onEditModeEnabled={this.handleStartEditing}
            selectedActivity={this.state.selectedActivity}
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
            activity={this.state.selectedActivity}
            userName={models.user.getUserName()}
            onSaveComplete={this.handleActivitySaveComplete}
            onCreateComplete={this.handleActivityCreateComplete}
            onDeleteComplete={this.props.onReturnToList}
          />
        );
      }
      var headerIfNeeded = null;
      if (this.shouldShowHeader()) {
        headerIfNeeded = (
          <Header
            title={this.getScreenTitle()}
            shouldShowBackButton={this.shouldShowBackButton()}
            onBackButtonClicked={this.handleViewList}
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
  React.render(
    <App />,
    document.getElementById('appShell')
  );
};

models.activities.addListener(redrawCurrentView);
redrawCurrentView();

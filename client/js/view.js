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
  handleStateChange: function (newScreen, options, userTriggered) {
    // TODO: do something with options and userTriggered
    console.log('Changing state to '+newScreen);
    this.setState({screen: newScreen});
    if (newScreen !== SCREEN.edit) {
      this.setState({selectedActivity: undefined});
    }
    // TODO: Read nextScreen from options
  },
  handleActivitySelected: function (activity) {
    this.setState({selectedActivity: activity});
  },
  // Activity is plumbed through here but not used
  handleActivityUnselected: function (activity) {
    this.setState({selectedActivity: undefined});
  },
  handleEditModeEnabled: function () {
    this.setState({screen: SCREEN.edit});
  },
  handleCreateModeEnabled: function () {
    this.setState({screen: SCREEN.create});
  },
  // Syntactic sugar since we call this all the time
  viewList: function () {
    this.handleStateChange(SCREEN.list);
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
  render: function() {
    // TODO: Refactor this mess!
    if (this.state.screen == SCREEN.loggedOut) {
      return <Login onLoginComplete={this.viewList} />;
    } else {
      var mainContents;
      if (this.state.screen == SCREEN.list) {
        mainContents = (
          <ActivityCardList
            onActivitySelected={this.handleActivitySelected}
            onActivityUnselected={this.handleActivityUnselected}
            onEditModeEnabled={this.handleEditModeEnabled}
            selectedActivity={this.state.selectedActivity}
          />
        );
      } else if (this.state.screen == SCREEN.notificationsOptIn) {
        mainContents = <OptIn reason={reason} nextState={this.state.nextScreen} />;
      } else if ([SCREEN.create, SCREEN.edit].indexOf(this.state.screen) > -1) {
        mainContents = (
          <EditActivity
            activity={this.state.selectedActivity}
            userName={models.user.getUserName()}
            onReturnToList={this.viewList}
          />
        );
      }
      var headerIfNeeded = null;
      if (this.shouldShowHeader()) {
        headerIfNeeded = (
          <Header
            title={this.getScreenTitle()}
            shouldShowBackButton={this.shouldShowBackButton()}
            onBackButtonClicked={this.viewList}
          />
        );
      }
      var createButtonIfNeeded = null;
      if (this.shouldShowCreateButton()) {
        createButtonIfNeeded = <FabButton onClick={this.handleCreateModeEnabled} />;
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

var permissionOverlay = document.querySelector('div#permissionOverlay');

var showOverlay = function  () {
  permissionOverlay.style.display = '';
  permissionOverlay.offsetTop;
  permissionOverlay.style.opacity = 1;
};
var hideOverlay = function () {
  permissionOverlay.style.display = 'none';
  permissionOverlay.offsetTop;
  permissionOverlay.style.opacity = 0;
};
var redrawCurrentView = function () {
  React.render(
    <App />,
    document.getElementById('appShell')
  );
};
var setLoginButtonCallback = function (callback) {
  var loginElem = document.querySelector('#login');
  loginElem.onclick = callback;
};
var fbLoginSuccess = function (fbToken) {
  models.startLogin(fbToken, appLoginSuccess, function () {
    throw('login to app failed');
  });
};

models.activities.addListener(redrawCurrentView);
redrawCurrentView();

module.exports = {
  setLoginButtonCallback: setLoginButtonCallback,
  fbLoginSuccess: fbLoginSuccess,
  // debugSkipLogin: appLoginSuccess
};

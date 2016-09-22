  import React, { Component } from 'react'
import ListScene from './list-scene.js'
import EditScene from './edit-scene.js'
import LoginScene from './login-scene.js'
import NavigationHeaderCustomBackButton from './navigation-header-custom-back-button.js'
import {
  NavigationExperimental,
  StatusBar,
  View,
  Text,
} from 'react-native'

// Temporary hacks to remember auth until I implement redux-persist
import { AsyncStorage } from 'react-native'

// Debug code for logging out the user
const clearUser = false
if (clearUser) { AsyncStorage.removeItem('user') }

const getUser = () => {
  return AsyncStorage.getItem('user')
    .then((user) => { return JSON.parse(user) || {} })
}

let init = false

// Destructure from NavigationExperimental so NavigationCardStack and
//  NavigationHeader are now defined
const {
  CardStack: NavigationCardStack,
  Header: NavigationHeader
} = NavigationExperimental

const NavRoot = (props) => {

  // HACKS to restore the current user
  if (!init) {
    init = true
    getUser().then((user) => {
      if (!user.sessionToken) {
        // User is not logged in
        gotoLoginScene()
      } else {
        // User is logged in
        console.log('Restored a user from storage so setting them', user)
        gotoListScene()
        props.setUser(user.userId, user.userName, user.sessionToken, user.thumbnail)
        props.requestRefreshActivities(user.userId, user.sessionToken)
      }
    })
  }

  const handleNavigate = (action) => {
    console.log('navigating', action)
    switch (action && action.type) {
      case 'push':
        props.pushRoute(action.route)
        return true
      case 'back':
        break
      case 'pop':
        if (props.nav.index === 0) {
          return false
        }
        props.popRoute()
        return true
      case 'replace':
        props.replaceRoute(action.route)
      default:
        return false
    }
  }

  const popScene = () => {
    handleNavigate({
      type: 'pop'
    })
  }

  // TODO: Maybe find a way to integrate scene transitions into Redux more

  const gotoEditActivityScene = (activity) => {
    handleNavigate({
      type: 'push',
      route: {
        key: 'edit',
        title: 'Edit',
        activity
      }
    })
  }

  const gotoCreateActivityScene = (activity) => {
    handleNavigate({
      type: 'push',
      route: {
        key: 'create',
        title: 'Create',
        activity
      }
    })
  }

  const gotoListScene = () => {
    handleNavigate({
      type: 'replace',
      route: {
        key: 'list',
        title: 'Upcoming Plans'
      }
    })
  }

  const gotoLoginScene = () => {
    handleNavigate({
      type: 'replace',
      route: {
        key: 'login',
        title: 'ERROR'
      }
    })
  }

  const handleSaveActivity = (activity, activityChanges) => {
    return props.requestUpdateActivity(props.user.userId, props.user.sessionToken,
            activity, activityChanges).then(() => {
      // gotoListViaOptIn('when a user says they\'re coming along');
      popScene()
    });
  };

  const handleCreateActivity = (activity) => {
    return props.requestCreateActivity(props.user.userId, props.user.sessionToken,
            activity).then(() => {
      popScene()
      // gotoListViaOptIn('when a user says they\'re coming along');
    })
  }

  const handleDeleteActivity = (activity) => {
    return props.requestDeleteActivity(props.user.userId, props.user.sessionToken,
            activity).then(() => {
      popScene()
    })
  }

  const handleAttendActivity = (activity) => {
    const { userId, sessionToken } = props.user;
    // gotoListViaOptIn('if the plan changes');
    return props.requestSetAttending(userId, sessionToken, activity, !activity.isAttending);
  }

  const handleUnattendActivity = (activity) => {
    const { userId, sessionToken } = props.user;
    // if (confirm('Are you sure?')) {
      return props.requestSetAttending(userId, sessionToken, activity, !activity.isAttending)
    // }
  }

  const handleExpandActivity = props.expandActivity

  const handleUnexpandActivity = props.unexpandActivity

  const handleFacebookLoginDismissed = (fbToken) => {
    gotoListScene()
  }

  const handleFacebookLoginComplete = (fbToken) => {
    props.login(fbToken)
  }

  const renderScene = ({ scene }) => {
    // props.nav.index reflects the currently active route, but in cases where
    //   scenes are transitioning this function may still be supposed to render
    //   the previous scene, hence we use the argument instead
    const route = scene.route
    switch (route.key) {
      case 'list':
        return <ListScene
          user={ props.user }
          activities={ props.activities }
          requestRefreshActivities={ props.requestRefreshActivities }
          gotoEditActivityScene={ gotoEditActivityScene }
          gotoCreateActivityScene={ gotoCreateActivityScene }
          onAttendActivity={ handleAttendActivity }
          onUnattendActivity={ handleUnattendActivity }
          onExpandActivity={ handleExpandActivity }
          onUnexpandActivity={ handleUnexpandActivity }
          shouldShowButterBar={ props.butterBar.shouldShowButterBar }
          style={{ flex: 1 }}
        />
        break
      case 'create':
        return <EditScene
          userName={ props.user.userName }
          onCreateClick={ handleCreateActivity }
          creating={ true }
        />
        break
      case 'edit':
        return <EditScene
          activity={ route.activity }
          userName={ props.user.userName }
          onSaveClick={ handleSaveActivity }
          onDeleteClick={ handleDeleteActivity }
        />
        break
      case 'uninitialized':
        return null
      case 'login':
        return <LoginScene
          onLoginDismissed={ handleFacebookLoginDismissed }
          onLoginComplete={ handleFacebookLoginComplete }
        />
        break
      case 'notifpermission':
        return <NotifPermissionScene />
        break
    }
  }

  const renderHeader = props => {
    // TODO: This isn't actually the header rendered by
    //  navigation header... Find a way to prevent it from being rendered
    //  correctly
    // We don't want a header on the login screen
    if (props.scene.route.key === 'login') {
      console.log('no header')
      return null
    }
    return <NavigationHeader
      { ...props }
      onNavigateBack={ popScene }
      style={{ backgroundColor: '#00BCD4' }}
      renderTitleComponent={ (props) => {
        const title = String(props.scene.route.title || '');
        return <NavigationHeader.Title textStyle={{ color: 'white' }}>{title}</NavigationHeader.Title>;
      }}
      renderLeftComponent={ (props) => {
        if (props.scene.index === 0 || !props.onNavigateBack) {
          return null;
        }
        return (
          <NavigationHeaderCustomBackButton
            onPress={props.onNavigateBack}
          />
        );
      } }
    />
  }

  return (
    <View style={{ flex: 1 }} >
      <StatusBar barStyle='light-content'/>
      <NavigationCardStack
        navigationState={ props.nav }
        onNavigate={ handleNavigate }
        renderScene={ renderScene }
        renderHeader={ renderHeader }
      >
      </NavigationCardStack>
    </View>
  )
}

export default NavRoot




// import React from 'react';
// import m from '../m.js';
// import {
//   AppRegistry,
//   StyleSheet,
//   Text,
//   View,
//   ScrollView,
//   Navigator,
//   TouchableHighlight,
// } from 'react-native';
// import Login from './login.js';
// import ActivityCardList from './activity-card-list.js';
// import ActivityCardListPlaceholder from './activity-card-list-placeholder.js';
// import EditActivity from './edit-activity-card.js';
// import OptIn from './opt-in.js';
// import Header from './header.js';
// import FabButton from './fab.js';
// import If from './if.js';
// import Hint from './hint.js';
// import InstallPromptDimmer from './install-prompt-dimmer.js';
//
// // // Require core logic
// // import swLibrary from '../swsetup.js'
// // // Initialize the SW installation and push subscriptions
// // swLibrary.init();
//
// const App = (props) => {
//
//   console.log(props.nav)
//
//   /* Stateless helpers */
//
//   let shouldShowHeader = (screen) => {
//     return !([SCREEN.uninitialized, SCREEN.loggedOut].indexOf(screen) > -1);
//   };
//
//   let shouldShowBackButton = (screen) => {
//     return ([SCREEN.create, SCREEN.edit].indexOf(screen) > -1);
//   };
//
//   let shouldShowCreateButton = (screen) => {
//     return (screen == SCREEN.list);
//   };
//
//   let getScreenTitle = (screen) => {
//     if (screen == SCREEN.list) {
//       return 'Upcoming Plans';
//     } else if (screen == SCREEN.edit) {
//       return 'Edit';
//     } else if (screen == SCREEN.create) {
//       return 'Create'
//     } else if (screen == SCREEN.notificationsOptIn) {
//       return 'Stay up to date'
//     } else {
//       return 'Uh oh: title shouldn\'t be showing';
//     }
//   };
//
//   /* Stateful action wrapper */
//
//   let gotoListViaOptIn = (reason) => {
//
//     console.log('not supported')
//     // window.swLibrary = swLibrary;
//     // // Don't ask the user to grant permission unless the browser supports it
//     // if (swLibrary.browserSupportsSWAndNotifications()) {
//     //   swLibrary.hasPushNotificationPermission(() => {
//     //     props.gotoScreen(SCREEN.list);
//     //   }, () => {
//     //     props.queueNextScreen(SCREEN.list, reason);
//     //     props.gotoScreen(SCREEN.notificationsOptIn);
//     //   });
//     // } else {
//     //   props.gotoScreen(SCREEN.list);
//     // }
//   }
//
//   let handleLoginToFacebook = (fbToken) => {
//     props.login(fbToken).then(({userId, sessionToken}) => {
//       return props.requestRefreshActivities(userId, sessionToken);
//     }).then(() => {
//       return props.gotoScreen(SCREEN.list);
//     }).catch((e) => {
//       setTimeout(() => { throw e }, 0);
//     });
//   }
//
//   let { screen, optInReason, nextScreen, activityForEditing } = props.screens;
//   let {userId, userName, sessionToken} = props.user;
//   let activities = props.activities;
//
//   if (screen == SCREEN.uninitialized) {
//     // TODO: Work out how to return nothing from a stateless component
//     return <Text>Yo</Text>;
//   }
//
//   // TODO: Move to a router solution
//   if (screen == SCREEN.loggedOut) {
//     return <Login onLoginToFacebook={handleLoginToFacebook} />;
//   } else {
//     let mainContents;

//     } else if (screen == SCREEN.notificationsOptIn) {
//       mainContents = (
//         <OptIn
//           reason={optInReason}
//           nextState={nextScreen}
//           onOptInComplete={() => props.gotoNextScreen()}
//           user={props.user}
//         />
//       );
//     } else if (screen == SCREEN.create || screen == SCREEN.edit) {
//       mainContents = (

//       );
//     }
//     let headerIfNeeded = null;
//     if (shouldShowHeader(screen)) {
//       headerIfNeeded = (
//         <Header
//           title={getScreenTitle(screen)}
//           shouldShowBackButton={shouldShowBackButton(screen)}
//           onBackButtonClick={() => { props.gotoScreen(SCREEN.list) } }
//         />
//       );
//     }
//     let createButtonIfNeeded = null;
//     if (shouldShowCreateButton(screen)) {
//       createButtonIfNeeded = <FabButton onClick={ () => props.gotoCreateScreen() } />;
//     }
//     return (
//       <View>
//         {/* <InstallPromptDimmer /> */}
//         { mainContents }
//         <View style={{ height: 100 }}></View>
//         { /* Note these must be below the container to capture the clicks */ }
//         { createButtonIfNeeded }
//       </View>
//     )
//   }
// }
//
// export default App

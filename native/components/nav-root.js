import React, { Component } from 'react'
import ListScene from './list-scene.js'
import EditScene from './edit-scene.js'

import { NavigationExperimental } from 'react-native'

const {
  CardStack: NavigationCardStack
} = NavigationExperimental

const NavRoot = (props) => {

  console.log(props)

  const handleNavigate = (action) => {
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
      default:
        return false
    }
  }

  const gotoEditActivityScene = (activity) => {
    // props.onActivitySelected(activity);
    handleNavigate({
      type: 'push',
      route: {
        key: 'edit',
        title: 'Edit',
      }
    })
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
        />
        break
      case 'create':
        return <CreateScene />
        break
      case 'edit':
        return <EditScene />
        break
      case 'login':
        return <LoginScene />
        break
      case 'notifpermission':
        return <NotifPermissionScene />
        break
    }
  }

  return (
    <NavigationCardStack
      navigationState={ props.nav }
      onNavigate={ handleNavigate }
      renderScene={ renderScene } />
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
//   let handleSaveClick = (activity, activityChanges) => {
//     props.requestUpdateActivity(props.user.userId, props.user.sessionToken,
//             activity, activityChanges).then(() => {
//       gotoListViaOptIn('when a user says they\'re coming along');
//     });
//   };
//
//   let handleCreateClick = (activity) => {
//     props.requestCreateActivity(props.user.userId, props.user.sessionToken,
//             activity).then(() => {
//       gotoListViaOptIn('when a user says they\'re coming along');
//     });
//   };
//
//   let handleDeleteClick = (activity) => {
//     props.requestDeleteActivity(props.user.userId, props.user.sessionToken,
//             activity).then(() => {
//       props.gotoScreen(SCREEN.list);
//     });
//   }
//
//   let handleAttendClick = (activity) => {
//     let {userId, sessionToken} = props.user;
//     gotoListViaOptIn('if the plan changes');
//     props.requestSetAttending(userId, sessionToken, activity, !activity.isAttending);
//   };
//
//   let handleUnattendClick = (activity) => {
//     let {userId, sessionToken} = props.user;
//     if (confirm('Are you sure?')) {
//       props.requestSetAttending(userId, sessionToken, activity, !activity.isAttending)
//     }
//   };
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
//     if (screen == SCREEN.list) {
//       if (activities.length === 0) {
//         mainContents = <Text>Hai</Text>
//         // mainContents = (
//         //   <ActivityCardListPlaceholder
//         //     onCreateClick={() => props.gotoCreateScreen()}
//         //   />
//         // )
//       } else {
//         mainContents = (
//           <ActivityCardList
//             activities ={activities}
//             onAttendClick={handleAttendClick}
//             onUnattendClick={handleUnattendClick}
//             onEditClick={(activity) => props.gotoEditScreen(activity)}
//           />
//         );
//       }
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
//         <div>
//           <If condition={screen == SCREEN.create}>
//             <Hint text="Let friends using the app know what you have planned so they can tag along." />
//           </If>
//           <EditActivity
//             activity={activityForEditing}
//             userName={userName}
//             onSaveClick={handleSaveClick}
//             onCreateClick={handleCreateClick}
//             onDeleteClick={handleDeleteClick}
//           />
//           <If condition={screen == SCREEN.create}>
//             <Hint
//               text="Up Dog will never post to Facebook on your behalf."
//               style={{ fontSize: '0.85em', padding: '12px', opacity: '0.7' }}
//             />
//           </If>
//         </div>
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

import React, { Component } from 'react'
import EditScreenContainer from './edit-screen-container.js'
import LoginScreenContainer from './login-screen-container.js'
import ListScreenContainer from './list-screen-container.js'
import { StackNavigator } from 'react-navigation';

// const CreateScreenContainer = (props) => {
//   return <EditScreen
//     userName={ props.user.userName }
//     onCreateClick={ handleCreatePlan }
//     plan={ route.plan }
//     creating={ true }
//   />
// }

// A container should exist for each screen, and provides state and actions from the redux store to the presentational component

const RootNavigator = StackNavigator({
  Login: {
    screen: LoginScreenContainer,
    navigationOptions: {
      header: null
    }
  },
  List: {
    screen: ListScreenContainer,
    navigationOptions: {
      title: `Upcoming Plans`,
      headerLeft: null,
      headerTitleStyle: {
        // color: 'white',
      },
      headerStyle: {
        // backgroundColor: '#3CE',
      },
    }
  },
  Edit: {
    screen: EditScreenContainer,
    navigationOptions: ({ navigation }) => {
      return {
        title: navigation.state.params && navigation.state.params.plan !== undefined ? 'Edit' : 'New plan',
        headerTintColor: '#00BCD4',
        headerTitleStyle: {
          color: 'black'
        }
      }
    }
  },
  // NotifPermission: {
  //   screen: NotifPermissionScreenContainer
  // },
});

export default class NavContainer extends React.Component {
  render() {
    return <RootNavigator />
  }
}

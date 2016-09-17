import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Navigator,
  TouchableHighlight,
} from 'react-native';

export default class App extends Component {
  render() {

    const LeftButton = (route, navigator, index, navState) => {
      if (route.index === 0) {
        return null;
      } else {
        return (
          <TouchableHighlight onPress={() => navigator.pop()}>
            <Text>Back</Text>
          </TouchableHighlight>
        );
      }
    }

    const Title = (route, navigator, index, navState) => {
      return <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
        <Text style={styles.navBarText}>{ route.title }</Text>
      </View>
    }

    const toRow = ({ creatorName, title }) => {
      return <View style={
        {
          flex: 1,
          borderBottomWidth: 1,
          borderBottomColor: '#EEE',
          padding: 20,
          backgroundColor: 'white' }
        }
        key={Math.random()}>
          <Text>{`${ creatorName } is ${ title }`}</Text>
          <View style={{ flex: 1, alignItems: 'flex-end', marginTop: 16}}>
            <TouchableHighlight onPress={() => {}} underlayColor='#EEE'>
              <Text style={{ color: '#00BCD4', fontWeight: '500' }}>
                INTERESTED
              </Text>
            </TouchableHighlight>
          </View>
      </View>
    }

    return (
      <Navigator
        initialRoute={{ title: 'Upcoming Plans', index: 0 }}
        renderScene={(route, navigator) => {
          return <View style={{ flex: 1 }}>
            <ScrollView style={styles.container}>
              {this.props.activities.map(toRow)}
            </ScrollView>
            <View style={{ alignItems: 'center', padding: 16, borderTopWidth: 1, borderTopColor: '#EEE' }}>
              <Text style={{ color: '#00BCD4', fontWeight: 'bold' }}>CREATE PLAN</Text>
            </View>
          </View>
        }}
        navigationBar={
          <Navigator.NavigationBar
            routeMapper={{
              LeftButton: LeftButton,
              RightButton: () => {},
              Title: Title,
            }}
            style={ styles.navBar }
          />
        }
      />
    );
  }
  // componentDidMount() {
  //   const headers = new Headers({
  //     'Session-Token': 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjEsImlhdCI6MTQ3Mzk5Mzg5NCwiZXhwIjoxNDgxNzY5ODk0fQ.innhI4FFRJBcaV_dPP7RBfB0GWCXxE82yy7L23hEw2A',
  //     'User-Id': '1'
  //   })
  //   fetch('http://localhost:8080/api/v1/plans/visible_to_user/', { headers })
  //     .then((response) => response.json())
  //     .then((plans) => {
  //       console.log(plans);
  //     })
  //     .catch((e) => {
  //       console.log(e);
  //     });
  // }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5FCFF',
    paddingTop: Navigator.NavigationBar.Styles.General.TotalNavHeight,
  },
  navBar: {
    backgroundColor: '#00BCD4',
  },
  navBarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
});

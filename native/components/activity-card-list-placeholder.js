import React from 'react';
import m from '../m.js';
import RaisedButton from './raised-button.js';
import Card from './card.js';
import {
  View,
  Text,
} from 'react-native'

const styles = {
  container: {
    marginTop: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    maxWidth: 300,
  },
  text: {
    color: '#555',
    textAlign: 'center',
  }
}

const ActivityCardListPlaceholder = (props) => {

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.text}>When your friends share their plans in the app, you'll see them here.</Text>
        <RaisedButton
          label='Add Plan'
          onClick={ props.onCreateClick }
        />
      </View>
    </View>
  );
}

export default ActivityCardListPlaceholder

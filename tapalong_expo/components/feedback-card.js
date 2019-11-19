import React from 'react'
import m from '../m.js'
import {
  View,
  Text,
  Share
} from 'react-native'
import Card from './card.js'
import CardOptions from './card-options.js'
import CardMainContents from './card-main-contents.js'
import If from './if.js'
import * as SMS from 'expo-sms';

// TODO: Refactor these to elsewhere
const styles = {
  text: {
    color: 'black',
    fontSize: 16,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: '600'
  },
}

export default (props) => {

  const handleFeedbackViaMessages = () => {
    SMS.sendSMSAsync('+16507131658', '')
  }

  const options = [
    {
      label: 'Write feedback',
      type: 'primary',
      onClick: handleFeedbackViaMessages
    }
  ]

  return (
    <Card>
      <CardMainContents style={{ flexDirection: 'row' }}>
        <View style={{flex: 1, flexDirection: 'column'}}>
          <Text style={styles.text}>
            <Text>Got a question, idea or suggestion? </Text>
            <Text style={styles.boldText}>
              Share feedback with the developers!
            </Text>
          </Text>
        </View>
      </CardMainContents>
      <CardOptions
        options={options}
      />
    </Card>
  );

};

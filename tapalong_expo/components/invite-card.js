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

  const handleInviteViaMessages = () => {
    SMS.sendSMSAsync([], 'I\'m using this app to share plans I have so people can let me know if they want to come along! You should try it! https://www.google.com')
  }

  const handleShareClick = () => {
    Share.share({
      message: 'I\'m using this app to share plans I have so people can let me know if they want to come along! You should try it! https://www.google.com',
    });
  }

  const options = [
    {
      label: 'Share',
      type: 'primary',
      onClick: handleShareClick
    },
    {
      label: 'Invite via Messages',
      type: 'primary',
      onClick: handleInviteViaMessages
    }
  ]

  return (
    <Card>
      <CardMainContents style={{ flexDirection: 'row' }}>
        <View style={{flex: 1, flexDirection: 'column'}}>
          <Text style={styles.text}>
            <Text style={styles.boldText}>
              Invite
            </Text>
            <Text> your friends to get With Plans!</Text>
          </Text>
        </View>
      </CardMainContents>
      <CardOptions
        options={options}
      />
    </Card>
  );

};

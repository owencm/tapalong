import React from 'react';
import m from '../m.js';
import Card from './card.js';
import FriendIcon from './friend-icon.js';

let ActivityCardPlaceholder = (props) => {
console.log('sup')
  return (
    <Card>
      <View style={{padding: 24}}>
        <FriendIcon/>
        <Text>Person is doing something</Text>
      </View>
      { /* options */ }
    </Card>
  );

};

module.exports = ActivityCardPlaceholder;

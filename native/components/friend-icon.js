import React from 'react';
import m from '../m.js';
import { View } from 'react-native'
import ImgFadeInOnLoad from './img-fade-in-on-load.js';
import If from './if.js';

let FriendIcon = (props) => {

  let friendIconStyle = {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 19,
    width: 38,
    height: 38,
    marginRight: 18,
    overflow: 'hidden',
    backgroundColor: '#EEE'
  };
  return (
    <View style={friendIconStyle}>
      <If condition={props.thumbnail}>
        <ImgFadeInOnLoad
          src={props.thumbnail}
          backgroundColor='DDD'
          width={38}
          height={38}
          circular
          />
      </If>
    </View>
  )

};

module.exports = FriendIcon;

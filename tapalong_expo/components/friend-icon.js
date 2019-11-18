import React from 'react';
import m from '../m.js';
import { View } from 'react-native'
import ImgFadeInOnLoad from './img-fade-in-on-load.js';
import If from './if.js';

let FriendIcon = (props) => {

  const size = props.size || 38

  const friendIconStyle = {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: size/2,
    width: size,
    height: size,
    marginRight: 18,
    overflow: 'hidden',
    backgroundColor: '#EEE'
  }

  return (
    <View style={ m(friendIconStyle, props.style) }>
      <If condition={ props.thumbnail }>
        <ImgFadeInOnLoad
          src={ props.thumbnail }
          backgroundColor='DDD'
          width={size}
          height={size}
          circular
          />
      </If>
    </View>
  )

};

module.exports = FriendIcon;

import React from 'react';
import m from '../m.js';
import ImgFadeInOnLoad from './img-fade-in-on-load.js';

let FriendIcon = (props) => {

  let friendIconStyle = {
    border: '1px solid #ccc',
    borderRadius: '19px',
    width: '38px',
    height: '38px',
    marginRight: '24px',
    float: 'left',
    overflow: 'hidden',
    backgroundColor: '#ddd'
  };
  return (
    <div style={friendIconStyle}>
      { !props.thumbnail ? null :
        <ImgFadeInOnLoad
          src={props.thumbnail}
          backgroundColor='ddd'
          width='38'
          height='38'
          circular
          />
       }

    </div>
  )

};

module.exports = FriendIcon;

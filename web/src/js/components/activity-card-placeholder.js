import React from 'react';
import m from '../m.js';
import Card from './card.js';
import FriendIcon from './friend-icon.js';

let ActivityCardPlaceholder = (props) => {

  return (
    <Card>
      <div style={{padding: '24px'}}>
        <FriendIcon/>
        <span>Person is doing something</span>
      </div>
      { /* options */ }
    </Card>
  );

};

module.exports = ActivityCardPlaceholder;

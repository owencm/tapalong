import React from 'react';
import m from '../m.js';

let Card = (props) => {

  let cardStyle = {
    /* This puts the border inside the edge */
    boxSizing: 'border-box',
    maxWidth: '600px',
    margin: '0 auto',
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
    color: '#444',
    lineHeight: '1.5em',
    backgroundColor: '#fafafa',
    /* For fading into 'attending' */
    WebkitTransition: 'background-color 0.5s',
  };

  if (props.backgroundColor !== undefined) {
    cardStyle = m(cardStyle, {backgroundColor: props.backgroundColor});
  }

  return (
    <div
      style={cardStyle}
      onClick={props.onClick ? props.onClick : function () {}}
    >
      { props.children }
    </div>
  );

}

module.exports = Card;

import React from 'react';
import m from '../m.js';

let RaisedButton = (props) => {
  let style = {
    outer: {
      backgroundColor: '#FFFF00',
      color: '#333',
      minWidth: '128px',
      padding: '16px',
      margin: '24px',
      borderRadius: '2px',
      fontWeight: '400',
      boxShadow: '0px 1px 2px rgba(0,0,0,0.3)',
      textAlign: 'center'
    },
    inner: {
      display: 'inline-block'
    }
  }

  return (
    <div style={style.outer} onClick={props.onClick}>
      <div style={style.inner}>
        {props.label.toUpperCase()}
      </div>
    </div>
  );
}

module.exports = RaisedButton;

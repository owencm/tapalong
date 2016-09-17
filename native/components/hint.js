import React from 'react';
import m from '../m.js';

let Hint = (props) => {
  const defaultStyle = {
    color: '#555',
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px',
    lineHeight: '1.4em',
    textAlign: 'center'
  }

  const overridingStyles = props.style || {};

  const style = Object.assign({}, defaultStyle, overridingStyles);

  return (
    <div style={style}>
      { props.text }
    </div>
  )
}

module.exports = Hint;

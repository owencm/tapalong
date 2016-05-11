import React from 'react';
import m from '../m.js';

// Remember to disable the option after it lets you know it's been clicked
// We don't do that here as disabled is a prop and we can't move it to state
// without disallowing it to be used to create cards with disabled options.
// Also the string should be changed to the gerrand and have '...' added.

const CardOptions = (props) => {

  const defaultStyle = {
    textTransform: 'uppercase',
    fontWeight: '600',
    fontSize: '14px',
    /* Put the padding and margin on the options so the click targets are larger */
    padding: '14px 20px',
    margin: '0px',
    /* A default position */
    float: 'right'
  };

  const optionCards = props.options.map((option) => {
    let color;
    if (option.disabled) {
      color = '#CCC';
    } else if (option.type === 'bad') {
      color = '#E33';
    } else if (option.type === 'secondary') {
      color = '#4C4C4C';
    } else {
      color = '#02b0c6';
    }

    return (
      <div
        style = { m(defaultStyle, option.position == 'left' ? {float: 'left'} : {}) }
        onClick = { option.disabled ? function(){} : option.onClick }
        key = { option.label }
      >
        <a style={{ color }}>
          {option.label}
        </a>
      </div>
    )
  });

  return (
    <div>
      { optionCards }
      <div style={{clear: 'both'}}></div>
    </div>
  )

}

module.exports = CardOptions;

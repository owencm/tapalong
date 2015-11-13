// Require react, convenience libraries and UI components
let React = require('react');
let m = require('../m.js');

// Remember to disable the option after it lets you know it's been clicked
// We don't do that here as disabled is a prop and we can't move it to state
// without disallowing it to be used to create cards with disabled options.
// Also the string should be changed to the gerrand and have '...' added.

let CardOptions = (props) => {
  let optionStyle = {
    textTransform: 'uppercase',
    fontWeight: '600',
    fontSize: '14px',
    /* Put the padding and margin on the options so the click targets are larger */
    padding: '14px 20px',
    margin: '0px',
    /* A default position */
    float: 'right'
  };
  let enabledOptionStyle = {
    color: '#00BCD4'
  };
  let badEnabledOptionStyle = {
    color: '#e33'
  };
  let disabledOptionStyle = {
    color: '#CCC'
  };
  let optionCards = props.options.map((option) => {
    return (
      <div
        style = { m(optionStyle, option.position == 'left' ? {float: 'left'} : {}) }
        onClick = { option.disabled ? function(){} : option.onClick }
        key = { option.label }
      >
        <a style={
            option.disabled ? disabledOptionStyle : (
              option.type == 'bad' ? badEnabledOptionStyle : enabledOptionStyle
            )
          }
        >
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

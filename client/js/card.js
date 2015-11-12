// Require react, convenience libraries and UI components
var React = require('react');
var m = require('./m.js');

module.exports = (props) => {
  var cardStyle = {
    /* This puts the border inside the edge */
    boxSizing: 'border-box',
    maxWidth: '600px',
    margin: '0 auto',
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
    color: '#444',
    lineHeight: '1.5em',
    backgroundColor: '#fafafa',
    /* For fading into 'attending' */
    /*-webkitTransition: 'background-color 0.5s',*/
  };
  if (props.backgroundColor !== undefined) {
    cardStyle = m(cardStyle, {backgroundColor: props.backgroundColor});
  }
  return (
    <div
      style={cardStyle}
      onClick={props.onClick ? props.onClick : function () {}}
    >
      {props.children}
    </div>
  );
}

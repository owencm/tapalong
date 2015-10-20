// Require react, convenience libraries and UI components
'use strict';

var React = require('react');
var m = require('./m.js');

module.exports = React.createClass({
  displayName: 'exports',

  render: function render() {
    var cardStyle = {
      /* This puts the border inside the edge */
      boxSizing: 'border-box',
      maxWidth: '600px',
      margin: '0 auto',
      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
      color: '#444',
      lineHeight: '1.5em',
      backgroundColor: '#fafafa'
    };
    /* For fading into 'attending' */
    /*-webkitTransition: 'background-color 0.5s',*/
    if (this.props.backgroundColor !== undefined) {
      cardStyle = m(cardStyle, { backgroundColor: this.props.backgroundColor });
    }
    return React.createElement(
      'div',
      {
        style: cardStyle,
        onClick: this.props.onClick ? this.props.onClick : function () {}
      },
      this.props.children
    );
  }
});

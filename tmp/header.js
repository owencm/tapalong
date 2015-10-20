// Require react, convenience libraries and UI components
'use strict';

var React = require('react');
var m = require('./m.js');

module.exports = React.createClass({
  displayName: 'exports',

  render: function render() {
    return React.createElement(
      'header',
      null,
      this.props.shouldShowBackButton ? React.createElement('img', {
        src: 'images/back-icon.svg',
        id: 'backButton',
        onClick: this.props.onBackButtonClick
      }) : null,
      React.createElement(
        'h1',
        { id: 'title' },
        this.props.title
      )
    );
  }
});

// Require react, convenience libraries and UI components
'use strict';

var React = require('react');
var m = require('./m.js');

module.exports = React.createClass({
  displayName: 'exports',

  render: function render() {
    return React.createElement('div', { id: 'addButton', onClick: this.props.onClick });
  }
});

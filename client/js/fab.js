// Require react, convenience libraries and UI components
var React = require('react');
var m = require('./m.js');

module.exports = React.createClass({
  render: function () {
    return <div id='addButton' onClick={this.props.onClick}></div>
  }
});

// Require react, convenience libraries and UI components
var React = require('react');
var m = require('./m.js');

var Fab = (props) => {
  return <div id='addButton' onClick={props.onClick}></div>
};

module.exports = Fab;

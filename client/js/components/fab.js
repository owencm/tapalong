// Require react, convenience libraries and UI components
let React = require('react');
let m = require('../m.js');

var Fab = (props) => {
  return <div id='addButton' onClick={props.onClick}></div>
};

module.exports = Fab;

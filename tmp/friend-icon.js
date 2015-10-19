// Require react, convenience libraries and UI components
'use strict';

var React = require('react');
var m = require('./m.js');
var ImgFadeInOnLoad = require('./img-fade-in-on-load.js');

module.exports = React.createClass({
  displayName: 'exports',

  render: function render() {
    var friendIconStyle = {
      border: '1px solid #ccc',
      borderRadius: '19px',
      width: '38px',
      height: '38px',
      marginRight: '24px',
      float: 'left',
      overflow: 'hidden'
    };
    return React.createElement(
      'div',
      { style: friendIconStyle },
      React.createElement(ImgFadeInOnLoad, { src: this.props.thumbnail, backgroundColor: 'ddd', width: '38', height: '38', circular: true })
    );
  }
});
//# sourceMappingURL=friend-icon.js.map

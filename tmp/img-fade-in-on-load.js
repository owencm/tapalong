// Require react, convenience libraries and UI components
'use strict';

var React = require('react');
var m = require('./m.js');

module.exports = React.createClass({
  displayName: 'exports',

  getInitialState: function getInitialState() {
    return { loading: false, loaded: false };
  },
  loadImage: function loadImage(src) {
    if (!this.loadingStarted) {
      this.loadingStarted = true;
      var img = new Image();
      img.onload = (function () {
        this.setState({ loaded: true });
      }).bind(this);
      img.src = src;
    }
  },
  render: function render() {
    this.loadImage(this.props.src);
    var overlayStyle = {
      width: this.props.width,
      height: this.props.height,
      backgroundColor: this.props.backgroundColor,
      opacity: '1',
      transition: 'opacity 300ms',
      position: 'absolute',
      top: '0',
      left: '0'
    };
    if (this.state.loaded) {
      overlayStyle.opacity = 0;
    }
    var imgStyle = {
      position: 'absolute',
      top: '0',
      left: '0',
      width: this.props.width,
      height: this.props.height
    };
    // To account for the clipping bug filed against Doug in Chrome
    if (this.props.circular) {
      overlayStyle.borderRadius = '50%';
      overlayStyle.overflow = 'hidden';
      imgStyle.borderRadius = '50%';
      imgStyle.overflow = 'hidden';
    }
    return React.createElement(
      'div',
      { style: { position: 'relative' } },
      this.state.loaded ? React.createElement('img', { src: this.props.src, style: imgStyle }) : null,
      React.createElement('div', { style: overlayStyle })
    );
  }
});

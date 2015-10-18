// Require react, convenience libraries and UI components
'use strict';

var React = require('react');
var m = require('./m.js');
var Card = require('./card.js');
var CardOptions = require('./card-options.js');

// Require core logic
var swLibrary = require('./swsetup.js');

module.exports = React.createClass({
  displayName: 'exports',

  handleOKClicked: function handleOKClicked(e) {
    showOverlay();
    // 300ms wait until the overlay has shown
    setTimeout((function () {
      swLibrary.requestPushNotificationPermissionAndSubscribe((function () {
        hideOverlay();
        this.props.onOptInComplete();
      }).bind(this), function () {
        // TODO: Handle failure or permission rejection
      });
    }).bind(this), 300);
  },
  render: function render() {
    return React.createElement(
      Card,
      null,
      React.createElement(
        'div',
        { style: { padding: '24px' } },
        React.createElement(
          'p',
          null,
          'Up Dog will send you a notification ',
          this.props.reason,
          '.'
        )
      ),
      React.createElement(CardOptions, {
        options: [{ label: 'OK', onClick: this.handleOKClicked }]
      })
    );
  }
});

var permissionOverlay = document.querySelector('div#permissionOverlay');

var showOverlay = function showOverlay() {
  permissionOverlay.style.display = '';
  permissionOverlay.offsetTop;
  permissionOverlay.style.opacity = 1;
};
var hideOverlay = function hideOverlay() {
  permissionOverlay.style.display = 'none';
  permissionOverlay.offsetTop;
  permissionOverlay.style.opacity = 0;
};

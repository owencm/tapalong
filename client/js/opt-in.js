// Require react, convenience libraries and UI components
var React = require('react');
var m = require('./m.js');
var Card = require('./card.js');
var CardOptions = require('./card-options.js');

// Require core logic
var swLibrary = require('./swsetup.js')

module.exports = React.createClass({
  handleOKClicked: function (e) {
    showOverlay();
    // 300ms wait until the overlay has shown
    setTimeout(() => {
      swLibrary.requestPushNotificationPermissionAndSubscribe(() => {
        hideOverlay();
        this.props.onOptInComplete();
      }, function () {
        // TODO: Handle failure or permission rejection
      });
    }, 300);
  },
  render: function () {
    return (
      <Card>
        <div style={{padding: '24px'}}>
          <p>Up Dog will send you a notification {this.props.reason}.</p>
        </div>
        <CardOptions
          options={[{label: 'OK', onClick: this.handleOKClicked}]}
        />
      </Card>
    )
  }
});

var permissionOverlay = document.querySelector('div#permissionOverlay');

var showOverlay = function  () {
  permissionOverlay.style.display = '';
  permissionOverlay.offsetTop;
  permissionOverlay.style.opacity = 1;
};
var hideOverlay = function () {
  permissionOverlay.style.display = 'none';
  permissionOverlay.offsetTop;
  permissionOverlay.style.opacity = 0;
};

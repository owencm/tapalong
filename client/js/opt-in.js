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
    setTimeout(function() {
      swLibrary.requestPushNotificationPermissionAndSubscribe(function () {
        hideOverlay();
        changeState(this.props.nextState);
      }, function () {
        // TODO: Handle failure or permission rejection
      });
    }.bind(this), 300);
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

import React from 'react';
import m from '../m.js';
import Card from './card.js';
import CardOptions from './card-options.js';
import DimScreen from './dim-screen.js';

// Require core logic
import swLibrary from '../swsetup.js';

let OptIn = React.createClass({

  getInitialState: function () {
    return {showingPermissionRequest: false};
  },

  componentDidMount: function () {
    // Let the parent know when the transition is over
    setTimeout(this.props.onScreenDim, this.props.duration);
  },

  handleOKClick: function (e) {
    this.setState({showingPermissionRequest: true});
  },

  handleScreenDim: function () {
    swLibrary.requestPushNotificationPermissionAndSubscribe(() => {
      this.setState({showingPermissionRequest: false});
      this.props.onOptInComplete();
    }, () => {
      console.log('Failure');
      // TODO: Handle failure or permission rejection
    });
  },

  render: function () {
    return (
      <Card>
        <div style={{padding: '24px'}}>
          <p>Up Dog will send you a notification {this.props.reason}.</p>
        </div>
        <CardOptions
          options={[{label: 'OK', onClick: this.handleOKClick}]}
        />
        {
          this.state.showingPermissionRequest ?
            <DimScreen onScreenDim={this.handleScreenDim} /> : null
        }
      </Card>
    )
  }

});

module.exports = OptIn;

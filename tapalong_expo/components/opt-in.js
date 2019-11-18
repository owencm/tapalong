import React from 'react';
import m from '../m.js';
import Card from './card.js';
import CardOptions from './card-options.js';
import DimScreen from './dim-screen.js';
import If from './if.js';

// Require core logic
// TODO: Refactor dependency on this to higher up in the hierarchy
// import swLibrary from '../swsetup.js';

class OptIn extends React.Component {
  // TODO: refactor state out into Redux
  state = {showingPermissionRequest: false};

  componentDidMount() {
    // Let the parent know when the transition is over
    setTimeout(this.props.onScreenDim, this.props.duration);
  }

  handleOKClick = (e) => {
    this.setState({showingPermissionRequest: true});
  };

  handleScreenDim = () => {
    console.log('Not implemented');
    // swLibrary.requestPushNotificationPermissionAndSubscribe(this.props.user, () => {
    //   this.setState({showingPermissionRequest: false});
    //   this.props.onOptInComplete();
    // }, () => {
    //   console.log('Failure');
    //   // TODO: Handle failure or permission rejection properly
    //   this.setState({showingPermissionRequest: false});
    //   this.props.onOptInComplete();
    // });
  };

  render() {
    return (
      <Card>
        <div style={{padding: '24px'}}>
          <p>Up Dog will send you a notification {this.props.reason}.</p>
        </div>
        <CardOptions
          options={[{label: 'OK', onClick: this.handleOKClick}]}
        />
        <If condition={this.state.showingPermissionRequest}>
          <DimScreen onScreenDim={this.handleScreenDim} />
        </If>
      </Card>
    )
  }
}

module.exports = OptIn;

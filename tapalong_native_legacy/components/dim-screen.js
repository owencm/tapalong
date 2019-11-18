import React from 'react';
import m from '../m.js';

class DimScreen extends React.Component {
  getDuration = () => {
    return (this.props.duration == undefined) ? 0 : this.props.duration;
  };

  render() {
    return (
      <div
        ref='permissionOverlay'
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: '10000',
          transition: 'opacity' + this.getDuration() + 'ms',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          opacity: 0
        }}
      />
    )
  }

  componentDidMount() {
    // Let the parent know when the transition is over
    setTimeout(this.props.onScreenDim, this.getDuration());
    // Force a layout so the transition will apply
    this.refs.permissionOverlay.offsetTop;
    this.refs.permissionOverlay.style.opacity = 1;
  }
}

module.exports = DimScreen;

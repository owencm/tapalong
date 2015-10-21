// Require react, convenience libraries and UI components
var React = require('react');
var m = require('./m.js');

class DimScreen extends React.Component {

  render() {
    return (
      <div
        ref='permissionOverlay'
        style={{
          position: 'fixed',
          top: '0',
          bottom: '0',
          left: '0',
          right: '0',
          zIndex: '10000',
          transition: 'opacity' + this.props.duration + 'ms',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          opacity: '0'
        }}
      />
    )
  }

  componentDidMount() {
    // Let the parent know when the transition is over
    setTimeout(this.props.onScreenDim, this.props.duration);
    // Force a layout so the transition will apply
    this.refs.permissionOverlay.offsetTop;
    this.refs.permissionOverlay.style.opacity = 1;
  }

}

DimScreen.defaultProps = {
  duration: 300
}

module.exports = DimScreen;

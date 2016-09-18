import React from 'react';
import m from '../m.js';
import If from './if.js';

let ImgFadeInOnLoad = React.createClass({

  getInitialState: function () {
    return { loading: false, loaded: false };
  },

  componentDidMount: function () {
    this.loadImage(this.props.src);
  },

  loadImage: function (src) {
    if (!this.state.loadingStarted) {
      this.setState({loadingStarted: true});
      let img = new Image();
      img.onload = () => {
        this.setState({loaded: true})
      };
      img.src = src;
    }
  },

  render: function () {
    let overlayStyle = {
      width: this.props.width,
      height: this.props.height,
      backgroundColor: this.props.backgroundColor,
      opacity: 1,
      transition: 'opacity 300ms',
      position: 'absolute',
      top: 0,
      left: 0
    };
    if (this.state.loaded) {
      overlayStyle.opacity = 0;
    }
    let imgStyle = {
      position: 'absolute',
      top: 0,
      left: 0,
      width: this.props.width,
      height: this.props.height
    }
    // To account for the clipping bug filed against Doug in Chrome
    if (this.props.circular) {
      overlayStyle.borderRadius = '50%';
      overlayStyle.overflow = 'hidden';
      imgStyle.borderRadius = '50%';
      imgStyle.overflow = 'hidden';
    }
    return (
      <div style={{position: 'relative'}}>
        <If condition={this.state.loaded}>
          <img src = { this.props.src } style = { imgStyle } />
        </If>
        <div style={overlayStyle} />
      </div>
    )
  }

});

module.exports = ImgFadeInOnLoad;

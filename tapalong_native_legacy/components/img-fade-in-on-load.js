import React from 'react';
import { View, Image, Platform } from 'react-native'
import m from '../m.js';
import If from './if.js';

export default class ImgFadeInOnLoad extends React.Component {

  constructor(props) {
    super(props)
    this.state = { loading: false, loaded: false };
  }

  componentDidMount() {
    this.loadImage(this.props.src);
  }

  loadImage(src) {
    if (!this.state.loadingStarted) {
      this.setState({loadingStarted: true});
      let img = new Image();
      img.onload = () => {
        this.setState({loaded: true})
      };
      img.src = src;
    }
  }

  render() {
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
      overlayStyle.borderRadius = 0.5;
      overlayStyle.overflow = 'hidden';
      imgStyle.borderRadius = 0.5;
      imgStyle.overflow = 'hidden';
    }
    // if (Platform.OS == 'ios') {
      return <Image
        source={{ uri: this.props.src }}
        style={ imgStyle }
      />
    // }

    // return (
    //   <View style={{position: 'relative'}}>
    //     <If condition={this.state.loaded}>
    //       <img src={ this.props.src } style = { imgStyle } />
    //     </If>
    //     <View style={overlayStyle} />
    //   </View>
    // )
  }

}

import React from 'react'
import {
  View,
} from 'react-native'

let timeout;

export default class DelayView extends React.Component {
  state = {
    visible: false
  };

  componentDidMount() {
    timeout = setTimeout(() => {
      this.setState({ visible: true })
    }, this.props.delay)
  }

  componentWillUnmount() {
    clearTimeout(timeout)
  }

  render() {
    if (this.state.visible) {
      return this.props.children
    } else {
      return null
    }
  }
}

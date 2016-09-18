import React from 'react'
import { TextInput } from 'react-native'

const style = {
  height: 26,
  borderBottomWidth: 1,
  borderBottomColor: '#DDD',
  flex: 1,
  fontSize: 13,
  padding: 4,
}

class AutoExpandingTextInput extends React.Component {
  state: any;

  constructor(props) {
    super(props);
    this.state = {
      text: '',
      height: 0,
    };
  }
  render() {
    return (
      <TextInput
        {...this.props}
        multiline={true}
        onChangeText={(text) => {
          this.setState({text});
        }}
        onContentSizeChange={(event) => {
          this.setState({height: event.nativeEvent.contentSize.height});
        }}
        style={[style, {height: Math.max(35, this.state.height)}]}
        value={this.state.text}
      />
    );
  }
}

export default AutoExpandingTextInput

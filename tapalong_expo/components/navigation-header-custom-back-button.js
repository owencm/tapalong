import React from 'react'
import {
  I18nManager,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'

const NavigationHeaderCustomBackButton = (props) => (
  <TouchableOpacity style={styles.buttonContainer} onPress={props.onPress}>
    <Image style={styles.button} source={require('../assets/back-icon-white.png')} />
  </TouchableOpacity>
)

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    height: 24,
    width: 24,
    margin: Platform.OS === 'ios' ? 10 : 16,
    resizeMode: 'contain',
    transform: [{scaleX: I18nManager.isRTL ? -1 : 1}],
  }
})

export default NavigationHeaderCustomBackButton;

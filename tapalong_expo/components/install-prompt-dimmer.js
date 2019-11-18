import React from 'react';
import If from './if.js';
import DimScreen from './dim-screen.js';

class InstallPromptDimmer extends React.Component {
  state = {
    installPromptShowing: false
  };

  componentDidMount() {
    const handleInstallPromptShowing = (userChoice) => {
      // Only show the banner once a week in case people have the bypass user
      //   engagement flag flipped
      this.setState({ installPromptShowing: true });
      userChoice.then(() => {
        this.setState({ installPromptShowing: false });
      });
    }
    if (window.installPromptUserChoice) {
      handleInstallPromptShowing(window.installPromptUserChoice);
    }
    window.addEventListener('beforeinstallprompt', (event) => {
      setTimeout(() => {
        if (window.installPromptUserChoice) {
          handleInstallPromptShowing(window.installPromptUserChoice);
        }
      }, 200);
    });
  }

  render() {
    return (
      <If condition={this.state.installPromptShowing}>
        <DimScreen />
      </If>
    )
  }
}

module.exports = InstallPromptDimmer;

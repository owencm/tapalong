import React from 'react';
import If from './if.js';
import DimScreen from './dim-screen.js';

let InstallPromptDimmer = React.createClass({

  componentDidMount: function() {
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
  },

  getInitialState: function() {
    return {
      installPromptShowing: false
    }
  },

  render: function() {
    return (
      <If condition={this.state.installPromptShowing}>
        <DimScreen />
      </If>
    )
  },

});

module.exports = InstallPromptDimmer;

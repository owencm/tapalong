// Require react, convenience libraries and UI components
var React = require('react');
var m = require('./m.js');

module.exports = React.createClass({
  render: function () {
    return (
      <header>
        {
          this.props.shouldShowBackButton ?
            <img
              src='images/back-icon.svg'
              id='backButton'
              onClick={this.props.onBackButtonClicked}
            /> :
            null
        }
        <h1 id='title'>
          {this.props.title}
        </h1>
      </header>
    );
  }
})

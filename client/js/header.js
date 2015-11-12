// Require react, convenience libraries and UI components
var React = require('react');
var m = require('./m.js');

module.exports = React.createClass({
  render: function () {
    var headerStyle = {
      backgroundColor: '#00BCD4',
      boxShadow: '0 1px 6px rgba(0,0,0,.2)',
      position: 'fixed',
      width: '100%',
      zIndex: '1',
      boxSizing: 'border-box'
    }

    // Note we set paddingLeft explicitely as if we don't, React creates a strange bug
    // where it keeps the paddingLeft: 0 set later even if !shouldShowBackButton
    var titleStyle = {
      fontSize: '18px',
      color: 'white',
      fontWeight: 'bold',
      padding: '19px',
      paddingLeft: '19px',
      float: 'left'
    }

    if (this.props.shouldShowBackButton) {
      console.log('set titlestyle')
      titleStyle = Object.assign({}, titleStyle, {paddingLeft: '0'});
    }

    var backButtonStyle = {
    	width: '20px',
    	padding: '18px',
      float: 'left'
    }

    return (
      <header style={headerStyle}>
        {
          this.props.shouldShowBackButton ?
            <img
              src='images/back-icon.svg'
              style={backButtonStyle}
              onClick={this.props.onBackButtonClick}
            /> :
            null
        }
        <h1 style={titleStyle}>
          {this.props.title}
        </h1>
      </header>
    );
  }
})

// Require react, convenience libraries and UI components
var React = require('react');
var m = require('./m.js');

// A pure function, ala "Stateless function components" in https://facebook.github.io/react/blog/2015/09/10/react-v0.14-rc1.html
module.exports = (props) => {
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

  if (props.shouldShowBackButton) {
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
        props.shouldShowBackButton ?
          <img
            src='images/back-icon.svg'
            style={backButtonStyle}
            onClick={props.onBackButtonClick}
          /> :
          null
      }
      <h1 style={titleStyle}>
        {props.title}
      </h1>
    </header>
  );
};

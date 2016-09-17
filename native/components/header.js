import React from 'react';
import m from '../m.js';
import If from './if.js';

let Header = (props) => {

  let headerStyle = {
    backgroundColor: '#00BCD4',
    boxShadow: '0 1px 6px rgba(0,0,0,.2)',
    position: 'fixed',
    width: '100%',
    zIndex: 1,
    boxSizing: 'border-box',
  }

  // Note we set paddingLeft explicitely as if we don't, React creates a strange bug
  // where it keeps the paddingLeft: 0 set later even if !shouldShowBackButton
  let titleStyle = {
    fontSize: '18px',
    color: 'white',
    fontWeight: 'bold',
    padding: '19px',
    paddingLeft: '19px',
  }

  let backButtonStyle = {
    float: 'left',
  	margin: '18px',
    width: '20px',
    height: '20px',
  }

  if (props.shouldShowBackButton) {
    titleStyle = Object.assign({}, titleStyle, {paddingLeft: '0'});
  }

  return (
    <header style={headerStyle}>
      <If condition={props.shouldShowBackButton}>
        <img
          src='images/back-icon.svg'
          style={backButtonStyle}
          onClick={props.onBackButtonClick}
        />
      </If>
      <h1 style={titleStyle}>
        {props.title}
      </h1>
    </header>
  );

};

module.exports = Header;

import React from 'react';
import m from '../m.js';

let Fab = (props) => {

  let style = {
    width: '60px',
    height: '60px',
    borderRadius: '30px',
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundImage: 'url(\'images/plus-grey.png\')',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '16px',
    backgroundColor: '#FFFF00',
    boxShadow: '0px 2px 5px rgba(0,0,0,0.3)'
  }

  return <div style={style} onClick={props.onClick}></div>

};

module.exports = Fab;

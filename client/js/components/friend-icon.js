// Require react, convenience libraries and UI components
let React = require('react');
let m = require('../m.js');
let ImgFadeInOnLoad = require('./img-fade-in-on-load.js');

let FriendIcon = (props) => {

  let friendIconStyle = {
    border: '1px solid #ccc',
    borderRadius: '19px',
    width: '38px',
    height: '38px',
    marginRight: '24px',
    float: 'left',
    overflow: 'hidden'
  };
  return (
    <div style={friendIconStyle}>
      <ImgFadeInOnLoad src={props.thumbnail} backgroundColor='ddd' width='38' height='38' circular/>
    </div>
  )
  
};

module.exports = FriendIcon;

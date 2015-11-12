// Require react, convenience libraries and UI components
var React = require('react');
var m = require('./m.js');
var ImgFadeInOnLoad = require('./img-fade-in-on-load.js');

var FriendIcon = (props) => {
  var friendIconStyle = {
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

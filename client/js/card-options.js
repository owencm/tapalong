// Require react, convenience libraries and UI components
var React = require('react');
var m = require('./m.js');

var CardOptions = React.createClass({
  render: function () {
    var optionStyle = {
      textTransform: 'uppercase',
      fontWeight: '600',
      fontSize: '14px',
      /* Put the padding and margin on the options so the click targets are larger */
      padding: '14px 20px',
      margin: '0px',
      /* A default position */
      float: 'right'
    };
    var enabledOptionStyle = {
      color: '#00BCD4'
    };
    var badEnabledOptionStyle = {
      color: '#e33'
    };
    var disabledOptionStyle = {
      color: '#CCC'
    };
    var optionCards = this.props.options.map((option) => {
      return (
        <div
          style = { m(optionStyle, option.position == 'left' ? {float: 'left'} : {}) }
          onClick = { option.disabled ? function(){} : option.onClick }
          key = { option.label }
        >
          <a style={
              option.disabled ? disabledOptionStyle : (
                option.type == 'bad' ? badEnabledOptionStyle : enabledOptionStyle
              )
            }
          >
            {option.label}
          </a>
        </div>
      )
    });
    return (
      <div>
        { optionCards }
        <div style={{clear: 'both'}}></div>
      </div>
    )
  }
});

module.exports = CardOptions;

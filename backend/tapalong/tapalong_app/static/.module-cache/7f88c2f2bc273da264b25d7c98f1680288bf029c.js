// To account for the clipping bug filed against Doug in Chrome
if (this.props.circular) {
  overlayStyle.borderRadius = '50%';
  overlayStyle.overflow = 'hidden';
  imgStyle.borderRadius = '50%';
  imgStyle.overflow = 'hidden';
}

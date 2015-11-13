import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import tapalong from './components/tapalong.js';
import * as Actions from './actions.js';

function mapStateToProps(state) {
  return {
    user: state.user,
    activities: state.activities,
    screens: state.screens
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(Actions, dispatch)
}

export default connect(mapStateToProps, mapDispatchToProps)(tapalong)

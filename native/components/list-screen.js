import React from 'react'
import {
  ScrollView,
  Text,
  View,
  RefreshControl,
} from 'react-native'
import PlanCardList from './plan-card-list.js'
import RaisedButton from './raised-button.js'
import PublicEventCardList from './public-event-card-list.js'
import Collapsible from 'react-native-collapsible'

export default class ListScreen extends React.Component {

  // TODO: scroll to top when navigated to with new content

  render() {

    const butterBar = (
      <View style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
        <Collapsible collapsed={ !this.props.butterBar.shouldShowButterBar } align={ 'bottom' }>
          <View style={{ padding: 14, backgroundColor: '#555', borderRadius: 14 }}>
            <Text style={{ color: '#EEE' }}>{`Great, we'll let them know you'll be joining! 🙌`}</Text>
          </View>
        </Collapsible>
      </View>
    )

    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={this.props.refreshing}
                onRefresh={this.props.onRefresh}
              />
            }
          >
            <PlanCardList
              style={{ flex: 1, marginBottom: 16, marginTop: 16 }}
              plans={ this.props.plans.plans }
              user={ this.props.user }
              plansInitialized={ this.props.plans.initialized }
              onAttendPlan={ this.props.onAttendPlan }
              onUnattendPlan={ this.props.onUnattendPlan }
              onEditPlan={ this.props.gotoEditPlanScreen }
              selectedPlans={ this.props.plans.selectedPlans }
              onExpandPlan={ this.props.onExpandPlan }
              onUnexpandPlan={ this.props.onUnexpandPlan }
              onCreateClick={ this.props.gotoCreatePlanScreen }
              onReportPlan={ this.props.onReportPlan }
            />
            <PublicEventCardList
              user={ this.props.user }
              onCreateClick={ this.props.gotoCreatePlanScreen }
              eventsInitialized={ this.props.events.initialized }
              events={ this.props.events.events }
            />
            <View style={{ height: 24 }} />
          </ScrollView>
          { butterBar }
        </View>
        <View style={{
          backgroundColor: 'white',
          padding: 8,
          justifyContent: 'center',
          flexDirection: 'row',
          borderTopWidth: 1,
          borderTopColor: '#DDD'
        }}
        >
          <View style={{ justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
            <Text style={{ color: '#888', fontSize: 13 }}>Got something planned?</Text>
          </View>
          <RaisedButton label='Add plan' onClick={ this.props.gotoCreatePlanScreen } />
        </View>
      </View>
    )

  }
}

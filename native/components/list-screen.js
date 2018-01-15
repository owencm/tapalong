import React from 'react'
import {
  ScrollView,
  Text,
  View,
} from 'react-native'
import PlanCardList from './plan-card-list.js'
import RaisedButton from './raised-button.js'
import PublicEventCardList from './public-event-card-list.js'
import Collapsible from 'react-native-collapsible'

const ListScreen = (props) => {
  const butterBar = (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
      <Collapsible collapsed={ !props.butterBar.shouldShowButterBar } align={ 'bottom' }>
        <View style={{ padding: 14, backgroundColor: '#333' }}>
          <Text style={{ color: '#EEE' }}>{`Great! We'll let them know you are going.`}</Text>
        </View>
      </Collapsible>
    </View>
  )

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }}>
          <PlanCardList
            style={{ flex: 1, marginBottom: 16 }}
            plans={ props.plans.plans }
            user={ props.user }
            plansInitialized={ props.plans.initialized }
            onAttendPlan={ props.onAttendPlan }
            onUnattendPlan={ props.onUnattendPlan }
            onEditPlan={ props.gotoEditPlanScreen }
            selectedPlans={ props.plans.selectedPlans }
            onExpandPlan={ props.onExpandPlan }
            onUnexpandPlan={ props.onUnexpandPlan }
            onCreateClick={ props.gotoCreatePlanScreen }
          />
          <PublicEventCardList
            user={ props.user }
            onCreateClick={ props.gotoCreatePlanScreen }
            eventsInitialized={ props.events.initialized }
            events={ props.events.events }
          />
          <View style={{ height: 24 }} />
        </ScrollView>
        { butterBar }
      </View>
      <View style={{
        backgroundColor: '#e9e9ef',
        padding: 12,
        justifyContent: 'center',
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#BBB'
      }}
      >
        <View style={{ justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
          <Text style={{ color: '#888', fontSize: 13 }}>Got something planned?</Text>
        </View>
        <RaisedButton label='Add plan' onClick={ props.gotoCreatePlanScreen } />
      </View>
    </View>
  )

}

export default ListScreen

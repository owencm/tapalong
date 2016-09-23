import React from 'react'
import {
  ScrollView,
  Text,
  View,
} from 'react-native'
import PlanCardList from './plan-card-list.js'
import TextButton from './text-button.js'
import If from './if.js'
import PublicEventCardList from './public-event-card-list.js'

const ListScene = (props) => {
  const butterBar = (
    <If condition={ props.shouldShowButterBar }>
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, backgroundColor: '#333' }}>
        <Text style={{ color: '#EEE' }}>{`Great! We'll let them know you are going.`}</Text>
      </View>
    </If>
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
            onEditPlan={ props.gotoEditPlanScene }
            selectedPlan={ props.plans.selectedPlan }
            onExpandPlan={ props.onExpandPlan }
            onUnexpandPlan={ props.onUnexpandPlan }
            onCreateClick={ props.gotoCreatePlanScene }
          />
          <PublicEventCardList
            user={ props.user }
            onCreateClick={ props.gotoCreatePlanScene }
            eventsInitialized={ props.events.initialized }
            events={ props.events.events }
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
        borderTopColor: '#EEE'
      }}
      >
        <View style={{ justifyContent: 'center' }}>
          <Text style={{ color: '#444' }}>Got something planned?</Text>
        </View>
        <TextButton label='Add plan' onClick={ props.gotoCreatePlanScene } />
      </View>
    </View>
  )

}

export default ListScene

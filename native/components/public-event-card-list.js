import React from 'react'
import {
  Image,
  Text,
  View,
  Linking,
} from 'react-native'
import m from '../m.js'
import If from './if.js'
import Card from './card.js'
import CardMainContents from './card-main-contents.js'
import CardOptions from './card-options.js'
import FriendIcon from './friend-icon.js'

const PublicEventCardList = (props) => {

  if (props.eventsInitialized === false) {
    return null
  }

  const getOptions = (title, url) => {
    let options = []

    if (url) {
      options.push({
        label: 'More info',
        type: 'secondary',
        onClick: () => {
          Linking.openURL(url)
        }
      })
    }

    options.push({
      label: 'Create',
      onClick: () => {
        props.onCreateClick({ title })
      }
    })

    return options
  }

  const getEventCard = ({ title, url }) => {
    const options = getOptions(title, url)

    return (
      <Card key={ title } style={{ marginLeft: 16, marginRight: 16, marginBottom: 8 }}>
        <CardMainContents style={{ flexDirection: 'row' }}>
          <FriendIcon thumbnail={ props.user.thumbnail }/>
          <View style={{flex: 1, flexDirection: 'column'}}>
            <Text style={{ fontSize: 17 }}><Text style={{ fontWeight: '600' }}>You</Text> could consider <Text style={{ fontWeight: '600' }}>{ title }</Text></Text>
          </View>
        </CardMainContents>
        <CardOptions options={ options } />
      </Card>
    )
  }

  const eventCards = props.events.map(getEventCard)

  return (
    <View>
      <Text
        style={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          fontSize: 12,
          color: '#555'
        }}
      >
        SUGGESTED PLANS
      </Text>
      { eventCards }
    </View>
  )
}

export default PublicEventCardList

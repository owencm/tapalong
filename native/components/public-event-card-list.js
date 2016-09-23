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
// import FBSDK from 'react-native-fbsdk'
//
// const shareContent = {
//   contentType: 'link',
//   contentUrl: 'https://www.updogapp.co',
//   contentDescription: 'Up Dog: Spend time with friends'
// }
//
//
// const canShare = () => FBSDK.MessageDialog.canShow(shareContent)
//
// const share = (contentDescription) => FBSDK.MessageDialog.show(Object.assign(shareContent, { contentDescription }))

const PublicEventCardList = (props) => {

  if (props.eventsInitialized === false) {
    return null
  }

  const getOptions = (title, url) => {
    let options = []

    if (url) {
      options.push({
        label: 'Search',
        type: 'secondary',
        onClick: () => {
          console.log('opeening',url)
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
      <Card key={ title }>
        <CardMainContents style={{ flexDirection: 'row' }}>
          <FriendIcon thumbnail={ props.user.thumbnail }/>
          <View style={{flex: 1, flexDirection: 'column'}}>
            <Text><Text style={{ fontWeight: '500' }}>You</Text> could consider <Text style={{ fontWeight: '500' }}>{ title }</Text></Text>
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
        SUGGESTED PLAN IDEAS
      </Text>
      { eventCards }
    </View>
  )
}

export default PublicEventCardList

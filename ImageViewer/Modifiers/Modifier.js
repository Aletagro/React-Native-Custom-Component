// @flow

import React, {Component} from 'react'
import {TouchableOpacity, View, Text} from 'react-native'
import Image from '../Image'
import Images from '../../Themes/Images'
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet'

import gt from 'lodash/gt'
import isEqual from 'lodash/isEqual'

import Styles from './Styles'

type Props = {
  itemData: {id: number, qty: number},
  modifier: Object,
  style?: ViewStyleProp,
  onPressModifier: () => void,
  qty: number
}

class Modifier extends Component<Props> {
  shouldComponentUpdate (nextProps: Props) {
    return !isEqual(this.props.itemData, nextProps.itemData) ||
      !isEqual(this.props.modifier, nextProps.modifier) ||
      this.props.qty !== nextProps.qty
  }

  render () {
    const {itemData, modifier, style, onPressModifier, qty} = this.props
    const isSelected: boolean = itemData.id === modifier.itemId
    return <TouchableOpacity
      key={modifier.sid}
      style={[Styles.container, Styles.size, style]}
      onPress={onPressModifier}
      disabled={isSelected}
    >
      <Image
        resizeMode='cover'
        style={[Styles.size, isSelected && Styles.border]}
        source={{uri: modifier.image}}
        defaultSource={Images.defaultImage}
      />
      {
        gt(qty, 0)
          ? <View style={Styles.inCart}>
            <Text style={Styles.inCartText} numberOfLines={1}>{qty}</Text>
          </View>
          : null
      }
    </TouchableOpacity>
  }
}

export default Modifier

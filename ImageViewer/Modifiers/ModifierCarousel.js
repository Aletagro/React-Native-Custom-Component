// @flow

import React, {PureComponent} from 'react'
import {ScrollView} from 'react-native'
import {connect} from 'react-redux'
import {inCartItemsIdSelector, inCartItemsSelector} from '../../Redux/CartRedux'
import Modifier from './Modifier'

import map from 'lodash/map'
import isEqual from 'lodash/isEqual'
import some from 'lodash/some'
import includes from 'lodash/includes'
import get from 'lodash/get'

import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet'

type Props = {
  onItemSelected: (itemModificationId: number) => void,
  itemData: {id: number, qty: number},
  modifiers: Object[],
  onSubmit: (option: number) => void,
  inCartItems: Array<string>,
  cartItems: Object,
  style?: ViewStyleProp
}

class ModifierCarousel extends PureComponent<Props> {
  componentDidMount () {
    if (this.isUpdateNeeded) {
      this.props.onItemSelected(this.props.itemData.id)
    }
  }

  componentDidUpdate (prevProps: Props) {
    if (this.isItemInCart && !isEqual(this.props.inCartItems, prevProps.inCartItems)) {
      this.props.onItemSelected(this.props.itemData.id)
    }
  }

  modifiersIds = map(this.props.modifiers, 'itemId')
  isItemInCart = some(this.props.inCartItems, (id) => includes(this.modifiersIds, Number(id)))
  isUpdateNeeded = some(this.props.modifiers, (modifier) =>
    Boolean(modifier.cartItem) && !includes(this.props.inCartItems, String(modifier.itemId))
  )

  handlePressModifier = (option: number) => () => this.props.onSubmit(option)

  renderModifier = (v: Object) => <Modifier
    key={v.option}
    itemData={this.props.itemData}
    modifier={v}
    onPressModifier={this.handlePressModifier(v.option)}
    qty={get(this.props.cartItems[v.itemId], 'qty', 0)}
  />

  render () {
    const {style, modifiers} = this.props
    return <ScrollView
      style={style}
      horizontal
      showsHorizontalScrollIndicator={false}
      >
      {map(modifiers, this.renderModifier)}
      </ScrollView>
  }
}

const mapStateToProps = (state) => ({
  inCartItems: inCartItemsIdSelector(state),
  cartItems: inCartItemsSelector(state)
})

export default connect(mapStateToProps)(ModifierCarousel)

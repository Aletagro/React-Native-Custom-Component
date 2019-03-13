// @flow

import React, {PureComponent} from 'react'
import {View, Dimensions, Animated, Modal, TouchableOpacity} from 'react-native'
import Swiper from 'react-native-swiper'
import map from 'lodash/map'
import {ClearAndroid} from '../../Icons'
import ZoomImage from './ZoomImage'
import type {EdgeInsetsProp} from 'react-native/Libraries/StyleSheet/EdgeInsetsPropType'

import Style from './Style'

type IImage = {
  url: string
}

type Props = {
  visible: boolean,
  index?: number,
  imageUrls: Array<{url: string}>,
  defaultSource?: any,
  onChange?: (index: number) => any,
  onCancel?: () => any
}

type State = {
  isScrollEnabled: boolean
}

const hitSlop: EdgeInsetsProp = {top: 15, left: 15, bottom: 15, right: 15}

class ImageViewer extends PureComponent<Props, State> {
  state = {
    isScrollEnabled: true
  }

  componentDidUpdate (prevProps: Props) {
    if (prevProps.visible !== this.props.visible) {
      if (this.props.visible) {
        // FadeIn анимация появления
        this.animatedOpacity.setValue(350)
        Animated.timing(this.animatedOpacity, {
          toValue: 0,
          duration: 100
        }).start()
      }
      this.setState({
        isScrollEnabled: true
      })
    }
  }

  animatedOpacity = new Animated.Value(0)

  handleScale = (scale: number) => {
    if (scale <= 1 && !this.state.isScrollEnabled) {
      this.setState({isScrollEnabled: true})
    }

    if(scale > 1 && this.state.isScrollEnabled) {
      this.setState({isScrollEnabled: false})
    }
  }

  handleSwipeDownStart = () => this.setState({
    isScrollEnabled: false
  })

  handleSwipeDownEnd = () => this.setState({
    isScrollEnabled: true
  })

  handleSwipeDownProgress = (progress: number) => this.animatedOpacity.setValue(progress)

  renderZoomImage = (image: IImage, index: number) => (
    <View key={index} style={Style.imageViewerContainer}>
      <View style={Style.flexContainer}>
        <ZoomImage
          url={image.url}
          defaultSource={this.props.defaultSource}
          minScale={1}
          maxScale={5}
          onScale={this.handleScale}
          onSwipeDown={this.props.onCancel}
          onSwipeDownStart={this.handleSwipeDownStart}
          onSwipeDownEnd={this.handleSwipeDownEnd}
          onSwipeDownProgress={this.handleSwipeDownProgress}
        />
      </View>
    </View>
  )

  render () {
    const {onCancel, onChange, visible, index, imageUrls} = this.props
    const animateConf = {
      opacity: this.animatedOpacity.interpolate({
        inputRange: [0, 350],
        outputRange: [1, 0.4]
      })
    }
    return <Modal onRequestClose={onCancel} visible={visible} animationType='fade' transparent hardwareAccelerated>
      <TouchableOpacity onPress={onCancel} style={Style.button} hitSlop={hitSlop} testID='closePhotoViewButton'>
        <ClearAndroid />
      </TouchableOpacity>
      <Animated.View style={[Style.backgroundOverlay, animateConf]}>
        <Swiper
          loop={false}
          scrollEnabled={this.state.isScrollEnabled}
          index={index}
          onIndexChanged={onChange}
          showsPagination={false}
          showsButtons={false}
          style={{height: Dimensions.get('window').height}}
        >
          {map(imageUrls, this.renderZoomImage)}
        </Swiper>
      </Animated.View>
    </Modal>
  }
}

export default ImageViewer

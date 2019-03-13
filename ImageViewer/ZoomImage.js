// @flow

import React, {PureComponent} from 'react'
import {Animated, PanResponder, View, Image, TouchableWithoutFeedback, Dimensions} from 'react-native'
import isNumber from 'lodash/isNumber'
import stubTrue from 'lodash/stubTrue'
import Style from './Style'
import type {ViewStyleProp} from 'react-native/Libraries/StyleSheet/StyleSheet'
import type {PressEvent} from 'react-native/Libraries/Types/CoreEventTypes'

// Расстояние на которое надо свайпнуть вниз, чтобы сработало событие onSwipeDown()
const SWIPE_DOWN_THRESHOLD = 200
// расстояния для начала отсчёта свайпа вниз
const SWIPE_DOWN_SENSE = 10
// максимально разрешённое расстояние для перпеникулярного движения
const SWIPE_DOWN_TOLERANCE = 5
const DOUBLE_CLICK_THRESHOLD = 400
// Расстояние, перемещения меньше которого мы не захватываем, чтобы избежать дрожания на чувствительных дисплеях
const DEAD_ZONE_THRESHOLD = 5

const timingAnimation = (animatedValue: Animated.Value | Animated.ValueXY, toValue: number) =>
  Animated.timing(animatedValue, {
    useNativeDriver: true,
    duration: 150,
    toValue: toValue
  })

type Touch = {
  identifier: number,
  locationX: number,
  locationY: number,
  pageX: number,
  pageY: number,
  timestamp: number
}

type GestureEvent = {
  nativeEvent: {
    changedTouches: Touch[],
    touches: Touch[],
    target: any
  } & Touch
}

type GestureState = {
  stateID: number,
  moveX: number,
  moveY: number,
  x0: number,
  y0: number,
  dx: number,
  dy: number,
  vx: number,
  vy: number,
  numberActiveTouches: number
}

type Props = {
  url: string,
  defaultSource?: any,
  minScale: number,
  maxScale: number,
  // Чем меньше, тем быстрее приближает/отдаляет
  zoomVelocity: number,
  onScale?: (scale: number) => void,
  onSwipeDown?: () => void,
  onSwipeDownStart?: () => void,
  onSwipeDownEnd?: () => void,
  onSwipeDownProgress?: (progress: number) => void,
  style?: ViewStyleProp
}

type State = {
  imageWidth: number,
  imageHeight: number
}

class ZoomImage extends PureComponent<Props, State> {
  static defaultProps = {
    zoomVelocity: 150
  }

  constructor(props: Props) {
    super(props)
    this.imagePanResponder = PanResponder.create({
      onStartShouldSetPanResponder: stubTrue,
      onMoveShouldSetPanResponder: this.isPanResponderActive,
      onPanResponderGrant: this.handlePanResponderGrant,
      onPanResponderMove: this.handlePanResponderMove,
      onPanResponderRelease: this.handlePanResponderRelease
    })
  }

  state = {
    imageWidth: 0,
    imageHeight: 0
  }

  componentDidMount () {
    this.getNewImage()
  }

  componentDidUpdate (prevProps: Props) {
    if (prevProps.url !== this.props.url) {
      this.getNewImage()
    }
  }

  componentWillUnmount () {
    this.isCancelled = true
  }

  isCancelled = false

  lastClickTime = 0

  positionX: number = 0
  positionY: number = 0

  centerDiffX = 0
  centerDiffY = 0

  lastPositionX = 0
  lastPositionY = 0

  zoomCurrentDistance = 0
  zoomLastDistance = 0

  cropWidth = 0
  cropHeight = 0

  scale = 1

  isSwipeDown = false
  swipeDownOffset = 0

  animatedScale = new Animated.Value(1)
  animatedPositionX = new Animated.Value(0)
  animatedPositionY = new Animated.Value(0)
  imagePanResponder: Object

  handlePanResponderGrant = () => {
    this.zoomLastDistance = null
    this.zoomCurrentDistance = 0
    this.lastPositionX = 0
    this.lastPositionY = 0
  }
  handlePanResponderMove = (evt: PressEvent, gestureState: GestureState) => {
    // Сдвиг двумя пальцами (Pinch)
    if (evt.nativeEvent.changedTouches.length > 1) {
      const {zoomVelocity} = this.props
      const touch0 = evt.nativeEvent.changedTouches[0]
      const touch1 = evt.nativeEvent.changedTouches[1]
      const centerX = (touch0.pageX + touch1.pageX) / 2
      this.centerDiffX = centerX - this.state.imageWidth / 2

      const centerY = (touch0.pageY + touch1.pageY) / 2
      this.centerDiffY = centerY - this.state.imageHeight / 2

      let minX: number
      let maxX: number
      if (touch0.locationX > touch1.locationX) {
        minX = touch1.pageX
        maxX = touch0.pageX
      } else {
        minX = touch0.pageX
        maxX = touch1.pageX
      }

      let minY: number
      let maxY: number
      if (touch0.locationY > touch1.locationY) {
        minY = touch1.pageY
        maxY = touch0.pageY
      } else {
        minY = touch0.pageY
        maxY = touch1.pageY
      }

      const widthDistance = maxX - minX
      const heightDistance = maxY - minY
      const diagonalDistance = Math.sqrt(widthDistance * widthDistance + heightDistance * heightDistance)
      this.zoomCurrentDistance = Number(diagonalDistance.toFixed(1))
      if (this.zoomLastDistance !== null) {
        const distanceDiff = (this.zoomCurrentDistance - this.zoomLastDistance) / zoomVelocity
        const zoom = this.scale + distanceDiff

        const beforeScale = this.scale
        const diffScale = this.scale - beforeScale
        this.positionX -= (this.centerDiffX * diffScale) / this.scale
        this.positionY -= (this.centerDiffY * diffScale) / this.scale
        this.setScale(zoom)
      }
      this.zoomLastDistance = this.zoomCurrentDistance
    } else if (this.scale > 1) {
      // Просто перемещаем одним пальцем
      let diffX = gestureState.dx - (this.lastPositionX || 0)
      if (this.lastPositionX === null) {
        diffX = 0
      }

      let diffY = gestureState.dy - (this.lastPositionY || 0)
      if (this.lastPositionY === null) {
        diffY = 0
      }

      this.lastPositionX = gestureState.dx
      this.lastPositionY = gestureState.dy

      this.setScale(this.scale, this.positionX + (diffX / this.scale), this.positionY + (diffY / this.scale))
    } else {
      if (this.isSwipeDown) {
        let diffY = gestureState.dy - (this.swipeDownOffset || 0)
        if (this.swipeDownOffset === null) {
          diffY = 0
        }
        this.swipeDownOffset += diffY
        if (this.props.onSwipeDownProgress) {
          this.props.onSwipeDownProgress(this.swipeDownOffset)
        }
      }
      this.panTo(this.positionX, this.swipeDownOffset)
    }
  }

  handlePanResponderRelease = () => {
    if (this.isSwipeDown) {
      if (this.swipeDownOffset > SWIPE_DOWN_THRESHOLD && this.props.onSwipeDown) {
        return this.props.onSwipeDown()
      }

      if (this.props.onSwipeDownEnd) {
        this.props.onSwipeDownEnd()
      }

      if (this.props.onSwipeDownProgress) {
        this.props.onSwipeDownProgress(0)
      }

      // Если мы попытались свайпнуть вниз но не довели до конца, то центрируем картинку
      if (this.swipeDownOffset < SWIPE_DOWN_THRESHOLD) {
        this.panTo(0, 0, true)
      }

      this.isSwipeDown = false
      this.swipeDownOffset = 0
    }

    // Если мы слишком сильно уменьшили картинку то возвращаем скейл к минимальному
    if (this.scale < this.props.minScale) {
      this.setScale(this.props.minScale, 0, 0, true)
    }
  }

  handleLayout = (evt: {+nativeEvent: {+layout: {+width: number, +height: number}}}) => {
    const {width, height} = evt.nativeEvent.layout
    this.cropWidth = width
    this.cropHeight = height
  }

  isPanResponderActive = (evt: PressEvent, gestureState: GestureState) => {
    if (this.isSwipeDown) {
      return true
    }

    if (evt.nativeEvent.touches.length <= 1) {
      this.isSwipeDown = false
      // Порог для свайпа вниз
      if (
        this.scale <= this.props.minScale &&
        gestureState.dy >= SWIPE_DOWN_SENSE &&
        Math.abs(gestureState.dx) < SWIPE_DOWN_TOLERANCE
      ) {
        if (!this.isSwipeDown && this.props.onSwipeDownStart) {
          this.props.onSwipeDownStart()
        }
        this.isSwipeDown = true
        return true
      }

      if (
        (Math.abs(gestureState.dx) <= DEAD_ZONE_THRESHOLD || Math.abs(gestureState.dy) <= DEAD_ZONE_THRESHOLD) &&
        this.scale > this.props.minScale
      ) {
        return false
      }
    }
    return this.scale > this.props.minScale || evt.nativeEvent.touches.length > 1
  }

  setScale = (scale: number, focalX?: number, focalY?: number, animated?: boolean) => {
    const minScaleLimit = this.props.minScale - this.props.minScale / 2
    if (scale < minScaleLimit) {
      scale = minScaleLimit
    }
    if (scale > this.props.maxScale) {
      scale = this.props.maxScale
    }

    this.scale = scale
    this.positionX = isNumber(focalX) ? Number(focalX) : this.positionX
    this.positionY = isNumber(focalY) ? Number(focalY) : this.positionY

    // Если размер изображения меньше чем поле для зума
    // то сбрасываем оффсеты по вертикали/горизонтали в 0 (центрируем изображение)
    if (this.state.imageWidth * this.scale <= this.cropWidth) {
      this.positionX = 0
    }
    if (this.state.imageHeight * this.scale <= this.cropHeight) {
      this.positionY = 0
    }

    // Расчитываем максимально возможные смещения по горизонтали/вертикали
    const verticalMax = (this.state.imageHeight * this.scale - this.cropHeight) / 2 / this.scale
    const horizontalMax = (this.state.imageWidth * this.scale - this.cropWidth) / 2 / this.scale

    if (this.state.imageHeight * this.scale > this.cropHeight) {
      if (this.positionY < (-verticalMax)) {
        this.positionY = -verticalMax
      } else if (this.positionY > verticalMax) {
        this.positionY = verticalMax
      }
    }

    if (this.state.imageWidth * this.scale > this.cropWidth) {
      if (this.positionX < -horizontalMax) {
        this.positionX = -horizontalMax
      } else if (this.positionX > horizontalMax) {
        this.positionX = horizontalMax
      }
    }

    if (animated) {
      Animated.parallel([
        timingAnimation(this.animatedScale, scale),
        timingAnimation(this.animatedPositionX, this.positionX),
        timingAnimation(this.animatedPositionY, this.positionY)
      ]).start()
    } else {
      this.animatedScale.setValue(scale)
      this.animatedPositionX.setValue(this.positionX)
      this.animatedPositionY.setValue(this.positionY)
    }
    if (this.props.onScale) {
      this.props.onScale(this.scale)
    }
  }

  panTo = (x: number, y: number, animated?: boolean) => {
    this.positionX = x
    this.positionY = y
    if (animated) {
      Animated.parallel([
        timingAnimation(this.animatedPositionX, this.positionX),
        timingAnimation(this.animatedPositionY, this.positionY)
      ]).start()
    } else {
      this.animatedPositionX.setValue(this.positionX)
      this.animatedPositionY.setValue(this.positionY)
    }
  }

  getShortestDimension = () => Math.min(Dimensions.get('window').width, Dimensions.get('window').height)

  getNewImage = () => {
    const shortestDimension = this.getShortestDimension()
    this.getImageSize(this.props.url, ({width, height}) => {
      const aspectRatio = width / height
      let realWidth = width
      let realHeight = height
      if (width > Dimensions.get('window').width) {
        realWidth = Dimensions.get('window').width
        realHeight = realWidth * aspectRatio
      }

      // Если изображение вертикальное
      if (width < height || realHeight > Dimensions.get('window').height) {
        realHeight = Dimensions.get('window').height
        realWidth = realHeight / aspectRatio
      }

      if (!this.isCancelled) {
        this.setState({
          imageWidth: realWidth,
          imageHeight: realHeight
        })
      }
    }, () => {
      if (!this.isCancelled) {
        this.setState({
          imageWidth: shortestDimension,
          imageHeight: shortestDimension
        })
      }
    })
  }

  getImageSize = (
    uri: string,
    resolve: (dim: {width: number, height: number}) => any,
    reject?: (error: any) => any
  ) => {
    if (!uri) {
      if (this.props.defaultSource) {
        resolve({width: Dimensions.get('window').width, height: Dimensions.get('window').height})
      } else {
        resolve({width: 0, height: 0})
      }
    } else {
      Image.getSize(uri, (width: number, height: number) => resolve({width, height}), reject)
    }
  }

  handlePress = (evt: GestureEvent) => {
    if (evt.nativeEvent.changedTouches.length === 1) {
      const doubleClickX = evt.nativeEvent.pageX
      const doubleClickY = evt.nativeEvent.pageY
      if (Date.now() - this.lastClickTime < DOUBLE_CLICK_THRESHOLD) {
        if(this.scale > 1 || this.scale < 1) {
          this.setScale(1, 0, 0, true)
        } else {
          const beforeScale = this.scale
          this.scale = 2
          const diffScale = this.scale - beforeScale
          this.positionX = ((this.cropWidth / 2 - doubleClickX) * diffScale) / this.scale
          this.positionY = ((this.cropHeight / 2 - doubleClickY) * diffScale) / this.scale
          this.setScale(this.scale, this.positionX, this.positionY, true)
        }
      }
      this.lastClickTime = Date.now()
    }
  }

  render () {
    const {style, url, defaultSource} = this.props
    const {imageWidth, imageHeight} = this.state
    const animateConf = {
      zIndex: 5,
      transform: [
        {scale: this.animatedScale},
        {translateX: this.animatedPositionX},
        {translateY: this.animatedPositionY}
      ]
    }

    return <View style={[Style.container, style]} onLayout={this.handleLayout} {...this.imagePanResponder.panHandlers}>
      <TouchableWithoutFeedback
        onPress={this.handlePress}
        pressRetentionOffset={{top: 0, left: 0, bottom: 0, right: 0}}
      >
        <View style={Style.touchableContainer}>
          <Animated.View style={animateConf} renderToHardwareTextureAndroid>
            <Image
              resizeMode='contain'
              source={url && {uri: url}}
              defaultSource={defaultSource}
              style={{width: imageWidth, height: imageHeight}}
            />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  }
}

export default ZoomImage

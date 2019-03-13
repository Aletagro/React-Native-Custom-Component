// @flow

import {Platform, StyleSheet} from 'react-native'

export default StyleSheet.create({
  button: {
    ...Platform.select({
      ios: {
        top: 40,
        left: 10,
        aspectRatio: 1,
        flexDirection: 'row',
        alignItems: 'flex-end',
        position: 'absolute',
        zIndex: 9999
      },
      android: {
        left: 16,
        top: 32,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        zIndex: 9999
      }
    })
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    flex: 1
  },
  flexContainer: {
    flex: 1
  },
  backgroundOverlay: {
    flexGrow: 1,
    backgroundColor: '#000'
  },
  imageViewerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
    height: '100%'
  },
  touchableContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row'
  }
})

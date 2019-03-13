// @flow

import {StyleSheet, Platform} from 'react-native'
import Colors from '../../Themes/Colors'

export default StyleSheet.create({
  container: {
    marginRight: 8
  },
  size: {
    ...Platform.select({
      ios: {
        width: 49,
        height: 49
      },
      android: {
        width: 48,
        height: 48
      }
    })
  },
  border: {
    borderWidth: 2,
    borderColor: Colors.blue
  },
  inCart: {
    alignSelf: 'flex-start',
    position: 'absolute',
    backgroundColor: Colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        width: 20,
        height: 20
      },
      android: {
        width: 24,
        height: 24
      }
    })
  },
  inCartText: {
    color: Colors.white,
    ...Platform.select({
      ios: {
        fontSize: 10,
        letterSpacing: 0,
        textAlign: 'left'
      },
      android: {
        fontSize: 12,
        letterSpacing: 0.01
      }
    })
  }
})

import React from 'react';
import {ImageBackground, StyleSheet} from 'react-native';

const wallpaper = require('../../assets/chat_wallpaper.jpg');

const ChatWallpaper = ({children, style}) => (
  <ImageBackground
    source={wallpaper}
    resizeMode="cover"
    style={[styles.wall, style]}>
    {children}
  </ImageBackground>
);

export default ChatWallpaper;

const styles = StyleSheet.create({
  wall: {flex: 1, backgroundColor: '#F7E9D2'},
});

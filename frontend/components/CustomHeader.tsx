import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export default function CustomHeader() {
  return (
    <View style={styles.topHeader}>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => console.log('Menu pressed!')}
      >
        <Text>☰</Text>
      </TouchableOpacity>

      <View style={styles.logoContainer}>
        <View style={styles.logoSquare}></View>
      </View>

      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => console.log('Messages pressed!')}
      >
        <Text>💬</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  logoContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSquare: {
    width: 32,
    height: 32,
    backgroundColor: '#000',
    borderRadius: 3,
  },
  headerButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
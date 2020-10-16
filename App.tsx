/* eslint-disable react-native/no-inline-styles */
import React, {useEffect} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import NfcManager, {NfcEvents} from 'react-native-nfc-manager';

const Component = () => {
  useEffect(() => {
    NfcManager.start();
    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: any) => {
      console.warn('tag', tag);
      NfcManager.setAlertMessageIOS('I got your tag!');
      NfcManager.unregisterTagEvent().catch(() => 0);
    });

    return () => {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      NfcManager.unregisterTagEvent().catch(() => 0);
    };
  }, []);

  const onCancel = () => {
    NfcManager.unregisterTagEvent().catch(() => 0);
  };

  const onTest = async () => {
    try {
      await NfcManager.registerTagEvent();
    } catch (ex) {
      console.warn('ex', ex);
      NfcManager.unregisterTagEvent().catch(() => 0);
    }
  };

  return (
    <View
      style={{
        padding: 20,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text>NFC Demo</Text>
      <TouchableOpacity
        style={{
          padding: 10,
          width: 200,
          margin: 20,
          borderWidth: 1,
          borderColor: 'black',
        }}
        onPress={onTest}>
        <Text>Test</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          padding: 10,
          width: 200,
          margin: 20,
          borderWidth: 1,
          borderColor: 'black',
        }}
        onPress={onCancel}>
        <Text>Cancel Test</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Component;

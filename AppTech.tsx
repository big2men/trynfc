import React from 'react';
import { 
  View,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';

class AppV2Apdu extends React.Component {
  componentDidMount() {
    NfcManager.start();
  }

  componentWillUnmount() {
    this._cleanUp();
  }

  render() {
    return (
      <View style={{padding: 20}}>
        <Text>NFC Demo</Text>
        <TouchableOpacity 
          style={{padding: 10, width: 200, margin: 20, borderWidth: 1, borderColor: 'black'}}
          onPress={this._test}
        >
          <Text>Test</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{padding: 10, width: 200, margin: 20, borderWidth: 1, borderColor: 'black'}}
          onPress={this._cleanUp}
        >
          <Text>Cancel Test</Text>
        </TouchableOpacity>
      </View>
    )
  }

  _cleanUp = () => {
    NfcManager.cancelTechnologyRequest().catch(() => 0);
  }

  _test = async () => {
    try {
      let tech = [
        NfcTech.Ndef,
        NfcTech.NfcA,
        NfcTech.NfcB,
        NfcTech.NfcF,
        NfcTech.NfcV,
        NfcTech.IsoDep,
        NfcTech.MifareClassic,
        NfcTech.MifareUltralight,
        NfcTech.MifareIOS,
        NfcTech.Iso15693IOS,
        NfcTech.FelicaIOS,
      ];
      const techResp = await NfcManager.requestTechnology(tech, {
        alertMessage: 'Ready to detect technology'
      });

      console.log('tech: ', techResp);
      Alert.alert(`Technology`, techResp)

      // the NFC uid can be found in tag.id
      let tag = await NfcManager.getTag();
      console.warn(tag);

      this._cleanUp();
    } catch (ex) {
      console.warn('ex', ex);
      this._cleanUp();
    }
  }
}

export default AppV2Apdu;
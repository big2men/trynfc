import React from 'react';
import { 
  View,
  Text,
  TouchableOpacity,
  Platform,
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
      let tech = NfcTech.IsoDep;
      await NfcManager.requestTechnology(tech, {
        alertMessage: 'Ready to send some APDU'
      });

      // the NFC uid can be found in tag.id
      let tag = await NfcManager.getTag();
      console.warn(tag);

      let resp;
      if (Platform.OS === 'ios') {
        // here we assume AID A0000002471001 for ePassport
        // you will need to declare above AID in Info.plist like this:
        // ------------------------------------------------------------
	      //   <key>com.apple.developer.nfc.readersession.iso7816.select-identifiers</key>
	      //   <array>
	      //   	 <string>A0000002471001</string>
	      //   </array>
        // ------------------------------------------------------------
        // DriversLicense
        // Select MF
        // let adpu = NFCISO7816APDU(instructionClass: 0x00, instructionCode: 0xA4, p1Parameter: 0x00, p2Parameter: 0x00, data: Data([]), expectedResponseLength: -1)
        // Select DF1
        // let adpu = NFCISO7816APDU(instructionClass: 0x00, instructionCode: 0xA4, p1Parameter: 0x04, p2Parameter: 0x0C, data: Data([0xA0, 0x00, 0x00, 0x02, 0x31, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]), expectedResponseLength: -1)

        resp = await NfcManager.sendCommandAPDUIOS([0x00, 0xA4, 0x00, 0x00]);
        console.log(resp);
        /**
         * or, you can use alternative form like this:
           resp = await NfcManager.sendCommandAPDUIOS({
             cla: 0,
             ins: 0x84,
             p1: 0,
             p2: 0,
             data: [],
             le: 8
           });
         */
        if (resp.sw1 !== 0x90) {
          throw new Error('Error Select MF command');
        }

        // Select EF
        // let adpu = NFCISO7816APDU(instructionClass: 0x00, instructionCode: 0xA4, p1Parameter: 0x02, p2Parameter: 0x0C, data: Data(data), expectedResponseLength: -1)
        let afResp = await NfcManager.sendCommandAPDUIOS({
          cla: 0x00,
          ins: 0xA4,
          p1: 0x02,
          p2: 0x0C,
          data: [0x2F, 0x01],
          le: -1
        });
        console.log('SelectEF', afResp);

        if (afResp.sw1 !== 0x90) {
          throw new Error('Error Select EF command');
        }

        // Read Binary
        // let adpu = NFCISO7816APDU(instructionClass: 0x00, instructionCode: 0xB0, p1Parameter: p1Parameter, p2Parameter: p2Parameter, data: Data([]), expectedResponseLength: expectedResponseLength)
        let rbResp = await NfcManager.sendCommandAPDUIOS({
          cla: 0x00,
          ins: 0xB0,
          p1: 0x00,
          p2: 0x00,
          data: [],
          le: 17
        });
        console.log('Read Binary', rbResp);

        if (rbResp.sw1 !== 0x90) {
          throw new Error('Error Read Binary Command');
        }

        const data = rbResp.response;
        console.log('data: ', toHexString(data))
        console.log('data length: ', data.length)
        const fields: TLVField[] = [];
        let i = 0;
        while (i < data.length) {
          if (data[i] === 0xFF) {
            break
          }
          let tag = [data[i]]
          if (tag[0] === 0x5F) {
            i += 1
            tag.push(data[i])
          }
          i += 1
          let length = data[i]
          if (length === 0) {
            i += 1
            continue
          }
          if (length === 0x82) {
            i += 1
            length = data[i] << 8 + data[i+1]
            i += 1
          }
          i += 1
          let endIndex = i + length
          let value = data.slice(i, endIndex)
          console.log('length', length)
          console.log('value', toHexString(value))
          console.log('value length', value.length)
          i = endIndex

          fields.push({ tag, length, value })
          console.log('index:' + i.toString(), { tag, length, value });
        }

        console.log('fields', fields)

        let specificationVersionNumber: string | null = null;
        let issuanceDate: Date | null = null;
        let expirationDate: Date | null = null;
        let cardManufactureIdentifier: number | null = null;
        let cryptographicFunctionIdentifier: number | null = null;

        // 45, 46 タグは 2-4 の頁を参照
        // @see https://www.npa.go.jp/laws/notification/koutuu/menkyo/menkyo20190403_070.pdf
        fields.forEach(field => {
          switch (field.tag[0]) {
            case 0x45: {
              specificationVersionNumber = field.value.slice(0, 3).join('') //Todo: Data(x) -> shift_jis
              let issuanceDateString = field.value.slice(3, 7).join()
              console.log('issuanceDate: ', issuanceDateString)
              issuanceDate = new Date(issuanceDateString)
              let expirationDateString = field.value.slice(7, 11).join()
              console.log('expirationData: ', expirationDateString)
              expirationDate = new Date(expirationDateString)
              console.log({ issuanceDateString, expirationDateString })
              break;
            }
            case 0x46: {
              cardManufactureIdentifier = field.value[0]
              cryptographicFunctionIdentifier = field.value[1]
            }
            default: {
              break;
            }
          }
        });

        console.log({
          specificationVersionNumber,
          issuanceDate,
          expirationDate,
          cardManufactureIdentifier,
          cryptographicFunctionIdentifier,
        })

      } else {
        resp = await NfcManager.transceive([0x00, 0x8a]);
      }
      console.warn(resp);

      this._cleanUp();
    } catch (ex) {
      console.warn('ex', ex);
      this._cleanUp();
    }
  }
}

type TLVField = {
  tag: number[],
  length: number,
  value: number[]
}

function toHexString(ns: number[]): string {
  return ns.map(n => `0x${Number(n).toString(16)}`).join(', ');
}

export default AppV2Apdu;
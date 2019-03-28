/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {Platform, StyleSheet, Text, View, Button, ScrollView, TextInput } from 'react-native';
import { BleManager, BleError, Device, State } from "react-native-ble-plx";
import { throwStatement } from '@babel/types';

const instructions = Platform.select({
	 ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
	 android: '안드로이드 블루투스 테스트입니다.'
});

type Props = {
}

export default class App extends Component<Props> {
	 constructor(props) {
			super(props);
			this.bleManager = new BleManager()
			this.state = {
				 connectDevice: null,
				 devices: [],
				 services: [],
				 isFinish: false,
				 inputString: '',
				 sendString: '',
				 characteristics: []
			}
	 }
	 
	 handleScaning() {
			this.bleManager.startDeviceScan(null, {allowDuplicates: false}, (error, device) => {
				 if(error) {
						return;
				 }

				 const devices = this.state.devices;
				 let isUnique = true;
				 devices.forEach((_device, idx) => {
						if(_device.id == device.id) {
							 isUnique = false;
						}
				 })
				 if (isUnique)   devices.push(device);

				 this.setState({
						...this.state,
						services: [],
						devices
				 });
			});

			setTimeout(() => {
				 this.bleManager.stopDeviceScan();
			}, 3000);
	 }

	 handleDisconnect() {
			if(this.state.connectDevice) {
				 this.state.connectDevice.cancelConnection();
				 this.setState({...this.state, connectDevice: null});
			}
	 }

	 handleConnectDevice(device) {
			return async () => {
				this.bleManager.stopDeviceScan();
				const connectDevice = await device.connect();
				const results = await device.discoverAllServicesAndCharacteristics();

				const services = await this.bleManager.servicesForDevice(device.id)
				let characteristics = [];
				 
				for(let i = 0 ; i < services.length ; i+=1 ) 
				{
					const result = await this.bleManager.characteristicsForDevice(device.id, services[i].uuid);
					characteristics = characteristics.concat(result);
				}

				for(let i = 0 ; i < characteristics.length ; i+=1 ) {
					if(characteristics[i].isNotifiable) {
						this.bleManager.monitorCharacteristicForDevice(device.id, characteristics[i].serviceUUID, characteristics[i].uuid, (error, characteristic) => {
								if(error) { 
									console.log(error);
									return; 
								}
								let inputString = this.state.inputString;
								
								inputString += atob(characteristic.value);
								this.setState({...this.state, inputString});
						 })
					}
				}

				this.setState({...this.state, devices: [], connectDevice, characteristics});
			}
	 }
	 
	 handlerInputText(sendString) {
		this.setState({...this.state, sendString})
	 }
	
	 handleSendMessage(e) {
		 const characteristics = this.state.characteristics;
		 characteristics.forEach(async (value) => {
			if(value.isWritableWithResponse && value.uuid === "0000ffe1-0000-1000-8000-00805f9b34fb" ) {
				const result = await value.writeWithResponse(btoa(this.state.sendString));
				console.log(result);
				/* await this.bleManager.writeCharacteristicWithoutResponseForDevice(
					this.state.connectDevice.id,
					value.serviceUUID,
					"==w"
				); */

			}
		});
	 }

	 render() {
			return (
				 <View style={styles.container}>
						<Text style={styles.instructions}>{instructions}</Text>
						<Text>connected device : {
							 (() => {
									if( this.state.connectDevice ) {
										 return this.state.connectDevice.name;
									} else {
										 return "none";
									}
							 })()
						}</Text>
						<ScrollView style={styles.scroll}>
						{
							 this.state.devices.map((v, idx) => {
									const deviceName = v.name || "undefined";
									return (<Button
										 key={idx}
										 title={deviceName}
										 onPress={this.handleConnectDevice(v).bind(this)}
									/>);
							 })
						}
						</ScrollView>
						
						{
							 (() => {
									if( this.state.connectDevice ) {
										 return <Button
												title="연결끊기"
												onPress={this.handleDisconnect.bind(this)}
										 />;
									} else {
										 return <Button
												title="스캔"
												onPress={this.handleScaning.bind(this)}
										 />;
									}
							 })()
						}
						<Text>{this.state.inputString}</Text>
						<View style={styles.input}>
							<TextInput
								style={styles.textInput}
								editable = {true}
								onChangeText={this.handlerInputText.bind(this)}
								value={this.state.sendString}
								placeholder="input"
							/>
							<Button 
								onPress={this.handleSendMessage.bind(this)}
								title="전송!"
							/>
						</View>
				 </View>
			);
	 }
}

const styles = StyleSheet.create({
	 container: {
			flex: 1,
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: '#F5FCFF',
	 },
	 welcome: {
			fontSize: 20,
			textAlign: 'center',
			margin: 10,
	 },
	 instructions: {
			textAlign: 'center',
			color: '#333333',
			marginBottom: 5,
	 },
	 scroll: {
			flex: 1,
			flexDirection: "column"
			
	 },
	 input: {
		flexDirection: "row"
	 }
});
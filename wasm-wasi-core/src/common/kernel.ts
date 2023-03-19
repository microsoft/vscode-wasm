/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Uri } from 'vscode';

import { DeviceDriver, DeviceId } from './deviceDriver';
import { Errno, WasiError } from './wasi';
import * as ConsoleDriver from './consoleDriver';

export interface DeviceDrivers {
	next(): DeviceId;
	add(driver: DeviceDriver): void;
	has (id: DeviceId): boolean;
	hasByUri(uri: Uri): boolean;
	get(id: DeviceId): DeviceDriver;
	getByUri(uri: Uri): DeviceDriver;
	remove(id: DeviceId): void;
	removeByUri(uri: Uri): void;
}

let deviceCounter: DeviceId = 1n;

class DeviceDriversImpl {

	private readonly devices: Map<DeviceId, DeviceDriver>;
	private readonly devicesByUri: Map<string, DeviceDriver>;

	public constructor() {
		this.devices = new Map();
		this.devicesByUri = new Map();
	}

	public next(): DeviceId {
		return deviceCounter++;
	}

	public add(driver: DeviceDriver): void {
		this.devices.set(driver.id, driver);
		this.devicesByUri.set(driver.uri.toString(true), driver);
	}

	public has (id: DeviceId): boolean {
		return this.devices.has(id);
	}

	public hasByUri(uri: Uri): boolean {
		return this.devicesByUri.has(uri.toString(true));
	}

	public get(id: DeviceId): DeviceDriver {
		const driver = this.devices.get(id);
		if (driver === undefined) {
			throw new WasiError(Errno.nxio);
		}
		return driver;
	}

	public getByUri(uri: Uri): DeviceDriver {
		const driver = this.devicesByUri.get(uri.toString(true));
		if (driver === undefined) {
			throw new WasiError(Errno.nxio);
		}
		return driver;
	}

	public remove(id: DeviceId): void {
		const driver = this.devices.get(id);
		if (driver === undefined) {
			throw new WasiError(Errno.nxio);
		}
		this.devices.delete(id);
		this.devicesByUri.delete(driver.uri.toString(true));
	}

	public removeByUri(uri: Uri): void {
		const key = uri.toString(true);
		const driver = this.devicesByUri.get(key);
		if (driver === undefined) {
			throw new WasiError(Errno.nxio);
		}
		this.devices.delete(driver.id);
		this.devicesByUri.delete(key);
	}
}

class LocalDeviceDrivers implements DeviceDrivers {

	private readonly nextDrivers: DeviceDrivers;
	private readonly devices: Map<DeviceId, DeviceDriver>;
	private readonly devicesByUri: Map<string, DeviceDriver>;

	public constructor(next: DeviceDrivers) {
		this.nextDrivers = next;
		this.devices = new Map();
		this.devicesByUri = new Map();
	}

	public next(): bigint {
		return this.nextDrivers.next();
	}

	public add(driver: DeviceDriver): void {
		this.devices.set(driver.id, driver);
		this.devicesByUri.set(driver.uri.toString(true), driver);
	}

	public has(id: bigint): boolean {
		if (this.nextDrivers.has(id)) {
			return true;
		}
		return this.devices.has(id);
	}

	public hasByUri(uri: Uri): boolean {
		if (this.nextDrivers.hasByUri(uri)) {
			return true;
		}
		return this.devicesByUri.has(uri.toString(true));
	}

	public get(id: bigint): DeviceDriver {
		const result = this.devices.get(id);
		if (result !== undefined) {
			return result;
		}
		return this.nextDrivers.get(id);
	}

	public getByUri(uri: Uri): DeviceDriver {
		const result = this.devicesByUri.get(uri.toString(true));
		if (result !== undefined) {
			return result;
		}
		return this.nextDrivers.getByUri(uri);
	}

	public remove(id: bigint): void {
		const driver = this.devices.get(id);
		if (driver !== undefined) {
			this.devices.delete(id);
			this.devicesByUri.delete(driver.uri.toString(true));
			return;
		}
		this.nextDrivers.remove(id);
	}

	public removeByUri(uri: Uri): void {
		const key = uri.toString(true);
		const driver = this.devicesByUri.get(key);
		if (driver !== undefined) {
			this.devices.delete(driver.id);
			this.devicesByUri.delete(key);
			return;
		}
		this.nextDrivers.removeByUri(uri);
	}
}

namespace WasiKernel {
	export const deviceDrivers = new DeviceDriversImpl();
	export const console = ConsoleDriver.create(deviceDrivers.next());
	deviceDrivers.add(console);
	export function createLocalDeviceDrivers(): DeviceDrivers {
		return new LocalDeviceDrivers(deviceDrivers);
	}
}

export default WasiKernel;
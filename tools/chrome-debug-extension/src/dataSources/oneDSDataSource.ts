// -----------------------------------------------------------------------
// <copyright company="Microsoft Corporation">
// Copyright (c) Microsoft Corporation. All rights reserved.
// </copyright>
// -----------------------------------------------------------------------

import { IDataEvent } from './IDataEvent';
import { IDataSource } from './IDataSource';

export class OneDSDataSource implements IDataSource {
  private readonly listeners: Map<number, (newDataEvent: IDataEvent) => void> = new Map();
  private nextListenerId: number = 0;

  constructor() {}

  public startListening = (): void => {
    chrome.runtime.onMessage.addListener(this.onMessageReceived);
  };

  public stopListening = (): void => {
    chrome.runtime.onMessage.removeListener(this.onMessageReceived);
  };

  public addListener = (callback: (newDataEvent: IDataEvent) => void): number => {
    this.listeners.set(this.nextListenerId, callback);
    return this.nextListenerId++;
  };

  public removeListener = (id: number): boolean => {
    return this.listeners.delete(id);
  };

  private onMessageReceived = (dataName: any, sender: any, sendResponse: any): void => {
    console.log(`Received message: ${dataName}`);
    if (dataName) {
      // tslint:disable-next-line:no-any
      this.listeners.forEach((listener: (newEvent: any) => void) => {
        listener({ name: dataName, time: 'whenever', data: {} });
      });
    }
  }
}
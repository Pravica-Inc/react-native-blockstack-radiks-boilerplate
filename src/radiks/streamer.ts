import EventEmitter from 'wolfy87-eventemitter';

import { getConfig } from './config';

const EVENT_NAME = 'RADIKS_STREAM_MESSAGE';

export default class Streamer {
  public static initialized: boolean;
  public static socket: WebSocket;
  public static emitter: EventEmitter;

  public static init() {
    if (this.initialized) {
      return this.socket;
    }
    const { apiServer } = getConfig();
    const protocol = 'wss';
    // eslint-disable-next-line no-undef
    const socket = new WebSocket(
      `${protocol}://${apiServer.replace(/^https?:\/\//, '')}/radiks/stream/`,
    );
    this.emitter = new EventEmitter();
    this.socket = socket;
    this.initialized = true;
    socket.onmessage = event => {
      this.emitter.emit(EVENT_NAME, [event]);
    };
    return socket;
  }

  public static addListener(callback: (args: any[]) => void) {
    this.init();
    this.emitter.addListener(EVENT_NAME, callback);
  }

  public static removeListener(callback: any) {
    this.init();
    this.emitter.removeListener(EVENT_NAME, callback);
  }
}

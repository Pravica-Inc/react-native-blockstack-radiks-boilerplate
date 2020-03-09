declare module 'wolfy87-eventemitter' {
  export default class EventEmitter {
    public getListeners: () => [];
    public addListener: (key: string, callback: any) => void;
    public removeListener: (key: string, callback: any) => void;
    public emit: (key: string, args: any[]) => void;
  }
}

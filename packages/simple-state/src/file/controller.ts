import {
  promises as fsPromises,
  constants as fsConstants,
  watch,
  FSWatcher,
} from 'fs';
import { makeClassProvider } from '@machinat/core/service';
import type { MachinatUser, MachinatChannel } from '@machinat/core/types';
import Base from '@machinat/core/base';
import type {
  BaseStateController,
  StateAccessor,
} from '@machinat/core/base/StateControllerI';
import { MODULE_CONFIGS_I, SerializerI } from './interface';
import type { FileRepositoryConfigs } from './types';

type FileHandle = fsPromises.FileHandle;

const {
  /** @ignore */
  O_RDWR,
  /** @ignore */
  O_CREAT,
} = fsConstants;

/** @ignore */
const openFile = fsPromises.open;

/** @internal */
const objectHasOwnProperty = (obj, prop) =>
  Object.prototype.hasOwnProperty.call(obj, prop);

export class FileStateAccessor implements StateAccessor {
  private _marshaler: Base.Marshaler;
  private _getData: () => Promise<Record<string, any>>;
  private _updateData: (data: null | Record<string, any>) => void;

  constructor(
    marshaler: Base.Marshaler,
    getData: () => Promise<Record<string, any>>,
    updateData: (data: null | Record<string, any>) => void
  ) {
    this._marshaler = marshaler;
    this._getData = getData;
    this._updateData = updateData;
  }

  async get<T>(key: string): Promise<undefined | T> {
    const data = await this._getData();
    return this._marshaler.unmarshal(data[key]);
  }

  async set<T>(key: string, value: T): Promise<boolean> {
    const data = await this._getData();
    const isExisted = objectHasOwnProperty(data, key);
    data[key] = this._marshaler.marshal(value);

    this._updateData(data);
    return isExisted;
  }

  async update<T>(
    key: string,
    updator: (value: undefined | T) => undefined | T
  ): Promise<boolean> {
    const data = await this._getData();
    const currentValue = this._marshaler.unmarshal(data[key]);
    data[key] = this._marshaler.marshal(updator(currentValue));

    this._updateData(data);
    return !!currentValue;
  }

  async getAll(): Promise<Map<string, any>> {
    const data = await this._getData();
    return new Map(
      Object.entries(data).map(([key, value]) => [
        key,
        this._marshaler.unmarshal(value),
      ])
    );
  }

  async delete(key: string): Promise<boolean> {
    const data = await this._getData();
    if (objectHasOwnProperty(data, key)) {
      delete data[key];

      this._updateData(Object.keys(data).length === 0 ? null : data);
      return true;
    }

    return false;
  }

  async clear(): Promise<number> {
    const data = await this._getData();
    this._updateData(null);
    return Object.keys(data).length;
  }
}

type StorageObj = {
  [key: string]: {
    [key: string]: any;
  };
};

type StorageData = {
  channelStates: StorageObj;
  userStates: StorageObj;
  globalStates: StorageObj;
};

const identity = (x) => x;
/**
 * @category Provider
 */
export class FileStateController implements BaseStateController {
  path: string;
  marshaler: Base.Marshaler;
  serializer: SerializerI;

  private _storage: StorageData;
  private _fileHandle: FileHandle;
  private _watcher: FSWatcher;

  private _readingJob: Promise<void>;
  private _writingJob: Promise<void>;
  private _isWriting: boolean;

  constructor(
    options: FileRepositoryConfigs,
    marshaler?: null | Base.Marshaler,
    serializer?: null | SerializerI
  ) {
    this.path = options.path;
    this.marshaler = marshaler || { marshal: identity, unmarshal: identity };
    this.serializer = serializer || JSON;

    this._readingJob = this._open();
    this._writingJob = Promise.resolve();
  }

  channelState(channel: MachinatChannel): FileStateAccessor {
    return new FileStateAccessor(
      this.marshaler,
      this._getDataCallback('channelStates', channel.uid),
      this._updateDataCallback('channelStates', channel.uid)
    );
  }

  userState(user: MachinatUser): FileStateAccessor {
    return new FileStateAccessor(
      this.marshaler,
      this._getDataCallback('userStates', user.uid),
      this._updateDataCallback('userStates', user.uid)
    );
  }

  globalState(name: string): FileStateAccessor {
    return new FileStateAccessor(
      this.marshaler,
      this._getDataCallback('globalStates', name),
      this._updateDataCallback('globalStates', name)
    );
  }

  private _getDataCallback(type: string, id: string) {
    return async () => {
      await this._readingJob;
      return this._storage[type][id] || {};
    };
  }

  private _updateDataCallback(type: string, id: string) {
    return (value) => {
      if (value) {
        this._storage[type][id] = value;
      } else {
        delete this._storage[type][id];
      }

      this._registerWriteData();
    };
  }

  private async _open(): Promise<void> {
    if (this._fileHandle) {
      await this._fileHandle.close();
      this._watcher.close();
    }

    this._fileHandle = await openFile(this.path, O_RDWR | O_CREAT);
    this._watcher = watch(this.path, { persistent: false }, () => {
      if (!this._isWriting) {
        this._readingJob = this._open();
      }
    });

    const content = await this._fileHandle.readFile('utf8');
    if (content === '') {
      this._storage = {
        channelStates: {},
        userStates: {},
        globalStates: {},
      };
      this._registerWriteData();
    } else {
      this._storage = this.serializer.parse(content);
    }
  }

  private async _writeData(): Promise<void> {
    this._isWriting = true;
    const content = this.serializer.stringify(this._storage);

    await this._fileHandle.truncate();
    await this._fileHandle.write(content, 0);

    this._isWriting = false;
  }

  private _registerWriteData() {
    this._writingJob = this._writingJob.then(() => this._writeData());
  }
}

export const ControllerP = makeClassProvider({
  lifetime: 'singleton',
  deps: [
    MODULE_CONFIGS_I,
    { require: Base.Marshaler, optional: true },
    { require: SerializerI, optional: true },
  ] as const,
})(FileStateController);

export type ControllerP = FileStateController;

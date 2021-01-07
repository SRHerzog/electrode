/* eslint-disable no-use-before-define */

export type CDNData = {
  /** mapping data */
  md: Record<string, any>;
};

export type _xarcV2RunTimeInfo = {
  instId: number;
  subApps: Record<string, any>;
  onLoadStart: Record<string, any>;
  started: boolean;
  /** CDN mapping data */
  md: Record<string, any>;
};

/**
 * xarc subapp version client interface
 */
export interface XarcSubAppClientV2 {
  IS_BROWSER: boolean;
  HAS_WINDOW: boolean;
  version: number;
  rt: _xarcV2RunTimeInfo; // run time info
  /**
   * Initialize CDN mapping
   * @param data - data to initialize with
   */
  cdnInit(data: CDNData): void;
  /**
   * Add CDN mapping data from data into the CDN mapping for looking up assets
   * @param data - CDN data
   * @param replace - replace existing entry?
   */
  cdnUpdate(data: CDNData, replace: boolean): void;
  /**
   * Map an asset name to its CDN version
   *
   * @param name - asset name to map
   */
  cdnMap(name: string): string;
  getOnLoadStart(name: string): any[];
  addOnLoadStart(name: string, load: any): void;
  startSubAppOnLoad(options: any, data: any): void;
  start(): Promise<any>;
  _start(ignore: string[], callDepth: number): Promise<any>;
  /**
   * Need this for node.js.  While chrome dev tools allow setting console level, node.js'
   * console.debug is just an alias for console.log.
   */
  debug(...args: any[]): void;
  /**
   * Extract JSON data from a script tag
   * @param id - script element id
   * @returns the data extracted
   */
  dyn(id: string): unknown;
}

/**
 * Options for calling declareSubApp
 */
export type SubAppOptions = {
  /**
   * Name of the subapp
   *
   * - This will be used to name the JS bundle
   * - It must follow valid filename format, avoid space and special characters
   *
   */
  name: string;

  /**
   * The dynamic import promise for the subapp's module, or a function that returns it
   */
  getModule: Promise<any> | (() => Promise<any>);

  /**
   * The name of the export for the subapp from the module.
   *
   * - default to `subapp`
   * - then `default`
   * - If it's `false`, then this subapp is treated as having no UI logic.
   *
   */
  resolveName?: string | false;

  /**
   * _optional_ webpack bundle name for the subapp
   *
   * - By default, xarc will create one like `"subapp-<name>"`
   * - Use this if you want to override it, such as to combine multiple subapps
   *   a single bundle.
   */
  bundleName?: string;

  /**
   * Extra features that the subapp wants.  Should be initialized with the feature provider function
   *
   * - The intent is to allow a module to provide one or more features for a subapp.
   *
   * - Typically the feature needs to have implementation for server and client side, and exposed
   *   through the main/browser fields in package.json.
   *
   * - The feature is access through an API function.  The API should return another
   *   function to be called by the subapp system later, and the subapp's info will be
   *   passed.
   */
  wantFeatures?: SubAppFeatureFactory[];

  /**
   * File name of the module that declares the subapp.
   *
   * - Only required for server side rendering (SSR).
   * - Typically just set it to `__filename`, which webpack set to `"/<file>"` for client side bundle.
   * - If not set, then xarc will figure it out through webpack compiling.
   * - But webpack compiling is not 100%, so setting it yourself guarantees it.
   *
   */
  __filename?: string;
};

/**
 * definition of a subapp from declareSubApp
 */
export type SubAppDef = SubAppOptions & {
  /**
   * unique instance ID, if a subapp with same name is re-declared then it will have a diff _id
   */
  _id: number;
  _getModule: () => Promise<any>;
  _module: any;
  _ssr: boolean;
  /**
   * SubApp's start method that declareSubApp will create, with versions
   * for browser or node.js.
   *
   * - Browser: the browser subapp shell will call this from start.
   * - Node.js: load-v2.ts in node dir will call this during SSR.
   *
   * @param options
   */
  _start?(options?: SubAppStartOptions): Promise<any>;
  _startOptions?: SubAppStartOptions;
  /** The UI component instance that this subapp started on */
  _startComponent?: any;
  _reload?(subAppName: string, modName?: string): Promise<any>;
  _features?: Record<string, SubAppFeature>;
  _frameworkFactory?: () => FrameworkLib;
  /** For UI component instance to let the subapp know it's mounting to the subapp */
  _mount?(info: SubAppMountInfo): void;
  /** For UI component instance to let the subapp know it's unmounting from the subapp */
  _unmount?(info: SubAppMountInfo): void;
};

/**
 * Declare what info a subapp feature should have
 */
export type SubAppFeatureInfo = {
  /**
   * Unique ID to identify the feature.  There could be multiple implementations of a feature
   */
  id: string;

  /**
   * sub id to identify a particular implementation of a feature.
   *
   */
  subId?: string;
};

/**
 * Declare a subapp feature factory
 */
export interface ISubAppFeatureFactory {
  /**
   * Function to add the feature to a subapp definition
   */
  add: (subappDef: SubAppDef) => SubAppDef;
}

/**
 * What a subapp feature should provide
 */
export type SubAppFeatureFactory = ISubAppFeatureFactory & SubAppFeatureInfo;

export type SubAppFeatureResult = {
  Component?: any;
  props?: any;
};

export type SubAppFeatureExecuteParams = {
  input: SubAppFeatureResult;
  startOptions?: SubAppStartOptions;
  reload?: boolean;
  ssrData?: SubAppSSRData;
};

/**
 * Declare the implementation of a subapp feature
 */
export interface ISubAppFeature {
  /**
   * execute the feature for the subapp
   */
  execute(param: SubAppFeatureExecuteParams): SubAppFeatureResult | Promise<SubAppFeatureResult>;
}

export type SubAppFeature = ISubAppFeature & SubAppFeatureInfo;

export type LoadSubAppOptions = {
  /**
   * Name of the subapp to load
   */
  name: string;

  /**
   * Enable server side rendering for the subapp
   */
  ssr?: boolean;

  /**
   * group the subapp belongs to
   */
  group?: string;
};

export type SubAppStartOptions = LoadSubAppOptions & {
  element?: Element;
  elementId?: string;
  getInitialState?(): any;
};

/**
 * For a UI component to let the subapp know it has mount itself for the subapp
 */
export type SubAppMountInfo = {
  /** The UI component instance that's mount to the subapp */
  component: any;
  /** The subapp that the UI component instance mount to */
  subapp: SubAppDef;
};

/**
 * A subapp
 */
export type SubApp<ComponentType> = {
  /**
   * The component for this subapp.
   *
   * If it's undefined, then this subapp is treated to have no UI component
   *
   */
  Component?: ComponentType;

  /**
   * Extra features that the subapp wants.  Should be initialized with the feature provider function
   *
   * - The intent is to allow a module to provide one or more features for a subapp.
   *
   * - Typically the feature needs to have implementation for server and client side, and exposed
   *   through the main/browser fields in package.json.
   *
   * - The feature is access through an API function.  The API should return another
   *   function to be called by the subapp system later, and the subapp's info will be
   *   passed.
   */
  wantFeatures?: SubAppFeatureFactory[];
};

/**
 * container of declared subapps
 */
export class SubAppContainer {
  readyCount: number;
  declareCount: number;
  $: Record<string, SubAppDef>;

  constructor(store: Record<string, SubAppDef>) {
    this.readyCount = this.declareCount = 0;
    this.$ = store;
  }

  get(name: string): SubAppDef {
    return this.$[name];
  }

  declare(name: string, subapp: SubAppDef): SubAppDef {
    this.$[name] = subapp;
    this.declareCount = this.getNames().length;
    this.updateReady();
    return subapp;
  }

  isReady() {
    return this.readyCount === this.declareCount;
  }

  updateReady() {
    this.readyCount = 0;
    for (const name in this.$) {
      if (this.$[name]._module) {
        this.readyCount++;
      }
    }
  }

  getNames() {
    return Object.keys(this.$);
  }
}

/**
 * potential data for doing server side rendering
 */
export type SubAppSSRData = {
  context: any;
  subapp: SubAppDef;
  props?: any;
  request?: any;
  path?: string;
  params?: Record<string, string>;
  query?: Record<string, string>;
};

/**
 * result of server side rendering
 */
export type SubAppSSRResult = {
  /**
   * content of the rendering
   * TODO: types - could be string or a stream
   */
  content: any;

  /**
   * initialState props
   */
  props: any;
};

/**
 * Allow specific UI framework to be configured
 *
 * TBD
 */
export interface FrameworkLib {
  // TODO: what goes here?
  // 1. Browser side startup and render
  // 2. Server side rendering
  renderStart?(): void;

  renderToString?(Component: unknown): string;

  handleSSR?(data: SubAppSSRData): any;

  startSubApp?(def: SubAppDef, options: SubAppStartOptions, reload?: boolean): Promise<any>;
}
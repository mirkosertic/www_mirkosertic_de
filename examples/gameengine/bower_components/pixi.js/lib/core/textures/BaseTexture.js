'use strict';

exports.__esModule = true;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _utils = require('../utils');

var _settings = require('../settings');

var _settings2 = _interopRequireDefault(_settings);

var _eventemitter = require('eventemitter3');

var _eventemitter2 = _interopRequireDefault(_eventemitter);

var _determineCrossOrigin = require('../utils/determineCrossOrigin');

var _determineCrossOrigin2 = _interopRequireDefault(_determineCrossOrigin);

var _bitTwiddle = require('bit-twiddle');

var _bitTwiddle2 = _interopRequireDefault(_bitTwiddle);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * A texture stores the information that represents an image. All textures have a base texture.
 *
 * @class
 * @extends EventEmitter
 * @memberof PIXI
 */
var BaseTexture = function (_EventEmitter) {
    _inherits(BaseTexture, _EventEmitter);

    /**
     * @param {HTMLImageElement|HTMLCanvasElement} [source] - the source object of the texture.
     * @param {number} [scaleMode=PIXI.settings.SCALE_MODE] - See {@link PIXI.SCALE_MODES} for possible values
     * @param {number} [resolution=1] - The resolution / device pixel ratio of the texture
     */
    function BaseTexture(source, scaleMode, resolution) {
        _classCallCheck(this, BaseTexture);

        var _this = _possibleConstructorReturn(this, _EventEmitter.call(this));

        _this.uid = (0, _utils.uid)();

        _this.touched = 0;

        /**
         * The resolution / device pixel ratio of the texture
         *
         * @member {number}
         * @default 1
         */
        _this.resolution = resolution || _settings2.default.RESOLUTION;

        /**
         * The width of the base texture set when the image has loaded
         *
         * @readonly
         * @member {number}
         */
        _this.width = 100;

        /**
         * The height of the base texture set when the image has loaded
         *
         * @readonly
         * @member {number}
         */
        _this.height = 100;

        // TODO docs
        // used to store the actual dimensions of the source
        /**
         * Used to store the actual width of the source of this texture
         *
         * @readonly
         * @member {number}
         */
        _this.realWidth = 100;
        /**
         * Used to store the actual height of the source of this texture
         *
         * @readonly
         * @member {number}
         */
        _this.realHeight = 100;

        /**
         * The scale mode to apply when scaling this texture
         *
         * @member {number}
         * @default PIXI.settings.SCALE_MODE
         * @see PIXI.SCALE_MODES
         */
        _this.scaleMode = scaleMode || _settings2.default.SCALE_MODE;

        /**
         * Set to true once the base texture has successfully loaded.
         *
         * This is never true if the underlying source fails to load or has no texture data.
         *
         * @readonly
         * @member {boolean}
         */
        _this.hasLoaded = false;

        /**
         * Set to true if the source is currently loading.
         *
         * If an Image source is loading the 'loaded' or 'error' event will be
         * dispatched when the operation ends. An underyling source that is
         * immediately-available bypasses loading entirely.
         *
         * @readonly
         * @member {boolean}
         */
        _this.isLoading = false;

        /**
         * The image source that is used to create the texture.
         *
         * TODO: Make this a setter that calls loadSource();
         *
         * @readonly
         * @member {HTMLImageElement|HTMLCanvasElement}
         */
        _this.source = null; // set in loadSource, if at all

        /**
         * The image source that is used to create the texture. This is used to
         * store the original Svg source when it is replaced with a canvas element.
         *
         * TODO: Currently not in use but could be used when re-scaling svg.
         *
         * @readonly
         * @member {Image}
         */
        _this.origSource = null; // set in loadSvg, if at all

        /**
         * Type of image defined in source, eg. `png` or `svg`
         *
         * @readonly
         * @member {string}
         */
        _this.imageType = null; // set in updateImageType

        /**
         * Scale for source image. Used with Svg images to scale them before rasterization.
         *
         * @readonly
         * @member {number}
         */
        _this.sourceScale = 1.0;

        /**
         * Controls if RGB channels should be pre-multiplied by Alpha  (WebGL only)
         * All blend modes, and shaders written for default value. Change it on your own risk.
         *
         * @member {boolean}
         * @default true
         */
        _this.premultipliedAlpha = true;

        /**
         * The image url of the texture
         *
         * @member {string}
         */
        _this.imageUrl = null;

        /**
         * Whether or not the texture is a power of two, try to use power of two textures as much
         * as you can
         *
         * @private
         * @member {boolean}
         */
        _this.isPowerOfTwo = false;

        // used for webGL

        /**
         *
         * Set this to true if a mipmap of this texture needs to be generated. This value needs
         * to be set before the texture is used
         * Also the texture must be a power of two size to work
         *
         * @member {boolean}
         * @see PIXI.MIPMAP_TEXTURES
         */
        _this.mipmap = _settings2.default.MIPMAP_TEXTURES;

        /**
         *
         * WebGL Texture wrap mode
         *
         * @member {number}
         * @see PIXI.WRAP_MODES
         */
        _this.wrapMode = _settings2.default.WRAP_MODE;

        /**
         * A map of renderer IDs to webgl textures
         *
         * @private
         * @member {object<number, WebGLTexture>}
         */
        _this._glTextures = {};

        _this._enabled = 0;
        _this._virtalBoundId = -1;

        // if no source passed don't try to load
        if (source) {
            _this.loadSource(source);
        }

        /**
         * Fired when a not-immediately-available source finishes loading.
         *
         * @protected
         * @event loaded
         * @memberof PIXI.BaseTexture#
         */

        /**
         * Fired when a not-immediately-available source fails to load.
         *
         * @protected
         * @event error
         * @memberof PIXI.BaseTexture#
         */
        return _this;
    }

    /**
     * Updates the texture on all the webgl renderers, this also assumes the src has changed.
     *
     * @fires update
     */


    BaseTexture.prototype.update = function update() {
        // Svg size is handled during load
        if (this.imageType !== 'svg') {
            this.realWidth = this.source.naturalWidth || this.source.videoWidth || this.source.width;
            this.realHeight = this.source.naturalHeight || this.source.videoHeight || this.source.height;

            this.width = this.realWidth / this.resolution;
            this.height = this.realHeight / this.resolution;

            this.isPowerOfTwo = _bitTwiddle2.default.isPow2(this.realWidth) && _bitTwiddle2.default.isPow2(this.realHeight);
        }

        this.emit('update', this);
    };

    /**
     * Load a source.
     *
     * If the source is not-immediately-available, such as an image that needs to be
     * downloaded, then the 'loaded' or 'error' event will be dispatched in the future
     * and `hasLoaded` will remain false after this call.
     *
     * The logic state after calling `loadSource` directly or indirectly (eg. `fromImage`, `new BaseTexture`) is:
     *
     *     if (texture.hasLoaded) {
     *        // texture ready for use
     *     } else if (texture.isLoading) {
     *        // listen to 'loaded' and/or 'error' events on texture
     *     } else {
     *        // not loading, not going to load UNLESS the source is reloaded
     *        // (it may still make sense to listen to the events)
     *     }
     *
     * @protected
     * @param {HTMLImageElement|HTMLCanvasElement} source - the source object of the texture.
     */


    BaseTexture.prototype.loadSource = function loadSource(source) {
        var _this2 = this;

        var wasLoading = this.isLoading;

        this.hasLoaded = false;
        this.isLoading = false;

        if (wasLoading && this.source) {
            this.source.onload = null;
            this.source.onerror = null;
        }

        var firstSourceLoaded = !this.source;

        this.source = source;

        // Apply source if loaded. Otherwise setup appropriate loading monitors.
        if ((source.src && source.complete || source.getContext) && source.width && source.height) {
            this._updateImageType();

            if (this.imageType === 'svg') {
                this._loadSvgSource();
            } else {
                this._sourceLoaded();
            }

            if (firstSourceLoaded) {
                // send loaded event if previous source was null and we have been passed a pre-loaded IMG element
                this.emit('loaded', this);
            }
        } else if (!source.getContext) {
            var _ret = function () {
                // Image fail / not ready
                _this2.isLoading = true;

                var scope = _this2;

                source.onload = function () {
                    scope._updateImageType();
                    source.onload = null;
                    source.onerror = null;

                    if (!scope.isLoading) {
                        return;
                    }

                    scope.isLoading = false;
                    scope._sourceLoaded();

                    if (scope.imageType === 'svg') {
                        scope._loadSvgSource();

                        return;
                    }

                    scope.emit('loaded', scope);
                };

                source.onerror = function () {
                    source.onload = null;
                    source.onerror = null;

                    if (!scope.isLoading) {
                        return;
                    }

                    scope.isLoading = false;
                    scope.emit('error', scope);
                };

                // Per http://www.w3.org/TR/html5/embedded-content-0.html#the-img-element
                //   "The value of `complete` can thus change while a script is executing."
                // So complete needs to be re-checked after the callbacks have been added..
                // NOTE: complete will be true if the image has no src so best to check if the src is set.
                if (source.complete && source.src) {
                    // ..and if we're complete now, no need for callbacks
                    source.onload = null;
                    source.onerror = null;

                    if (scope.imageType === 'svg') {
                        scope._loadSvgSource();

                        return {
                            v: void 0
                        };
                    }

                    _this2.isLoading = false;

                    if (source.width && source.height) {
                        _this2._sourceLoaded();

                        // If any previous subscribers possible
                        if (wasLoading) {
                            _this2.emit('loaded', _this2);
                        }
                    }
                    // If any previous subscribers possible
                    else if (wasLoading) {
                            _this2.emit('error', _this2);
                        }
                }
            }();

            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        }
    };

    /**
     * Updates type of the source image.
     */


    BaseTexture.prototype._updateImageType = function _updateImageType() {
        if (!this.imageUrl) {
            return;
        }

        var dataUri = (0, _utils.decomposeDataUri)(this.imageUrl);
        var imageType = void 0;

        if (dataUri && dataUri.mediaType === 'image') {
            // Check for subType validity
            var firstSubType = dataUri.subType.split('+')[0];

            imageType = (0, _utils.getUrlFileExtension)('.' + firstSubType);

            if (!imageType) {
                throw new Error('Invalid image type in data URI.');
            }
        } else {
            imageType = (0, _utils.getUrlFileExtension)(this.imageUrl);

            if (!imageType) {
                imageType = 'png';
            }
        }

        this.imageType = imageType;
    };

    /**
     * Checks if `source` is an SVG image and whether it's loaded via a URL or a data URI. Then calls
     * `_loadSvgSourceUsingDataUri` or `_loadSvgSourceUsingXhr`.
     */


    BaseTexture.prototype._loadSvgSource = function _loadSvgSource() {
        if (this.imageType !== 'svg') {
            // Do nothing if source is not svg
            return;
        }

        var dataUri = (0, _utils.decomposeDataUri)(this.imageUrl);

        if (dataUri) {
            this._loadSvgSourceUsingDataUri(dataUri);
        } else {
            // We got an URL, so we need to do an XHR to check the svg size
            this._loadSvgSourceUsingXhr();
        }
    };

    /**
     * Reads an SVG string from data URI and then calls `_loadSvgSourceUsingString`.
     *
     * @param {string} dataUri - The data uri to load from.
     */


    BaseTexture.prototype._loadSvgSourceUsingDataUri = function _loadSvgSourceUsingDataUri(dataUri) {
        var svgString = void 0;

        if (dataUri.encoding === 'base64') {
            if (!atob) {
                throw new Error('Your browser doesn\'t support base64 conversions.');
            }
            svgString = atob(dataUri.data);
        } else {
            svgString = dataUri.data;
        }

        this._loadSvgSourceUsingString(svgString);
    };

    /**
     * Loads an SVG string from `imageUrl` using XHR and then calls `_loadSvgSourceUsingString`.
     */


    BaseTexture.prototype._loadSvgSourceUsingXhr = function _loadSvgSourceUsingXhr() {
        var _this3 = this;

        var svgXhr = new XMLHttpRequest();

        // This throws error on IE, so SVG Document can't be used
        // svgXhr.responseType = 'document';

        // This is not needed since we load the svg as string (breaks IE too)
        // but overrideMimeType() can be used to force the response to be parsed as XML
        // svgXhr.overrideMimeType('image/svg+xml');

        svgXhr.onload = function () {
            if (svgXhr.readyState !== svgXhr.DONE || svgXhr.status !== 200) {
                throw new Error('Failed to load SVG using XHR.');
            }

            _this3._loadSvgSourceUsingString(svgXhr.response);
        };

        svgXhr.onerror = function () {
            return _this3.emit('error', _this3);
        };

        svgXhr.open('GET', this.imageUrl, true);
        svgXhr.send();
    };

    /**
     * Loads texture using an SVG string. The original SVG Image is stored as `origSource` and the
     * created canvas is the new `source`. The SVG is scaled using `sourceScale`. Called by
     * `_loadSvgSourceUsingXhr` or `_loadSvgSourceUsingDataUri`.
     *
     * @param  {string} svgString SVG source as string
     *
     * @fires loaded
     */


    BaseTexture.prototype._loadSvgSourceUsingString = function _loadSvgSourceUsingString(svgString) {
        var svgSize = (0, _utils.getSvgSize)(svgString);

        var svgWidth = svgSize.width;
        var svgHeight = svgSize.height;

        if (!svgWidth || !svgHeight) {
            throw new Error('The SVG image must have width and height defined (in pixels), canvas API needs them.');
        }

        // Scale realWidth and realHeight
        this.realWidth = Math.round(svgWidth * this.sourceScale);
        this.realHeight = Math.round(svgHeight * this.sourceScale);

        this.width = this.realWidth / this.resolution;
        this.height = this.realHeight / this.resolution;

        // Check pow2 after scale
        this.isPowerOfTwo = _bitTwiddle2.default.isPow2(this.realWidth) && _bitTwiddle2.default.isPow2(this.realHeight);

        // Create a canvas element
        var canvas = document.createElement('canvas');

        canvas.width = this.realWidth;
        canvas.height = this.realHeight;
        canvas._pixiId = 'canvas_' + (0, _utils.uid)();

        // Draw the Svg to the canvas
        canvas.getContext('2d').drawImage(this.source, 0, 0, svgWidth, svgHeight, 0, 0, this.realWidth, this.realHeight);

        // Replace the original source image with the canvas
        this.origSource = this.source;
        this.source = canvas;

        // Add also the canvas in cache (destroy clears by `imageUrl` and `source._pixiId`)
        _utils.BaseTextureCache[canvas._pixiId] = this;

        this.isLoading = false;
        this._sourceLoaded();
        this.emit('loaded', this);
    };

    /**
     * Used internally to update the width, height, and some other tracking vars once
     * a source has successfully loaded.
     *
     * @private
     */


    BaseTexture.prototype._sourceLoaded = function _sourceLoaded() {
        this.hasLoaded = true;
        this.update();
    };

    /**
     * Destroys this base texture
     *
     */


    BaseTexture.prototype.destroy = function destroy() {
        if (this.imageUrl) {
            delete _utils.BaseTextureCache[this.imageUrl];
            delete _utils.TextureCache[this.imageUrl];

            this.imageUrl = null;

            if (!navigator.isCocoonJS) {
                this.source.src = '';
            }
        }
        // An svg source has both `imageUrl` and `__pixiId`, so no `else if` here
        if (this.source && this.source._pixiId) {
            delete _utils.BaseTextureCache[this.source._pixiId];
        }

        this.source = null;

        this.dispose();
    };

    /**
     * Frees the texture from WebGL memory without destroying this texture object.
     * This means you can still use the texture later which will upload it to GPU
     * memory again.
     *
     */


    BaseTexture.prototype.dispose = function dispose() {
        this.emit('dispose', this);
    };

    /**
     * Changes the source image of the texture.
     * The original source must be an Image element.
     *
     * @param {string} newSrc - the path of the image
     */


    BaseTexture.prototype.updateSourceImage = function updateSourceImage(newSrc) {
        this.source.src = newSrc;

        this.loadSource(this.source);
    };

    /**
     * Helper function that creates a base texture from the given image url.
     * If the image is not in the base texture cache it will be created and loaded.
     *
     * @static
     * @param {string} imageUrl - The image url of the texture
     * @param {boolean} [crossorigin=(auto)] - Should use anonymous CORS? Defaults to true if the URL is not a data-URI.
     * @param {number} [scaleMode=PIXI.settings.SCALE_MODE] - See {@link PIXI.SCALE_MODES} for possible values
     * @param {number} [sourceScale=(auto)] - Scale for the original image, used with Svg images.
     * @return {PIXI.BaseTexture} The new base texture.
     */


    BaseTexture.fromImage = function fromImage(imageUrl, crossorigin, scaleMode, sourceScale) {
        var baseTexture = _utils.BaseTextureCache[imageUrl];

        if (!baseTexture) {
            // new Image() breaks tex loading in some versions of Chrome.
            // See https://code.google.com/p/chromium/issues/detail?id=238071
            var image = new Image(); // document.createElement('img');

            if (crossorigin === undefined && imageUrl.indexOf('data:') !== 0) {
                image.crossOrigin = (0, _determineCrossOrigin2.default)(imageUrl);
            }

            baseTexture = new BaseTexture(image, scaleMode);
            baseTexture.imageUrl = imageUrl;

            if (sourceScale) {
                baseTexture.sourceScale = sourceScale;
            }

            // if there is an @2x at the end of the url we are going to assume its a highres image
            baseTexture.resolution = (0, _utils.getResolutionOfUrl)(imageUrl);

            image.src = imageUrl; // Setting this triggers load

            _utils.BaseTextureCache[imageUrl] = baseTexture;
        }

        return baseTexture;
    };

    /**
     * Helper function that creates a base texture from the given canvas element.
     *
     * @static
     * @param {HTMLCanvasElement} canvas - The canvas element source of the texture
     * @param {number} scaleMode - See {@link PIXI.SCALE_MODES} for possible values
     * @return {PIXI.BaseTexture} The new base texture.
     */


    BaseTexture.fromCanvas = function fromCanvas(canvas, scaleMode) {
        if (!canvas._pixiId) {
            canvas._pixiId = 'canvas_' + (0, _utils.uid)();
        }

        var baseTexture = _utils.BaseTextureCache[canvas._pixiId];

        if (!baseTexture) {
            baseTexture = new BaseTexture(canvas, scaleMode);
            _utils.BaseTextureCache[canvas._pixiId] = baseTexture;
        }

        return baseTexture;
    };

    return BaseTexture;
}(_eventemitter2.default);

exports.default = BaseTexture;
//# sourceMappingURL=BaseTexture.js.map
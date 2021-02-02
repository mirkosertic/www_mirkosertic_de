'use strict';

exports.__esModule = true;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _core = require('../core');

var core = _interopRequireWildcard(_core);

var _ObservablePoint = require('../core/math/ObservablePoint');

var _ObservablePoint2 = _interopRequireDefault(_ObservablePoint);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * A BitmapText object will create a line or multiple lines of text using bitmap font. To
 * split a line you can use '\n', '\r' or '\r\n' in your string. You can generate the fnt files using:
 *
 * A BitmapText can only be created when the font is loaded
 *
 * ```js
 * // in this case the font is in a file called 'desyrel.fnt'
 * let bitmapText = new PIXI.extras.BitmapText("text using a fancy font!", {font: "35px Desyrel", align: "right"});
 * ```
 *
 * http://www.angelcode.com/products/bmfont/ for windows or
 * http://www.bmglyph.com/ for mac.
 *
 * @class
 * @extends PIXI.Container
 * @memberof PIXI.extras
 */
var BitmapText = function (_core$Container) {
    _inherits(BitmapText, _core$Container);

    /**
     * @param {string} text - The copy that you would like the text to display
     * @param {object} style - The style parameters
     * @param {string|object} style.font - The font descriptor for the object, can be passed as a string of form
     *      "24px FontName" or "FontName" or as an object with explicit name/size properties.
     * @param {string} [style.font.name] - The bitmap font id
     * @param {number} [style.font.size] - The size of the font in pixels, e.g. 24
     * @param {string} [style.align='left'] - Alignment for multiline text ('left', 'center' or 'right'), does not affect
     *      single line text
     * @param {number} [style.tint=0xFFFFFF] - The tint color
     */
    function BitmapText(text) {
        var style = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        _classCallCheck(this, BitmapText);

        /**
         * The width of the overall text, different from fontSize,
         * which is defined in the style object
         *
         * @member {number}
         * @readonly
         */
        var _this = _possibleConstructorReturn(this, _core$Container.call(this));

        _this.textWidth = 0;

        /**
         * The height of the overall text, different from fontSize,
         * which is defined in the style object
         *
         * @member {number}
         * @readonly
         */
        _this.textHeight = 0;

        /**
         * Private tracker for the letter sprite pool.
         *
         * @member {PIXI.Sprite[]}
         * @private
         */
        _this._glyphs = [];

        /**
         * Private tracker for the current style.
         *
         * @member {object}
         * @private
         */
        _this._font = {
            tint: style.tint !== undefined ? style.tint : 0xFFFFFF,
            align: style.align || 'left',
            name: null,
            size: 0
        };

        /**
         * Private tracker for the current font.
         *
         * @member {object}
         * @private
         */
        _this.font = style.font; // run font setter

        /**
         * Private tracker for the current text.
         *
         * @member {string}
         * @private
         */
        _this._text = text;

        /**
         * The max width of this bitmap text in pixels. If the text provided is longer than the
         * value provided, line breaks will be automatically inserted in the last whitespace.
         * Disable by setting value to 0
         *
         * @member {number}
         */
        _this.maxWidth = 0;

        /**
         * The max line height. This is useful when trying to use the total height of the Text,
         * ie: when trying to vertically align.
         *
         * @member {number}
         */
        _this.maxLineHeight = 0;

        /**
         * Text anchor. read-only
         *
         * @member {PIXI.ObservablePoint}
         * @private
         */
        _this._anchor = new _ObservablePoint2.default(function () {
            _this.dirty = true;
        }, _this, 0, 0);

        /**
         * The dirty state of this object.
         *
         * @member {boolean}
         */
        _this.dirty = false;

        _this.updateText();
        return _this;
    }

    /**
     * Renders text and updates it when needed
     *
     * @private
     */


    BitmapText.prototype.updateText = function updateText() {
        var data = BitmapText.fonts[this._font.name];
        var scale = this._font.size / data.size;
        var pos = new core.Point();
        var chars = [];
        var lineWidths = [];

        var prevCharCode = null;
        var lastLineWidth = 0;
        var maxLineWidth = 0;
        var line = 0;
        var lastSpace = -1;
        var lastSpaceWidth = 0;
        var maxLineHeight = 0;

        for (var i = 0; i < this.text.length; i++) {
            var charCode = this.text.charCodeAt(i);

            if (/(\s)/.test(this.text.charAt(i))) {
                lastSpace = i;
                lastSpaceWidth = lastLineWidth;
            }

            if (/(?:\r\n|\r|\n)/.test(this.text.charAt(i))) {
                lineWidths.push(lastLineWidth);
                maxLineWidth = Math.max(maxLineWidth, lastLineWidth);
                line++;

                pos.x = 0;
                pos.y += data.lineHeight;
                prevCharCode = null;
                continue;
            }

            if (lastSpace !== -1 && this.maxWidth > 0 && pos.x * scale > this.maxWidth) {
                core.utils.removeItems(chars, lastSpace, i - lastSpace);
                i = lastSpace;
                lastSpace = -1;

                lineWidths.push(lastSpaceWidth);
                maxLineWidth = Math.max(maxLineWidth, lastSpaceWidth);
                line++;

                pos.x = 0;
                pos.y += data.lineHeight;
                prevCharCode = null;
                continue;
            }

            var charData = data.chars[charCode];

            if (!charData) {
                continue;
            }

            if (prevCharCode && charData.kerning[prevCharCode]) {
                pos.x += charData.kerning[prevCharCode];
            }

            chars.push({
                texture: charData.texture,
                line: line,
                charCode: charCode,
                position: new core.Point(pos.x + charData.xOffset, pos.y + charData.yOffset)
            });
            lastLineWidth = pos.x + (charData.texture.width + charData.xOffset);
            pos.x += charData.xAdvance;
            maxLineHeight = Math.max(maxLineHeight, charData.yOffset + charData.texture.height);
            prevCharCode = charCode;
        }

        lineWidths.push(lastLineWidth);
        maxLineWidth = Math.max(maxLineWidth, lastLineWidth);

        var lineAlignOffsets = [];

        for (var _i = 0; _i <= line; _i++) {
            var alignOffset = 0;

            if (this._font.align === 'right') {
                alignOffset = maxLineWidth - lineWidths[_i];
            } else if (this._font.align === 'center') {
                alignOffset = (maxLineWidth - lineWidths[_i]) / 2;
            }

            lineAlignOffsets.push(alignOffset);
        }

        var lenChars = chars.length;
        var tint = this.tint;

        for (var _i2 = 0; _i2 < lenChars; _i2++) {
            var c = this._glyphs[_i2]; // get the next glyph sprite

            if (c) {
                c.texture = chars[_i2].texture;
            } else {
                c = new core.Sprite(chars[_i2].texture);
                this._glyphs.push(c);
            }

            c.position.x = (chars[_i2].position.x + lineAlignOffsets[chars[_i2].line]) * scale;
            c.position.y = chars[_i2].position.y * scale;
            c.scale.x = c.scale.y = scale;
            c.tint = tint;

            if (!c.parent) {
                this.addChild(c);
            }
        }

        // remove unnecessary children.
        for (var _i3 = lenChars; _i3 < this._glyphs.length; ++_i3) {
            this.removeChild(this._glyphs[_i3]);
        }

        this.textWidth = maxLineWidth * scale;
        this.textHeight = (pos.y + data.lineHeight) * scale;

        // apply anchor
        if (this.anchor.x !== 0 || this.anchor.y !== 0) {
            for (var _i4 = 0; _i4 < lenChars; _i4++) {
                this._glyphs[_i4].x -= this.textWidth * this.anchor.x;
                this._glyphs[_i4].y -= this.textHeight * this.anchor.y;
            }
        }
        this.maxLineHeight = maxLineHeight * scale;
    };

    /**
     * Updates the transform of this object
     *
     * @private
     */


    BitmapText.prototype.updateTransform = function updateTransform() {
        this.validate();
        this.containerUpdateTransform();
    };

    /**
     * Validates text before calling parent's getLocalBounds
     *
     * @return {PIXI.Rectangle} The rectangular bounding area
     */


    BitmapText.prototype.getLocalBounds = function getLocalBounds() {
        this.validate();

        return _core$Container.prototype.getLocalBounds.call(this);
    };

    /**
     * Updates text when needed
     *
     * @private
     */


    BitmapText.prototype.validate = function validate() {
        if (this.dirty) {
            this.updateText();
            this.dirty = false;
        }
    };

    /**
     * The tint of the BitmapText object
     *
     * @member {number}
     * @memberof PIXI.extras.BitmapText#
     */


    _createClass(BitmapText, [{
        key: 'tint',
        get: function get() {
            return this._font.tint;
        }

        /**
         * Sets the tint.
         *
         * @param {number} value - The value to set to.
         */
        ,
        set: function set(value) {
            this._font.tint = typeof value === 'number' && value >= 0 ? value : 0xFFFFFF;

            this.dirty = true;
        }

        /**
         * The alignment of the BitmapText object
         *
         * @member {string}
         * @default 'left'
         * @memberof PIXI.extras.BitmapText#
         */

    }, {
        key: 'align',
        get: function get() {
            return this._font.align;
        }

        /**
         * Sets the alignment
         *
         * @param {string} value - The value to set to.
         */
        ,
        set: function set(value) {
            this._font.align = value || 'left';

            this.dirty = true;
        }

        /**
         * The anchor sets the origin point of the text.
         * The default is 0,0 this means the text's origin is the top left
         * Setting the anchor to 0.5,0.5 means the text's origin is centered
         * Setting the anchor to 1,1 would mean the text's origin point will be the bottom right corner
         *
         * @member {PIXI.Point | number}
         * @memberof PIXI.extras.BitmapText#
         */

    }, {
        key: 'anchor',
        get: function get() {
            return this._anchor;
        }

        /**
         * Sets the anchor.
         *
         * @param {PIXI.Point|number} value - The value to set to.
         */
        ,
        set: function set(value) {
            if (typeof value === 'number') {
                this._anchor.set(value);
            } else {
                this._anchor.copy(value);
            }
        }

        /**
         * The font descriptor of the BitmapText object
         *
         * @member {string|object}
         * @memberof PIXI.extras.BitmapText#
         */

    }, {
        key: 'font',
        get: function get() {
            return this._font;
        }

        /**
         * Sets the font.
         *
         * @param {string|object} value - The value to set to.
         */
        ,
        set: function set(value) {
            if (!value) {
                return;
            }

            if (typeof value === 'string') {
                value = value.split(' ');

                this._font.name = value.length === 1 ? value[0] : value.slice(1).join(' ');
                this._font.size = value.length >= 2 ? parseInt(value[0], 10) : BitmapText.fonts[this._font.name].size;
            } else {
                this._font.name = value.name;
                this._font.size = typeof value.size === 'number' ? value.size : parseInt(value.size, 10);
            }

            this.dirty = true;
        }

        /**
         * The text of the BitmapText object
         *
         * @member {string}
         * @memberof PIXI.extras.BitmapText#
         */

    }, {
        key: 'text',
        get: function get() {
            return this._text;
        }

        /**
         * Sets the text.
         *
         * @param {string} value - The value to set to.
         */
        ,
        set: function set(value) {
            value = value.toString() || ' ';
            if (this._text === value) {
                return;
            }
            this._text = value;
            this.dirty = true;
        }
    }]);

    return BitmapText;
}(core.Container);

exports.default = BitmapText;


BitmapText.fonts = {};
//# sourceMappingURL=BitmapText.js.map
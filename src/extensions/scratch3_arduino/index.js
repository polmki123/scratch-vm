const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const Clone = require('../../util/clone');
const Color = require('../../util/color');
const formatMessage = require('format-message');
const MathUtil = require('../../util/math-util');
const RenderedTarget = require('../../sprites/rendered-target');
const log = require('../../util/log');
const StageLayering = require('../../engine/stage-layering');

/**
 * Icon svg to be displayed at the left edge of each extension block, encoded as a data URI.
 * @type {string}
 */
// eslint-disable-next-line max-len
const blockIconURI = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48dGl0bGU+cGVuLWljb248L3RpdGxlPjxnIHN0cm9rZT0iIzU3NUU3NSIgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik04Ljc1MyAzNC42MDJsLTQuMjUgMS43OCAxLjc4My00LjIzN2MxLjIxOC0yLjg5MiAyLjkwNy01LjQyMyA1LjAzLTcuNTM4TDMxLjA2NiA0LjkzYy44NDYtLjg0MiAyLjY1LS40MSA0LjAzMi45NjcgMS4zOCAxLjM3NSAxLjgxNiAzLjE3My45NyA0LjAxNUwxNi4zMTggMjkuNTljLTIuMTIzIDIuMTE2LTQuNjY0IDMuOC03LjU2NSA1LjAxMiIgZmlsbD0iI0ZGRiIvPjxwYXRoIGQ9Ik0yOS40MSA2LjExcy00LjQ1LTIuMzc4LTguMjAyIDUuNzcyYy0xLjczNCAzLjc2Ni00LjM1IDEuNTQ2LTQuMzUgMS41NDYiLz48cGF0aCBkPSJNMzYuNDIgOC44MjVjMCAuNDYzLS4xNC44NzMtLjQzMiAxLjE2NGwtOS4zMzUgOS4zYy4yODItLjI5LjQxLS42NjguNDEtMS4xMiAwLS44NzQtLjUwNy0xLjk2My0xLjQwNi0yLjg2OC0xLjM2Mi0xLjM1OC0zLjE0Ny0xLjgtNC4wMDItLjk5TDMwLjk5IDUuMDFjLjg0NC0uODQgMi42NS0uNDEgNC4wMzUuOTYuODk4LjkwNCAxLjM5NiAxLjk4MiAxLjM5NiAyLjg1NU0xMC41MTUgMzMuNzc0Yy0uNTczLjMwMi0xLjE1Ny41Ny0xLjc2NC44M0w0LjUgMzYuMzgybDEuNzg2LTQuMjM1Yy4yNTgtLjYwNC41My0xLjE4Ni44MzMtMS43NTcuNjkuMTgzIDEuNDQ4LjYyNSAyLjEwOCAxLjI4Mi42Ni42NTggMS4xMDIgMS40MTIgMS4yODcgMi4xMDIiIGZpbGw9IiM0Qzk3RkYiLz48cGF0aCBkPSJNMzYuNDk4IDguNzQ4YzAgLjQ2NC0uMTQuODc0LS40MzMgMS4xNjVsLTE5Ljc0MiAxOS42OGMtMi4xMyAyLjExLTQuNjczIDMuNzkzLTcuNTcyIDUuMDFMNC41IDM2LjM4bC45NzQtMi4zMTYgMS45MjUtLjgwOGMyLjg5OC0xLjIxOCA1LjQ0LTIuOSA3LjU3LTUuMDFsMTkuNzQzLTE5LjY4Yy4yOTItLjI5Mi40MzItLjcwMi40MzItMS4xNjUgMC0uNjQ2LS4yNy0xLjQtLjc4LTIuMTIyLjI1LjE3Mi41LjM3Ny43MzcuNjE0Ljg5OC45MDUgMS4zOTYgMS45ODMgMS4zOTYgMi44NTYiIGZpbGw9IiM1NzVFNzUiIG9wYWNpdHk9Ii4xNSIvPjxwYXRoIGQ9Ik0xOC40NSAxMi44M2MwIC41LS40MDQuOTA1LS45MDQuOTA1cy0uOTA1LS40MDUtLjkwNS0uOTA0YzAtLjUuNDA3LS45MDMuOTA2LS45MDMuNSAwIC45MDQuNDA0LjkwNC45MDR6IiBmaWxsPSIjNTc1RTc1Ii8+PC9nPjwvc3ZnPg==';

/**
 * Enum for arduino color parameter values.
 * @readonly
 * @enum {string}
 */
const ColorParam = {
    COLOR: 'color',
    SATURATION: 'saturation',
    BRIGHTNESS: 'brightness',
    TRANSPARENCY: 'transparency'
};

/**
 * @typedef {object} ARduinoState - the arduino state associated with a particular target.
 * @property {Boolean} arduinoDown - tracks whether the arduino should draw for this target.
 * @property {number} color - the current color (hue) of the arduino.
 * @property {ARduinoAttributes} arduinoAttributes - cached arduino attributes for the renderer. This is the authoritative value for
 *   diameter but not for arduino color.
 */

/**
 * Host for the ARduino-related blocks in Scratch 3.0
 * @param {Runtime} runtime - the runtime instantiating this block package.
 * @constructor
 */
class Scratch3ARduinoBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;

        /**
         * The ID of the renderer Drawable corresponding to the arduino layer.
         * @type {int}
         * @private
         */
        this._arduinoDrawableId = -1;

        /**
         * The ID of the renderer Skin corresponding to the arduino layer.
         * @type {int}
         * @private
         */
        this._arduinoSkinId = -1;

        this._onTargetCreated = this._onTargetCreated.bind(this);
        this._onTargetMoved = this._onTargetMoved.bind(this);

        runtime.on('targetWasCreated', this._onTargetCreated);
        runtime.on('RUNTIME_DISPOSED', this.clear.bind(this));
    }

    /**
     * The default arduino state, to be used when a target has no existing arduino state.
     * @type {ARduinoState}
     */
    static get DEFAULT_ARDUINO_STATE () {
        return {
            arduinoDown: false,
            color: 66.66,
            saturation: 100,
            brightness: 100,
            transparency: 0,
            _shade: 50, // Used only for legacy `change shade by` blocks
            arduinoAttributes: {
                color4f: [0, 0, 1, 1],
                diameter: 1
            }
        };
    }


    /**
     * The minimum and maximum allowed arduino size.
     * The maximum is twice the diagonal of the stage, so that even an
     * off-stage sprite can fill it.
     * @type {{min: number, max: number}}
     */
    static get ARDUINO_SIZE_RANGE () {
        return {min: 1, max: 1200};
    }

    /**
     * The key to load & store a target's arduino-related state.
     * @type {string}
     */
    static get STATE_KEY () {
        return 'Scratch.arduino';
    }

    /**
     * Clamp a arduino size value to the range allowed by the arduino.
     * @param {number} requestedSize - the requested arduino size.
     * @returns {number} the clamped size.
     * @private
     */
    _clampARduinoSize (requestedSize) {
        return MathUtil.clamp(
            requestedSize,
            Scratch3ARduinoBlocks.ARDUINO_SIZE_RANGE.min,
            Scratch3ARduinoBlocks.ARDUINO_SIZE_RANGE.max
        );
    }

    /**
     * Retrieve the ID of the renderer "Skin" corresponding to the arduino layer. If
     * the arduino Skin doesn't yet exist, create it.
     * @returns {int} the Skin ID of the arduino layer, or -1 on failure.
     * @private
     */
    _getARduinoLayerID () {
        if (this._arduinoSkinId < 0 && this.runtime.renderer) {
            this._arduinoSkinId = this.runtime.renderer.createARduinoSkin();
            this._arduinoDrawableId = this.runtime.renderer.createDrawable(StageLayering.ARDUINO_LAYER);
            this.runtime.renderer.updateDrawableProperties(this._arduinoDrawableId, {skinId: this._arduinoSkinId});
        }
        return this._arduinoSkinId;
    }

    /**
     * @param {Target} target - collect arduino state for this target. Probably, but not necessarily, a RenderedTarget.
     * @returns {ARduinoState} the mutable arduino state associated with that target. This will be created if necessary.
     * @private
     */
    _getARduinoState (target) {
        let arduinoState = target.getCustomState(Scratch3ARduinoBlocks.STATE_KEY);
        if (!arduinoState) {
            arduinoState = Clone.simple(Scratch3ARduinoBlocks.DEFAULT_ARDUINO_STATE);
            target.setCustomState(Scratch3ARduinoBlocks.STATE_KEY, arduinoState);
        }
        return arduinoState;
    }

    /**
     * When a arduino-using Target is cloned, clone the arduino state.
     * @param {Target} newTarget - the newly created target.
     * @param {Target} [sourceTarget] - the target used as a source for the new clone, if any.
     * @listens Runtime#event:targetWasCreated
     * @private
     */
    _onTargetCreated (newTarget, sourceTarget) {
        if (sourceTarget) {
            const arduinoState = sourceTarget.getCustomState(Scratch3ARduinoBlocks.STATE_KEY);
            if (arduinoState) {
                newTarget.setCustomState(Scratch3ARduinoBlocks.STATE_KEY, Clone.simple(arduinoState));
                if (arduinoState.arduinoDown) {
                    newTarget.addListener(RenderedTarget.EVENT_TARGET_MOVED, this._onTargetMoved);
                }
            }
        }
    }

    /**
     * Handle a target which has moved. This only fires when the arduino is down.
     * @param {RenderedTarget} target - the target which has moved.
     * @param {number} oldX - the previous X position.
     * @param {number} oldY - the previous Y position.
     * @param {boolean} isForce - whether the movement was forced.
     * @private
     */
    _onTargetMoved (target, oldX, oldY, isForce) {
        // Only move the arduino if the movement isn't forced (ie. dragged).
        if (!isForce) {
            const arduinoSkinId = this._getARduinoLayerID();
            if (arduinoSkinId >= 0) {
                const arduinoState = this._getARduinoState(target);
                this.runtime.renderer.arduinoLine(arduinoSkinId, arduinoState.arduinoAttributes, oldX, oldY, target.x, target.y);
                this.runtime.requestRedraw();
            }
        }
    }

    /**
     * Wrap a color input into the range (0,100).
     * @param {number} value - the value to be wrapped.
     * @returns {number} the wrapped value.
     * @private
     */
    _wrapColor (value) {
        return MathUtil.wrapClamp(value, 0, 100);
    }

    /**
     * Initialize color parameters menu with localized strings
     * @returns {array} of the localized text and values for each menu element
     * @private
     */
    _initColorParam () {
        return [
            {
                text: formatMessage({
                    id: 'arduino.colorMenu.color',
                    default: 'color',
                    description: 'label for color element in color picker for arduino extension'
                }),
                value: ColorParam.COLOR
            },
            {
                text: formatMessage({
                    id: 'arduino.colorMenu.saturation',
                    default: 'saturation',
                    description: 'label for saturation element in color picker for arduino extension'
                }),
                value: ColorParam.SATURATION
            },
            {
                text: formatMessage({
                    id: 'arduino.colorMenu.brightness',
                    default: 'brightness',
                    description: 'label for brightness element in color picker for arduino extension'
                }),
                value: ColorParam.BRIGHTNESS
            },
            {
                text: formatMessage({
                    id: 'arduino.colorMenu.transparency',
                    default: 'transparency',
                    description: 'label for transparency element in color picker for arduino extension'
                }),
                value: ColorParam.TRANSPARENCY

            }
        ];
    }

    /**
     * Clamp a arduino color parameter to the range (0,100).
     * @param {number} value - the value to be clamped.
     * @returns {number} the clamped value.
     * @private
     */
    _clampColorParam (value) {
        return MathUtil.clamp(value, 0, 100);
    }

    /**
     * Convert an alpha value to a arduino transparency value.
     * Alpha ranges from 0 to 1, where 0 is transparent and 1 is opaque.
     * Transparency ranges from 0 to 100, where 0 is opaque and 100 is transparent.
     * @param {number} alpha - the input alpha value.
     * @returns {number} the transparency value.
     * @private
     */
    _alphaToTransparency (alpha) {
        return (1.0 - alpha) * 100.0;
    }

    /**
     * Convert a arduino transparency value to an alpha value.
     * Alpha ranges from 0 to 1, where 0 is transparent and 1 is opaque.
     * Transparency ranges from 0 to 100, where 0 is opaque and 100 is transparent.
     * @param {number} transparency - the input transparency value.
     * @returns {number} the alpha value.
     * @private
     */
    _transparencyToAlpha (transparency) {
        return 1.0 - (transparency / 100.0);
    }

    /**
     * @returns {object} metadata for this extension and its blocks.
     */
    getInfo () {
        return {
            id: 'arduino',
            name: formatMessage({
                id: 'arduino.categoryName',
                default: 'ARduino',
                description: 'Label for the arduino extension category'
            }),
            blockIconURI: blockIconURI,
            blocks: [
                {
                    opcode: 'clear',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduino.clear',
                        default: 'erase all',
                        description: 'erase all arduino trails and stamps'
                    })
                },
                {
                    opcode: 'stamp',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduino.stamp',
                        default: 'stamp',
                        description: 'render current costume on the background'
                    })
                },
                {
                    opcode: 'arduinoDown',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduino.arduinoDown',
                        default: 'arduino down',
                        description: 'start leaving a trail when the sprite moves'
                    })
                },
                {
                    opcode: 'arduinoUp',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduino.arduinoUp',
                        default: 'arduino up',
                        description: 'stop leaving a trail behind the sprite'
                    })
                },
                {
                    opcode: 'setARduinoColorToColor',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduino.setColor',
                        default: 'set arduino color to [COLOR]',
                        description: 'set the arduino color to a particular (RGB) value'
                    }),
                    arguments: {
                        COLOR: {
                            type: ArgumentType.COLOR
                        }
                    }
                },
                {
                    opcode: 'changeARduinoColorParamBy',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduino.changeColorParam',
                        default: 'change arduino [COLOR_PARAM] by [VALUE]',
                        description: 'change the state of a arduino color parameter'
                    }),
                    arguments: {
                        COLOR_PARAM: {
                            type: ArgumentType.STRING,
                            menu: 'colorParam',
                            defaultValue: ColorParam.COLOR
                        },
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 10
                        }
                    }
                },
                {
                    opcode: 'setARduinoColorParamTo',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduino.setColorParam',
                        default: 'set arduino [COLOR_PARAM] to [VALUE]',
                        description: 'set the state for a arduino color parameter e.g. saturation'
                    }),
                    arguments: {
                        COLOR_PARAM: {
                            type: ArgumentType.STRING,
                            menu: 'colorParam',
                            defaultValue: ColorParam.COLOR
                        },
                        VALUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 50
                        }
                    }
                },
                {
                    opcode: 'changeARduinoSizeBy',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduino.changeSize',
                        default: 'change arduino size by [SIZE]',
                        description: 'change the diameter of the trail left by a sprite'
                    }),
                    arguments: {
                        SIZE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                {
                    opcode: 'setARduinoSizeTo',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduino.setSize',
                        default: 'set arduino size to [SIZE]',
                        description: 'set the diameter of a trail left by a sprite'
                    }),
                    arguments: {
                        SIZE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    }
                },
                /* Legacy blocks, should not be shown in flyout */
                {
                    opcode: 'setARduinoShadeToNumber',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduino.setShade',
                        default: 'set arduino shade to [SHADE]',
                        description: 'legacy arduino blocks - set arduino shade'
                    }),
                    arguments: {
                        SHADE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    },
                    hideFromPalette: true
                },
                {
                    opcode: 'changeARduinoShadeBy',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduino.changeShade',
                        default: 'change arduino shade by [SHADE]',
                        description: 'legacy arduino blocks - change arduino shade'
                    }),
                    arguments: {
                        SHADE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    },
                    hideFromPalette: true
                },
                {
                    opcode: 'setARduinoHueToNumber',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduino.setHue',
                        default: 'set arduino color to [HUE]',
                        description: 'legacy arduino blocks - set arduino color to number'
                    }),
                    arguments: {
                        HUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    },
                    hideFromPalette: true
                },
                {
                    opcode: 'changeARduinoHueBy',
                    blockType: BlockType.COMMAND,
                    text: formatMessage({
                        id: 'arduino.changeHue',
                        default: 'change arduino color by [HUE]',
                        description: 'legacy arduino blocks - change arduino color'
                    }),
                    arguments: {
                        HUE: {
                            type: ArgumentType.NUMBER,
                            defaultValue: 1
                        }
                    },
                    hideFromPalette: true
                }
            ],
            menus: {
                colorParam: this._initColorParam()
            }
        };
    }

    /**
     * The arduino "clear" block clears the arduino layer's contents.
     */
    clear () {
        const arduinoSkinId = this._getARduinoLayerID();
        if (arduinoSkinId >= 0) {
            this.runtime.renderer.arduinoClear(arduinoSkinId);
            this.runtime.requestRedraw();
        }
    }

    /**
     * The arduino "stamp" block stamps the current drawable's image onto the arduino layer.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     */
    stamp (args, util) {
        const arduinoSkinId = this._getARduinoLayerID();
        if (arduinoSkinId >= 0) {
            const target = util.target;
            this.runtime.renderer.arduinoStamp(arduinoSkinId, target.drawableID);
            this.runtime.requestRedraw();
        }
    }

    /**
     * The arduino "arduino down" block causes the target to leave arduino trails on future motion.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     */
    arduinoDown (args, util) {
        const target = util.target;
        const arduinoState = this._getARduinoState(target);

        if (!arduinoState.arduinoDown) {
            arduinoState.arduinoDown = true;
            target.addListener(RenderedTarget.EVENT_TARGET_MOVED, this._onTargetMoved);
        }

        const arduinoSkinId = this._getARduinoLayerID();
        if (arduinoSkinId >= 0) {
            this.runtime.renderer.arduinoPoint(arduinoSkinId, arduinoState.arduinoAttributes, target.x, target.y);
            this.runtime.requestRedraw();
        }
    }

    /**
     * The arduino "arduino up" block stops the target from leaving arduino trails.
     * @param {object} args - the block arguments.
     * @param {object} util - utility object provided by the runtime.
     */
    arduinoUp (args, util) {
        const target = util.target;
        const arduinoState = this._getARduinoState(target);

        if (arduinoState.arduinoDown) {
            arduinoState.arduinoDown = false;
            target.removeListener(RenderedTarget.EVENT_TARGET_MOVED, this._onTargetMoved);
        }
    }

    /**
     * The arduino "set arduino color to {color}" block sets the arduino to a particular RGB color.
     * The transparency is reset to 0.
     * @param {object} args - the block arguments.
     *  @property {int} COLOR - the color to set, expressed as a 24-bit RGB value (0xRRGGBB).
     * @param {object} util - utility object provided by the runtime.
     */
    setARduinoColorToColor (args, util) {
        const arduinoState = this._getARduinoState(util.target);
        const rgb = Cast.toRgbColorObject(args.COLOR);
        const hsv = Color.rgbToHsv(rgb);
        arduinoState.color = (hsv.h / 360) * 100;
        arduinoState.saturation = hsv.s * 100;
        arduinoState.brightness = hsv.v * 100;
        if (rgb.hasOwnProperty('a')) {
            arduinoState.transparency = 100 * (1 - (rgb.a / 255.0));
        } else {
            arduinoState.transparency = 0;
        }

        // Set the legacy "shade" value the same way scratch 2 did.
        arduinoState._shade = arduinoState.brightness / 2;

        this._updateARduinoColor(arduinoState);
    }

    /**
     * Update the cached color from the color, saturation, brightness and transparency values
     * in the provided ARduinoState object.
     * @param {ARduinoState} arduinoState - the arduino state to update.
     * @private
     */
    _updateARduinoColor (arduinoState) {
        const rgb = Color.hsvToRgb({
            h: arduinoState.color * 360 / 100,
            s: arduinoState.saturation / 100,
            v: arduinoState.brightness / 100
        });
        arduinoState.arduinoAttributes.color4f[0] = rgb.r / 255.0;
        arduinoState.arduinoAttributes.color4f[1] = rgb.g / 255.0;
        arduinoState.arduinoAttributes.color4f[2] = rgb.b / 255.0;
        arduinoState.arduinoAttributes.color4f[3] = this._transparencyToAlpha(arduinoState.transparency);
    }

    /**
     * Set or change a single color parameter on the arduino state, and update the arduino color.
     * @param {ColorParam} param - the name of the color parameter to set or change.
     * @param {number} value - the value to set or change the param by.
     * @param {ARduinoState} arduinoState - the arduino state to update.
     * @param {boolean} change - if true change param by value, if false set param to value.
     * @private
     */
    _setOrChangeColorParam (param, value, arduinoState, change) {
        switch (param) {
        case ColorParam.COLOR:
            arduinoState.color = this._wrapColor(value + (change ? arduinoState.color : 0));
            break;
        case ColorParam.SATURATION:
            arduinoState.saturation = this._clampColorParam(value + (change ? arduinoState.saturation : 0));
            break;
        case ColorParam.BRIGHTNESS:
            arduinoState.brightness = this._clampColorParam(value + (change ? arduinoState.brightness : 0));
            break;
        case ColorParam.TRANSPARENCY:
            arduinoState.transparency = this._clampColorParam(value + (change ? arduinoState.transparency : 0));
            break;
        default:
            log.warn(`Tried to set or change unknown color parameter: ${param}`);
        }
        this._updateARduinoColor(arduinoState);
    }

    /**
     * The "change arduino {ColorParam} by {number}" block changes one of the arduino's color parameters
     * by a given amound.
     * @param {object} args - the block arguments.
     *  @property {ColorParam} COLOR_PARAM - the name of the selected color parameter.
     *  @property {number} VALUE - the amount to change the selected parameter by.
     * @param {object} util - utility object provided by the runtime.
     */
    changeARduinoColorParamBy (args, util) {
        const arduinoState = this._getARduinoState(util.target);
        this._setOrChangeColorParam(args.COLOR_PARAM, Cast.toNumber(args.VALUE), arduinoState, true);
    }

    /**
     * The "set arduino {ColorParam} to {number}" block sets one of the arduino's color parameters
     * to a given amound.
     * @param {object} args - the block arguments.
     *  @property {ColorParam} COLOR_PARAM - the name of the selected color parameter.
     *  @property {number} VALUE - the amount to set the selected parameter to.
     * @param {object} util - utility object provided by the runtime.
     */
    setARduinoColorParamTo (args, util) {
        const arduinoState = this._getARduinoState(util.target);
        this._setOrChangeColorParam(args.COLOR_PARAM, Cast.toNumber(args.VALUE), arduinoState, false);
    }

    /**
     * The arduino "change arduino size by {number}" block changes the arduino size by the given amount.
     * @param {object} args - the block arguments.
     *  @property {number} SIZE - the amount of desired size change.
     * @param {object} util - utility object provided by the runtime.
     */
    changeARduinoSizeBy (args, util) {
        const arduinoAttributes = this._getARduinoState(util.target).arduinoAttributes;
        arduinoAttributes.diameter = this._clampARduinoSize(arduinoAttributes.diameter + Cast.toNumber(args.SIZE));
    }

    /**
     * The arduino "set arduino size to {number}" block sets the arduino size to the given amount.
     * @param {object} args - the block arguments.
     *  @property {number} SIZE - the amount of desired size change.
     * @param {object} util - utility object provided by the runtime.
     */
    setARduinoSizeTo (args, util) {
        const arduinoAttributes = this._getARduinoState(util.target).arduinoAttributes;
        arduinoAttributes.diameter = this._clampARduinoSize(Cast.toNumber(args.SIZE));
    }

    /* LEGACY OPCODES */
    /**
     * Scratch 2 "hue" param is equivelant to twice the new "color" param.
     * @param {object} args - the block arguments.
     *  @property {number} HUE - the amount to set the hue to.
     * @param {object} util - utility object provided by the runtime.
     */
    setARduinoHueToNumber (args, util) {
        const arduinoState = this._getARduinoState(util.target);
        const hueValue = Cast.toNumber(args.HUE);
        const colorValue = hueValue / 2;
        this._setOrChangeColorParam(ColorParam.COLOR, colorValue, arduinoState, false);
        this._setOrChangeColorParam(ColorParam.TRANSPARENCY, 0, arduinoState, false);
        this._legacyUpdateARduinoColor(arduinoState);
    }

    /**
     * Scratch 2 "hue" param is equivelant to twice the new "color" param.
     * @param {object} args - the block arguments.
     *  @property {number} HUE - the amount of desired hue change.
     * @param {object} util - utility object provided by the runtime.
     */
    changeARduinoHueBy (args, util) {
        const arduinoState = this._getARduinoState(util.target);
        const hueChange = Cast.toNumber(args.HUE);
        const colorChange = hueChange / 2;
        this._setOrChangeColorParam(ColorParam.COLOR, colorChange, arduinoState, true);

        this._legacyUpdateARduinoColor(arduinoState);
    }

    /**
     * Use legacy "set shade" code to calculate RGB value for shade,
     * then convert back to HSV and store those components.
     * It is important to also track the given shade in arduinoState._shade
     * because it cannot be accurately backed out of the new HSV later.
     * @param {object} args - the block arguments.
     *  @property {number} SHADE - the amount to set the shade to.
     * @param {object} util - utility object provided by the runtime.
     */
    setARduinoShadeToNumber (args, util) {
        const arduinoState = this._getARduinoState(util.target);
        let newShade = Cast.toNumber(args.SHADE);

        // Wrap clamp the new shade value the way scratch 2 did.
        newShade = newShade % 200;
        if (newShade < 0) newShade += 200;

        // And store the shade that was used to compute this new color for later use.
        arduinoState._shade = newShade;

        this._legacyUpdateARduinoColor(arduinoState);
    }

    /**
     * Because "shade" cannot be backed out of hsv consistently, use the previously
     * stored arduinoState._shade to make the shade change.
     * @param {object} args - the block arguments.
     *  @property {number} SHADE - the amount of desired shade change.
     * @param {object} util - utility object provided by the runtime.
     */
    changeARduinoShadeBy (args, util) {
        const arduinoState = this._getARduinoState(util.target);
        const shadeChange = Cast.toNumber(args.SHADE);
        this.setARduinoShadeToNumber({SHADE: arduinoState._shade + shadeChange}, util);
    }

    /**
     * Update the arduino state's color from its hue & shade values, Scratch 2.0 style.
     * @param {object} arduinoState - update the HSV & RGB values in this arduino state from its hue & shade values.
     * @private
     */
    _legacyUpdateARduinoColor (arduinoState) {
        // Create the new color in RGB using the scratch 2 "shade" model
        let rgb = Color.hsvToRgb({h: arduinoState.color * 360 / 100, s: 1, v: 1});
        const shade = (arduinoState._shade > 100) ? 200 - arduinoState._shade : arduinoState._shade;
        if (shade < 50) {
            rgb = Color.mixRgb(Color.RGB_BLACK, rgb, (10 + shade) / 60);
        } else {
            rgb = Color.mixRgb(rgb, Color.RGB_WHITE, (shade - 50) / 60);
        }

        // Update the arduino state according to new color
        const hsv = Color.rgbToHsv(rgb);
        arduinoState.color = 100 * hsv.h / 360;
        arduinoState.saturation = 100 * hsv.s;
        arduinoState.brightness = 100 * hsv.v;

        this._updateARduinoColor(arduinoState);
    }
}

module.exports = Scratch3ARduinoBlocks;

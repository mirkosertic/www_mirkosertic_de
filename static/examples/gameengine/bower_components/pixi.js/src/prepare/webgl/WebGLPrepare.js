import * as core from '../../core';
import BasePrepare from '../BasePrepare';

/**
 * The prepare manager provides functionality to upload content to the GPU.
 *
 * @class
 * @memberof PIXI
 */
export default class WebGLPrepare extends BasePrepare
{
    /**
     * @param {PIXI.WebGLRenderer} renderer - A reference to the current renderer
     */
    constructor(renderer)
    {
        super(renderer);

        this.uploadHookHelper = this.renderer;

        // Add textures and graphics to upload
        this.register(findBaseTextures, uploadBaseTextures)
            .register(findGraphics, uploadGraphics);
    }

}

/**
 * Built-in hook to upload PIXI.Texture objects to the GPU.
 *
 * @private
 * @param {PIXI.WebGLRenderer} renderer - instance of the webgl renderer
 * @param {PIXI.DisplayObject} item - Item to check
 * @return {boolean} If item was uploaded.
 */
function uploadBaseTextures(renderer, item)
{
    if (item instanceof core.BaseTexture)
    {
        // if the texture already has a GL texture, then the texture has been prepared or rendered
        // before now. If the texture changed, then the changer should be calling texture.update() which
        // reuploads the texture without need for preparing it again
        if (!item._glTextures[renderer.CONTEXT_UID])
        {
            renderer.textureManager.updateTexture(item);
        }

        return true;
    }

    return false;
}

/**
 * Built-in hook to upload PIXI.Graphics to the GPU.
 *
 * @private
 * @param {PIXI.WebGLRenderer} renderer - instance of the webgl renderer
 * @param {PIXI.DisplayObject} item - Item to check
 * @return {boolean} If item was uploaded.
 */
function uploadGraphics(renderer, item)
{
    if (item instanceof core.Graphics)
    {
        // if the item is not dirty and already has webgl data, then it got prepared or rendered
        // before now and we shouldn't waste time updating it again
        if (item.dirty || item.clearDirty || !item._webGL[renderer.plugins.graphics.CONTEXT_UID])
        {
            renderer.plugins.graphics.updateGraphics(item);
        }

        return true;
    }

    return false;
}

/**
 * Built-in hook to find textures from Sprites.
 *
 * @private
 * @param {PIXI.DisplayObject} item - Display object to check
 * @param {Array<*>} queue - Collection of items to upload
 * @return {boolean} if a PIXI.Texture object was found.
 */
function findBaseTextures(item, queue)
{
    // Objects with textures, like Sprites/Text
    if (item instanceof core.BaseTexture)
    {
        if (queue.indexOf(item) === -1)
        {
            queue.push(item);
        }

        return true;
    }
    else if (item._texture && item._texture instanceof core.Texture)
    {
        const texture = item._texture.baseTexture;

        if (queue.indexOf(texture) === -1)
        {
            queue.push(texture);
        }

        return true;
    }

    return false;
}

/**
 * Built-in hook to find graphics.
 *
 * @private
 * @param {PIXI.DisplayObject} item - Display object to check
 * @param {Array<*>} queue - Collection of items to upload
 * @return {boolean} if a PIXI.Graphics object was found.
 */
function findGraphics(item, queue)
{
    if (item instanceof core.Graphics)
    {
        queue.push(item);

        return true;
    }

    return false;
}

core.WebGLRenderer.registerPlugin('prepare', WebGLPrepare);

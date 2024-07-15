import Tool from '@recogito/annotorious/src/tools/Tool';
import RubberbandFreehand from './RubberbandFreehand';
import EditableFreehand from './EditableFreehand';

/**
 * A rubberband selector for freehand fragments.
 */
export default class RubberbandFreehandTool extends Tool {

  constructor(g, config, env) {
    super(g, config, env);

    this._isDrawing = false;
  }

  startDrawing = (x, y) => {
    this._isDrawing = true;
    
    this.attachListeners({
      mouseMove: this.onMouseMove,
      mouseUp: this.onMouseUp,
      dblClick: this.onDblClick
    });
    
    this.rubberband = new RubberbandFreehand([ x, y ], this.g, this.env);
  }

  stop = () => {
    this.detachListeners();
    
    this._isDrawing = false;

    if (this.rubberband) {
      this.rubberband.destroy();
      this.rubberband = null;
    }
  }

  onMouseMove = (x, y) =>
    this.rubberband.dragTo([ x, y ]);

  onMouseUp = (x, y) => {
    this.onDblClick(x, y);
  }

  onDblClick = (x, y) => {
    this._isDrawing = false;

    this.rubberband.addPoint([ x, y ]);

    this.detachListeners();

    const { width, height } = this.rubberband.getBoundingClientRect();

    const minWidth = this.config.minSelectionWidth || 4;
    const minHeight = this.config.minSelectionHeight || 4;

    if (width >= minWidth || height >= minHeight) {

      const shape = this.rubberband.element;
      shape.annotation = this.rubberband.toSelection();

      this.emit('complete', shape);
    } else {
      this.emit('cancel');
    }

    this.stop();
  }

  get isDrawing() {
    return this._isDrawing;
  }

  createEditableShape = annotation =>
    new EditableFreehand(annotation, this.g, this.config, this.env);

}

RubberbandFreehandTool.identifier = 'freehand';

RubberbandFreehandTool.supports = annotation => {
  const selector = annotation.selector('SvgSelector');
  if (selector)
    return (selector.value.match(/^<svg.*<path*/g) && !selector.value.toUpperCase().includes('Z'));
}
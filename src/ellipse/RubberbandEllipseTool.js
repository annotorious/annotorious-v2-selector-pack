import Tool from '@recogito/annotorious/src/tools/Tool';
import RubberbandEllipse from './RubberbandEllipse';
import EditableEllipse from './EditableEllipse';

/**
 * A rubberband selector for ellipse selections.
 */
export default class RubberbandEllipseTool extends Tool {

  constructor(g, config, env) {
    super(g, config, env);

    this.rubberband = null;
  }

  startDrawing = (x, y) => {
    this.attachListeners({
      mouseMove: this.onMouseMove,
      mouseUp: this.onMouseUp
    });

    this.rubberband = new RubberbandEllipse(x, y, this.g, this.env);
  }

  stop = () => {
    if (this.rubberband) {
      this.rubberband.destroy();
      this.rubberband = null;
    }
  }

  onMouseMove = (x, y) =>
    this.rubberband.dragTo(x, y);
  
  onMouseUp = () => {
    this.detachListeners();
    this.started = false;

    const { width, height } = this.rubberband.getBoundingClientRect();

    const minWidth = this.config.minSelectionWidth || 4;
    const minHeight = this.config.minSelectionHeight || 4;

    if (width >= minWidth && height >= minHeight) {
      // Emit the SVG shape with selection attached    
      const { element } = this.rubberband;
      element.annotation = this.rubberband.toSelection();

      // Emit the completed shape...
      this.emit('complete', element);
    } else {
      this.emit('cancel');
    }

    this.stop();
  }

  get isDrawing() {
    return this.rubberband != null;
  }
  
  createEditableShape = annotation =>
    new EditableEllipse(annotation, this.g, this.config, this.env);

}

RubberbandEllipseTool.identifier = 'ellipse';

RubberbandEllipseTool.supports = annotation => {
  const selector = annotation.selector('SvgSelector');
  if (selector)
    return selector.value?.match(/^<svg.*<ellipse/g);
}
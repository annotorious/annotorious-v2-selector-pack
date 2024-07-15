import Tool from '@recogito/annotorious/src/tools/Tool';
import RubberbandMultipolygon from './RubberbandMultipolygon';
import EditableMultipolygon from './EditableMultipolygon';

export const getPath = (points) => {
  const round = num => Math.round(10 * num) / 10;
  let path = ""
  for (let pointList of points){
    path += "M"
    let first = true
    for (let point of pointList){
      if (first){
        first = false
        path += round(point.x).toString() + "," + round(point.y).toString()
      } else {
        path += " L" + round(point.x).toString() + "," + round(point.y).toString()
      }
    }
    path += " Z"
  }
  return path
}
export const toSVGTarget = (points, image) => ({
  source: image?.src,
  selector: {
    type: "SvgSelector",
    value: `<svg><path d="${getPath(points)}" /></svg>`
  }
});

export default class RubberbandMultipolygonTool extends Tool {

  constructor(g, config, env) {
    super(g, config, env);
    this._isDrawing = false;
    this.viewer = null
    window.addEventListener('keydown', evt => {
      if (evt.key === "z" && evt.ctrlKey) {
        this.undo();
      } else if (evt.key === 'n' || evt.key === 'p') {
        this.newPart();
      }
    },true);
    this._startOnSingleClick = false;
  }
  get isDrawing() {
    return this._isDrawing;
  }

  startDrawing = (x, y, startOnSingleClick, evt) => {
    this._isDrawing = true
    if (!startOnSingleClick){
      this._startOnSingleClick = false
    } else {
      this._startOnSingleClick = startOnSingleClick;
    }
    // this.svg.addEventListener('mousedown', this.onMouseDown);
    this.attachListeners({
      mouseMove: this.onMouseMove,
      mouseUp: this.onMouseUp,
      dblClick: this.onDblClick
    });

    this.rubberband = new RubberbandMultipolygon([ x, y ], this.g, this.config, this.env);
    this.rubberband.on('close', ({ shape, selection }) => {
      shape.annotation = selection;
      this.emit('complete', shape);
      this.stop();
    });
  }

  stop = () => {
    this.detachListeners();

    this._isDrawing = false;

    if (this.rubberband) {
      this.rubberband.destroy();
      this.rubberband = null;
    }
  }

  undo = () =>{
    if (this.rubberband){
      this.rubberband.undo();

    }
  }

  newPart = () =>{
    if (this.rubberband){
      this.rubberband.newPart();

    }
  }

  onMouseMove = (x, y, evt) => {
    this.rubberband.dragTo([ x, y ]);
  }

  onMouseUp = (x, y, evt) => {
    if (evt.altKey){
      this.complete(x,y);
    } else if (evt.ctrlKey) {
      this.rubberband.undo();
    } else if (evt.shiftKey && this.rubberband.points.length>2) {
      this.newPart();
    } else{
      const { width, height } = this.rubberband.getBoundingClientRect();
      const minWidth = this.config.minSelectionWidth || 4;
      const minHeight = this.config.minSelectionHeight || 4;
      if (width >= minWidth || height >= minHeight) {
        this.rubberband.addPoint([ x, y ]);
      } else {
        this.emit('cancel');
        this.stop();
      }
    }
  }

  onScaleChanged = scale => {
    if (this.rubberband)
      this.rubberband.onScaleChanged(scale);
  }

  onDblClick = (x, y) => {
    if (this.config.completeWithDoubleClick){
      this.complete(x,y);
    }
  }

  complete = (x, y) => {
    this._isDrawing = false;
    this.rubberband.addPoint([ x, y ]);

    const shape = this.rubberband.element;
    shape.annotation = this.rubberband.toSelection();
    this.emit('complete', shape);
    this.stop();
  }

  createEditableShape = annotation =>
    new EditableMultipolygon(annotation, this.g, this.config, this.env);

}

RubberbandMultipolygonTool.identifier = 'multipolygon';

RubberbandMultipolygonTool.supports = annotation => {
  const selector = annotation.selector('SvgSelector');
  if (selector)
    return selector.value?.match(/^<svg.*<path d=/g);
}
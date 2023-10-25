import RBush from 'rbush';
import Tool from '@recogito/annotorious/src/tools/Tool';
import RubberbandBetterMultipolygon from './RubberbandBetterMultipolygon';
import EditableBetterMultipolygon from './EditableBetterMultipolygon';
import { isTouchDevice } from '@recogito/annotorious/src/util/Touch';

/**
 * A rubberband selector for Multipolygon fragments.
 */
class MyRBush extends RBush {
  toBBox([x, y]) { return {minX: x, minY: y, maxX: x, maxY: y}; }
  compareMinX(a, b) { return a.x - b.x; }
  compareMinY(a, b) { return a.y - b.y; }
}

const isTouch = isTouchDevice();
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

export default class RubberbandBetterMultipolygonTool extends Tool {

  constructor(g, config, env) {
    super(g, config, env);
    this._isDrawing = false;
    this.startTime = -1
    this.contourPointsFunc = null
    this.contourPoints = []
    this.contourPointsRBush = new MyRBush()
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

  startDrawing = (x, y, startOnSingleClick, evt, contourPoints) => {
    this._isDrawing = true
    console.log("start drawing. startTime:", Date.now());
    this.startTime = Date.now()
    this.contourPoints = contourPoints;
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
    
    this.rubberband = new RubberbandBetterMultipolygon([ x, y ], this.g, this.config, this.env);
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
    if (false){
      if (this.contourPoints){
        if (this.contourPoints.length !== 0){
          if (this.contourPoints.length > 0){
            const closest = this.contourPointsRBush.search({
              minX: (x - 10),
              minY: (y - 10),
              maxX: (x + 10),
              maxY: (y + 10)
            })
            let closestPoint = {
              "point": [0,0],
              "dist": 100
            }
            for (const closePoint of closest){
              const dist = Math.hypot(x-closePoint[0], y-closePoint[1])
              
              if (dist < closestPoint.dist){
                closestPoint.point = closePoint
                closestPoint.dist = dist
              }
            }
            if (closestPoint.dist < 5){
              this.rubberband.addPoint([ x, y ]);
            }
  
          }
        } else {
        }
      }
    }
  }
  setContourPoints(contourPoints, viewer){
    this.contourPointsFunc = contourPoints
    this.viewer = viewer
  }

  onMouseUp = (x, y, evt) => {
    if (evt.altKey){
      this.onDblClickOld(evt);
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
  onDblClickOld = (x, y) => {
    this._isDrawing = false;
    this.rubberband.addPoint([ x, y ]);

    const shape = this.rubberband.element;
    shape.annotation = this.rubberband.toSelection();
    shape.annotation.underlying["generated"] = this.startTime;
    this.emit('complete', shape);

    this.stop();
  }

  onDblClick = (x, y) => {
  }

  createEditableShape = annotation => 
    new EditableBetterMultipolygon(annotation, this.g, this.config, this.env);

}

RubberbandBetterMultipolygonTool.identifier = 'bettermultipolygon';

RubberbandBetterMultipolygonTool.supports = annotation => {
  const selector = annotation.selector('SvgSelector');
  if (selector)
    return selector.value?.match(/^<svg.*<path d=/g);
}
import { Selection, ToolLike } from '@recogito/annotorious/src/tools/Tool';
import { toSVGTarget } from '@recogito/annotorious/src/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
//import Mask from './MultipolygonMask';
// TODO optional: mask to dim the outside area
//import Mask from './multipolygonMask';

/**
 * A 'rubberband' selection tool for creating multipolygon drawing by
 * clicking and dragging.
 */
export default class RubberbandMultipolygon extends ToolLike  {

  constructor(anchor, g, config, env) {
    super(g, config, env);
    //super(g, config, env);
    this.points = [];
    this.points.push([ anchor, anchor ])
    this.mousepos = anchor;

    this.env = env;
    this.scale = 1;

    this.group = document.createElementNS(SVG_NAMESPACE, 'g');
    this.multipolygon = document.createElementNS(SVG_NAMESPACE, 'g');
    this.multipolygon.setAttribute('class', 'a9s-selection a9s-multipolygon improved-polygon');

    this.rubberband = document.createElementNS(SVG_NAMESPACE, 'polygon');
    this.rubberband.setAttribute('class', 'a9s-rubberband');

    this.closeHandle = this.drawHandle(anchor[0], anchor[1]);
    this.closeHandle.style.display = 'none';

    this.outer = document.createElementNS(SVG_NAMESPACE, 'path');
    this.outer.setAttribute('class', 'a9s-outer');

    this.inner = document.createElementNS(SVG_NAMESPACE, 'path');
    this.inner.setAttribute('class', 'a9s-inner');

    this.setPoints(this.points);
    //this.mask = new Mask(env.image, this.inner);

   // TODO optional: mask to dim the outside area
   // this.mask = new Mask(env.image, this.inner);

    this.multipolygon.appendChild(this.rubberband)
    this.multipolygon.appendChild(this.outer);
    this.multipolygon.appendChild(this.inner);
    this.multipolygon.appendChild(this.closeHandle);

    // Additionally, selection remains hidden until
    // the user actually moves the mouse
    this.group.style.display = 'none';

    // TODO optional: mask to dim the outside area
    // this.group.appendChild(this.mask.element);
    //this.group.appendChild(this.mask.element);
    this.group.appendChild(this.multipolygon);

    g.appendChild(this.group);
  }

  setPoints = points => {
    var attr ="";
    for (var ps of points){
      var attr2=""
      if (ps.length>0){
        for (var p of ps) {
          if (p){
            if (attr2===""){
              attr2  +=`M${p[0]},${p[1]}`;
            }
            else{
              attr2  +=` L${p[0]},${p[1]}`;
            }
          }
        };
         attr+=attr2
      }
    }
    attr+=" Z"
    this.outer.setAttribute('d', attr);
    this.inner.setAttribute('d', attr);
  }
  close = () => {
    const multipolygon = new multipolygon(toSVGTarget(this.points, this.env.image));
    this.emit('close', { shape: this.multipolygon, multipolygon });
  }

  getBoundingClientRect = () => {
     return this.outer.getBoundingClientRect();
  }

  dragTo = xy => {
    // Make visible
    this.group.style.display = null;
    this.mousepos = xy;
    const head = this.points[this.points.length - 1].slice(0, this.points[this.points.length - 1].length - 1);
    var headRest=this.points.slice(0,-1)
    const rubberband = [ ...head, xy, head[0] ];
    headRest.push(rubberband)
    this.setPoints(headRest);
    //this.mask.redraw();
  }
  onScaleChanged = scale => {
    this.scale = scale;

    const inner = this.closeHandle.querySelector('.a9s-handle-inner');
    const outer = this.closeHandle.querySelector('.a9s-handle-outer');

    const radius = scale * (this.config.handleRadius || 6);

    inner.setAttribute('r', radius);
    outer.setAttribute('r', radius);
  }

  addPoint = xy => {
    // Don't add a new point if distance < 2 pixels
    if (this.points[this.points.length - 1].length>0){
      const head = this.points[this.points.length - 1].slice(0, this.points[this.points.length - 1].length - 1);
      const lastCorner = head[head.length - 1];
      const dist = Math.pow(xy[0] - lastCorner[0], 2) + Math.pow(xy[1] - lastCorner[1], 2);
      if (dist > 4) {
        this.points[this.points.length - 1] = [ ...head, xy, head[0] ];
        this.setPoints(this.points);
        //this.mask.redraw();
      }
    } else{
      this.points[this.points.length - 1] = [xy,xy];
      this.setPoints(this.points);
    }
  }
  undo = () => {
    this.pop()
  }

  isClosable = () => {
    const d = this.getDistanceToStart();
    return d < 6 * this.scale;
  }
  /** Removes last corner **/
  pop = () => {
    if (this.points[this.points.length - 1].length>2){
      this.points[this.points.length - 1].pop();
    } else {
      if (this.points.length>1){
        this.points.pop()
      }
    }
    this.setPoints(this.points);
    // this.mask.redraw();
  }

  newPart = () => {
    this.points.push([]);
  }

  get element() {
    return this.multipolygon;
  }
  getDistanceToStart = () => {
    if (this.points[this.points.length-1].length < 3)
      return Infinity; // Just return if not at least 3 points

    const dx = Math.abs(this.mousepos[0] - this.points[this.points.length-1][0][0]);
    const dy = Math.abs(this.mousepos[1] - this.points[this.points.length-1][0][1]);

    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2)) / this.scale;
  }

  destroy = () => {
    this.group.parentNode.removeChild(this.group);
    this.multipolygon = null;
    this.group = null;
  }
  toSelection = () => {
    return new Selection(toSVGTarget(this.group, this.env.image));
  }

}

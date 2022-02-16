import { Selection } from '@recogito/annotorious/src/tools/Tool';
import { toSVGTarget } from '@recogito/annotorious/src/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
import Mask from '@recogito/annotorious/src/tools/polygon/PolygonMask';

// TODO optional: mask to dim the outside area
//import Mask from './multipolygonMask';

/**
 * A 'rubberband' selection tool for creating multipolygon drawing by
 * clicking and dragging.
 */
export default class RubberbandMultipolygon {

  constructor(anchor, g, env) {
    this.points =  [];
    this.points.push([ anchor, anchor ])

    this.env = env;

    this.group = document.createElementNS(SVG_NAMESPACE, 'g');

    this.multipolygon = document.createElementNS(SVG_NAMESPACE, 'g');
    this.multipolygon.setAttribute('class', 'a9s-selection');

    this.outer = document.createElementNS(SVG_NAMESPACE, 'path');
    this.outer.setAttribute('class', 'a9s-outer');

    this.inner = document.createElementNS(SVG_NAMESPACE, 'path');
    this.inner.setAttribute('class', 'a9s-inner');

    this.setPoints(this.points);
    this.mask = new Mask(env.image, this.inner);

    // TODO optional: mask to dim the outside area
    // this.mask = new Mask(env.image, this.inner);

    this.multipolygon.appendChild(this.outer);
    this.multipolygon.appendChild(this.inner);

    // Additionally, selection remains hidden until 
    // the user actually moves the mouse
    this.group.style.display = 'none';

    // TODO optional: mask to dim the outside area
    // this.group.appendChild(this.mask.element);
    this.group.appendChild(this.mask.element);
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

  getBoundingClientRect = () =>
    this.outer.getBoundingClientRect();

  dragTo = xy => {
    // Make visible
    this.group.style.display = null;
    const head = this.points[this.points.length - 1].slice(0, this.points[this.points.length - 1].length - 1);
    var headRest=this.points.slice(0,-1)
    const rubberband = [ ...head, xy, head[0] ];
    headRest.push(rubberband)
    this.setPoints(headRest);
    this.mask.redraw();
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
        this.mask.redraw();
      } 
    } else{
      this.points[this.points.length - 1] = [xy,xy];
      this.setPoints(this.points);
    }
  }

  undo = () => {
    if (this.points[this.points.length - 1].length>2){
      this.points[this.points.length - 1].pop();
    } else {
      if (this.points.length>1){
        this.points.pop()
      }
    }
  }

  newPart = () => {
    this.points.push([]);
  }
 
  get element() {
    return this.multipolygon;
  }

  destroy = () => {
    this.group.parentNode.removeChild(this.group);
    this.multipolygon = null;    
    this.group = null;
  }

  toSelection = () =>
    new Selection({
      ...toSVGTarget(this.group, this.env.image),
      renderedVia: {
        name: 'multipolygon'
      }
    });

}

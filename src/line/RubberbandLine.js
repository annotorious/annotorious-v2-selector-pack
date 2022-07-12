import { Selection } from '@recogito/annotorious/src/tools/Tool';
import { toSVGTarget } from '@recogito/annotorious/src/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
import Mask from './LineMask';


/**
 * A 'rubberband' selection tool for creating Line drawing by
 * clicking and dragging.
 */
export default class RubberbandLine {

  constructor(anchor, g, env) {
    this.points =  anchor
    //this.points.push([ anchor, anchor ])

    this.env = env;

    this.group = document.createElementNS(SVG_NAMESPACE, 'g');

    this.Line = document.createElementNS(SVG_NAMESPACE, 'g');
    this.Line.setAttribute('class', 'a9s-selection');

    this.outer = document.createElementNS(SVG_NAMESPACE, 'line');
    this.outer.setAttribute('class', 'a9s-outer');

    this.inner = document.createElementNS(SVG_NAMESPACE, 'line');
    this.inner.setAttribute('class', 'a9s-inner');

    this.setPoints(this.points);
    this.mask = new Mask(env.image, this.inner);

    // TODO optional: mask to dim the outside area
    // this.mask = new Mask(env.image, this.inner);

    this.Line.appendChild(this.outer);
    this.Line.appendChild(this.inner);

    // Additionally, selection remains hidden until 
    // the user actually moves the mouse
    this.group.style.display = 'none';

    // TODO optional: mask to dim the outside area
    // this.group.appendChild(this.mask.element);
    this.group.appendChild(this.mask.element);
    this.group.appendChild(this.Line);

    g.appendChild(this.group);
  }

  setPoints = points => {
    const attr = points;
    // set attribute for line svg element for outer and inner
    // example: <line x1="0" y1="80" x2="100" y2="20" stroke="black" />
    this.outer.setAttribute('x1', attr[0]);
    this.inner.setAttribute('x1', attr[0]);
    this.outer.setAttribute('y1', attr[1]);
    this.inner.setAttribute('y1', attr[1]);
    if(attr.length > 2) {
    this.outer.setAttribute('x2', attr[2]);
    this.inner.setAttribute('x2', attr[2]);
    this.outer.setAttribute('y2', attr[3]);
    this.inner.setAttribute('y2', attr[3]);
    }
  }

  getBoundingClientRect = () =>
    this.outer.getBoundingClientRect();

  dragTo = xy => {
    // Make visible
    this.group.style.display = null;

    this.mousepos = xy;
    //console.log(xy);
    const rubberband = [ ...this.points, xy[0], xy[1] ];
    
    this.setPoints(rubberband);
    this.mask.redraw();
  }
  
  addPoint = xy => {
    // Don't add a new point if distance < 2 pixels
    if (this.points.length <= 2) {
      this.points[2] = xy[0];
      this.points[3] = xy[1];
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
    return this.Line;
  }

  destroy = () => {
    this.group.parentNode.removeChild(this.group);
    this.Line = null;    
    this.group = null;
  }

  toSelection = () =>
    new Selection({
      ...toSVGTarget(this.group, this.env.image),
      renderedVia: {
        name: 'line'
      }
    });

}

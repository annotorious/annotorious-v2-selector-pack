import { Selection } from '@recogito/annotorious/src/tools/Tool';
import { toSVGTarget } from '@recogito/annotorious/src/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
import { drawEllipse, setEllipseSize } from './Ellipse';
import Mask from './EllipseMask';

/**
 * A 'rubberband' selection tool for creating a ellipse by
 * clicking and dragging.
 */
export default class RubberbandEllipse {

  constructor(anchorX, anchorY, g, env) {
    this.anchor = [ anchorX, anchorY ];

    this.env = env;

    this.group = document.createElementNS(SVG_NAMESPACE, 'g');

    this.ellipse = drawEllipse(anchorX, anchorY, 2);
    this.ellipse.setAttribute('class', 'a9s-selection');

    this.mask = new Mask(env.image, this.ellipse);

    // We make the selection transparent to 
    // pointer events because it would interfere with the 
    // rendered annotations' mouseleave/enter events
    this.group.style.pointerEvents = 'none';

    // Additionally, selection remains hidden until 
    // the user actually moves the mouse
    this.group.style.display = 'none';

    this.group.appendChild(this.mask.element);
    this.group.appendChild(this.ellipse);

    g.appendChild(this.group);
  }

  get element() {
    return this.ellipse;
  }

  dragTo = (oppositeX, oppositeY) => {
    // Make visible
    this.group.style.display = null;

    const w = oppositeX - this.anchor[0];
    const h = oppositeY - this.anchor[1];

    const cx = w > 0 ? this.anchor[0] + w / 2 : oppositeX + w / 2;
    const cy = h > 0 ? this.anchor[1] + h / 2 : oppositeY + h / 2;

    const rx = Math.abs(w / 2);
    const ry = Math.abs(h / 2);

    setEllipseSize(this.ellipse, cx, cy, rx, ry);
    this.mask.redraw();
  }

  getBoundingClientRect = () => 
    this.ellipse.getBoundingClientRect();

  toSelection = () => {
    return new Selection(toSVGTarget(this.group, this.env.image));
  }

  destroy = () => {
    this.group.parentNode.removeChild(this.group);

    this.mask = null;
    this.ellipse = null;
    this.group = null;
  }

}
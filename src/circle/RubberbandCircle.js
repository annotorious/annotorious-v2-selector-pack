import { Selection } from '@recogito/annotorious/src/tools/Tool';
import { toSVGTarget } from '@recogito/annotorious/src/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
import { drawCircle, setCircleSize } from './Circle';
import Mask from './CircleMask';

/**
 * A 'rubberband' selection tool for creating a circle by
 * clicking and dragging.
 */
export default class RubberbandCircle {

  constructor(anchorX, anchorY, g, env) {
    this.anchor = [ anchorX, anchorY ];

    this.env = env;

    this.group = document.createElementNS(SVG_NAMESPACE, 'g');

    this.circle = drawCircle(anchorX, anchorY, 2);
    this.circle.setAttribute('class', 'a9s-selection');

    this.mask = new Mask(env.image, this.circle);

    // We make the selection transparent to 
    // pointer events because it would interfere with the 
    // rendered annotations' mouseleave/enter events
    this.group.style.pointerEvents = 'none';

    // Additionally, selection remains hidden until 
    // the user actually moves the mouse
    this.group.style.display = 'none';

    this.group.appendChild(this.mask.element);
    this.group.appendChild(this.circle);

    g.appendChild(this.group);
  }

  get element() {
    return this.circle;
  }

  dragTo = (oppositeX, oppositeY) => {
    const { naturalWidth, naturalHeight } = this.env.image;

    // Make visible
    this.group.style.display = null;

    const w = oppositeX - this.anchor[0];
    const h = oppositeY - this.anchor[1];
    const r = Math.max(1, Math.pow(w ** 2 + h ** 2, 0.5) / 2);

    const cx = this.anchor[0] + w / 2;
    const cy = this.anchor[1] + h / 2;

    if ((cx-r < 0 || cx + r > naturalWidth) || (cy-r < 0 || cy + r > naturalHeight)) return;
    
    setCircleSize(this.circle, cx, cy, r);
    this.mask.redraw();
  }

  getBoundingClientRect = () => 
    this.circle.getBoundingClientRect();

  toSelection = () => {
    return new Selection(toSVGTarget(this.group, this.env.image));
  }

  destroy = () => {
    this.group.parentNode.removeChild(this.group);

    this.mask = null;
    this.circle = null;
    this.group = null;
  }

}
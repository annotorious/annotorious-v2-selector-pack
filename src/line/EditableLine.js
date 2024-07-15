import EditableShape from '@recogito/annotorious/src/tools/EditableShape';
import { drawEmbeddedSVG, svgFragmentToShape, toSVGTarget } from '@recogito/annotorious/src/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
import { format, setFormatterElSize } from '@recogito/annotorious/src/util/Formatting';
import Mask from './LineMask';

const getPoints = shape => {
  // Could just be Array.from(shape.querySelector('.inner').points) but...
  // IE11 :-(
  const innerElement = shape.querySelector('.a9s-inner');
  const points = [
    [innerElement.x1.baseVal, innerElement.y1.baseVal],
    [innerElement.x2.baseVal, innerElement.y2.baseVal]
  ];

  return points;
}

const getBBox = shape =>
  shape.querySelector('.a9s-inner').getBBox();

/**
 * An editable line shape.
 */
export default class EditableLine extends EditableShape {

  constructor(annotation, g, config, env) {
    super(annotation, g, config, env);

    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);

    // SVG markup for this class looks like this:
    //
    // <g>
    //   <path class="a9s-selection mask"... />
    //   <g> <-- return this node as .element
    //     <line class="a9s-outer" ... />
    //     <line class="a9s-inner" ... />
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //     ...
    //   </g>
    // </g>

    // 'g' for the editable line shape
    this.containerGroup = document.createElementNS(SVG_NAMESPACE, 'g');

    this.shape = drawEmbeddedSVG(annotation);
    this.shape.querySelector('.a9s-inner')
      .addEventListener('mousedown', this.onGrab(this.shape));

    this.mask = new Mask(env.image, this.shape.querySelector('.a9s-inner'));

    this.containerGroup.appendChild(this.mask.element);

    this.elementGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    this.elementGroup.setAttribute('class', 'a9s-annotation editable selected');
    this.elementGroup.setAttribute('data-id', annotation.id);
    this.elementGroup.appendChild(this.shape);

    this.handles = getPoints(this.shape).map(pt => {
      const handle = this.drawHandle(pt[0].value, pt[1].value);
      handle.addEventListener('mousedown', this.onGrab(handle));
      this.elementGroup.appendChild(handle);
      return handle;
    });

    this.containerGroup.appendChild(this.elementGroup);
    g.appendChild(this.containerGroup);

    format(this.shape, annotation, config.formatters);

    // The grabbed element (handle or entire shape), if any
    this.grabbedElem = null;

    // Mouse grab point
    this.grabbedAt = null;
  }

  onScaleChanged = () => 
    this.handles.map(this.scaleHandle);

  setPoints = (points) => {
    // Not using .toFixed(1) because that will ALWAYS
    // return one decimal, e.g. "15.0" (when we want "15")
    const round = num =>
      Math.round(10 * num) / 10;

    var x1 = points[0].x;
    var y1 = points[0].y;
    var x2 = points[1].x;
    var y2 = points[1].y;
    const inner = this.shape.querySelector('.a9s-inner');
    inner.setAttribute('x1', x1);
    inner.setAttribute('y1', y1);
    inner.setAttribute('x2', x2);
    inner.setAttribute('y2', y2);

    const outer = this.shape.querySelector('.a9s-outer');
    outer.setAttribute('x1', x1);
    outer.setAttribute('y1', y1);
    outer.setAttribute('x2', x2);
    outer.setAttribute('y2', y2);

    this.mask.redraw();

    const { x, y, width, height } = outer.getBBox();
    setFormatterElSize(this.elementGroup, x, y, width, height);
  }

  onGrab = grabbedElem => evt => {
    if (evt.button !== 0) return;  // left click
    this.grabbedElem = grabbedElem;
    this.grabbedAt = this.getSVGPoint(evt);
  }

  onMouseMove = evt => {
    const constrain = (coord, delta, max) =>
      coord + delta < 0 ? -coord : (coord + delta > max ? max - coord : delta);

    if (this.grabbedElem) {
      const pos = this.getSVGPoint(evt);
      if (this.grabbedElem === this.shape) {
        const { x, y, width, height } = getBBox(this.shape);

        const { naturalWidth, naturalHeight } = this.env.image;

        const dx = constrain(x, pos.x - this.grabbedAt.x, naturalWidth - width);
        const dy = constrain(y, pos.y - this.grabbedAt.y, naturalHeight - height);

        const updatedPoints = getPoints(this.shape).map(pt =>
          ({ x: pt[0].value + dx, y: pt[1].value + dy }));

        this.grabbedAt = pos;

        this.setPoints(updatedPoints);
        updatedPoints.forEach((pt, idx) => this.setHandleXY(this.handles[idx], pt.x, pt.y));

        this.emit('update', toSVGTarget(this.shape, this.env.image));
      } else {
        const handleIdx = this.handles.indexOf(this.grabbedElem);

        const updatedPoints = getPoints(this.shape).map((pt, idx) =>
          (idx === handleIdx) ? pos : {'x':pt[0].value, 'y':pt[1].value});

        this.setPoints(updatedPoints);
        this.setHandleXY(this.handles[handleIdx], pos.x, pos.y);

        this.emit('update', toSVGTarget(this.shape, this.env.image));
      }
    }
  }

  onMouseUp = evt => {
    this.grabbedElem = null;
    this.grabbedAt = null;
  }

  get element() {
    return this.elementGroup;
  }

  // TODO: update this for line svg Attributes, currently not being used
  updateState = annotation => {
    const points = svgFragmentToShape(annotation)
      .getAttribute('points')
      .split(' ') // Split x/y tuples
      .map(xy => { 
        const [ x, y ] = xy.split(',').map(str => parseFloat(str.trim()));
        return { x, y };
      });
    
    this.setPoints(points);
    points.forEach((pt, idx) => this.setHandleXY(this.handles[idx], pt.x, pt.y));
  }

  destroy = () => {
    this.containerGroup.parentNode.removeChild(this.containerGroup);
    super.destroy();
  }

}

import EditableShape from '@recogito/annotorious/src/tools/EditableShape';
import { drawEmbeddedSVG, toSVGTarget } from '@recogito/annotorious/src/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
import { format, setFormatterElSize } from '@recogito/annotorious/src/util/Formatting';
//import { getFreehandSize, setFreehandSize } from './Freehand';
//import Mask from './FreeDrawingMask';

const getPoints = shape => {
  const pointList = shape.querySelector('.a9s-inner').getAttribute('d').split('L');
  const points = [];
  if(pointList.length > 0) {
    var point = pointList[0].substring(1).trim().split(' ');
    points.push({ x: point[0], y: point[1] });

    for (let i = 1; i < pointList.length; i++) {
      var point = pointList[i].trim().split(' ');
      points.push({ x: point[0], y: point[1] });
    }
  }

  return points;
}

const getBBox = shape => {
  return shape.querySelector('.a9s-inner').getBBox();
}

/**
 * An editable free drawing.
 */
export default class EditableFreehand extends EditableShape {

  constructor(annotation, g, config, env) {
    super(annotation, g, config, env);

    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);

    // SVG markup for this class looks like this:
    // 
    // <g>
    //   <path class="a9s-selection mask"... />
    //   <g> <-- return this node as .element
    //     <polygon class="a9s-outer" ... />
    //     <polygon class="a9s-inner" ... />
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //     ...
    //   </g> 
    // </g>

    // 'g' for the editable free drawing compound shape
    this.containerGroup = document.createElementNS(SVG_NAMESPACE, 'g');

    this.shape = drawEmbeddedSVG(annotation);
    this.shape.querySelector('.a9s-inner')
      .addEventListener('mousedown', this.onGrab(this.shape));

//    this.mask = new Mask(env.image, this.shape.querySelector('.a9s-inner'));
    
//    this.containerGroup.appendChild(this.mask.element);

    this.elementGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    this.elementGroup.setAttribute('class', 'a9s-annotation editable selected');
    this.elementGroup.appendChild(this.shape);

    const { x, y, width, height } = getBBox(this.shape);

    this.handles = [
      [ x, y ], 
      [ x + width, y ], 
      [ x + width, y + height ], 
      [ x, y + height ]
    ].map(t => { 
      const [ x, y ] = t;
      const handle = this.drawHandle(x, y);

      handle.addEventListener('mousedown', this.onGrab(handle));
      this.elementGroup.appendChild(handle);

      return handle;
    });

    this.containerGroup.appendChild(this.elementGroup);
    g.appendChild(this.containerGroup);

    format(this.shape, annotation, config.formatter);

    // The grabbed element (handle or entire shape), if any
    this.grabbedElem = null;

    // Mouse grab point
    this.grabbedAt = null;
  }

  setPoints = (points) => {
    // Not using .toFixed(1) because that will ALWAYS
    // return one decimal, e.g. "15.0" (when we want "15")
    const round = num => Math.round(10 * num) / 10;

    var str = points.map(pt => `L${round(pt.x)} ${round(pt.y)}`).join(' ');
    str = 'M' + str.substring(1);

    const inner = this.shape.querySelector('.a9s-inner');
    inner.setAttribute('d', str);

    const outer = this.shape.querySelector('.a9s-outer');
    outer.setAttribute('d', str);

//    this.mask.redraw();

    const { x, y, width, height } = outer.getBBox();
    setFormatterElSize(this.elementGroup, x, y, width, height);
  }

  stretchCorners = (draggedHandleIdx, anchorHandle, mousePos) => {
    //TODO implement
/*    const anchor = this.getHandleXY(anchorHandle);

    const width = mousePos.x - anchor.x;
    const height = mousePos.y - anchor.y;

    const x = width > 0 ? anchor.x : mousePos.x;
    const y = height > 0 ? anchor.y : mousePos.y;
    const w = Math.abs(width);
    const h = Math.abs(height);

    setRectSize(this.rectangle, x, y, w, h);
    setRectMaskSize(this.mask, this.env.image, x, y, w, h);
    setFormatterElSize(this.elementGroup, x, y, w, h);

    // Anchor (=opposite handle) stays in place, dragged handle moves with mouse
    this.setHandleXY(this.handles[draggedHandleIdx], mousePos.x, mousePos.y);

    // Handles left and right of the dragged handle
    const left = this.handles[(draggedHandleIdx + 3) % 4];
    this.setHandleXY(left, anchor.x, mousePos.y);

    const right = this.handles[(draggedHandleIdx + 5) % 4];
    this.setHandleXY(right, mousePos.x, anchor.y);*/

  }

  onGrab = grabbedElem => evt => {
    this.grabbedElem = grabbedElem;
    const pos = this.getSVGPoint(evt);
    const { x, y, w, h } = getBBox(this.shape);
    this.grabbedAt = { x: pos.x - x, y: pos.y - y };
  }

  onMouseMove = evt => {
    const constrain = (coord, delta, max) =>
      coord + delta < 0 ? -coord : (coord + delta > max ? max - coord : delta);

    if (this.grabbedElem) {
      const pos = this.getSVGPoint(evt);

      const { x, y, width, height } = getBBox(this.shape);

      if (this.grabbedElem === this.shape) {

        const { naturalWidth, naturalHeight } = this.env.image;

        const dx = constrain(x, pos.x - this.grabbedAt.x, naturalWidth - width);
        const dy = constrain(y, pos.y - this.grabbedAt.y, naturalHeight - height);

        const updatedPoints = getPoints(this.shape).map(pt => ({ x: pt.x + dx, y: pt.y + dy }));

        this.grabbedAt = pos;

        this.setPoints(updatedPoints);
        
        this.emit('update', toSVGTarget(this.shape, this.env.image));
      } else {
        const handleIdx = this.handles.indexOf(this.grabbedElem);
        const oppositeHandle = handleIdx < 2 ? 
          this.handles[handleIdx + 2] : this.handles[handleIdx - 2];

        this.stretchCorners(handleIdx, oppositeHandle, pos);

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

  destroy = () => {
    this.containerGroup.parentNode.removeChild(this.containerGroup);
    super.destroy();
  }

}

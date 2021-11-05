import EditableShape from '@recogito/annotorious/src/tools/EditableShape';
import { drawEmbeddedSVG, svgFragmentToShape, toSVGTarget } from '@recogito/annotorious/src/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
import { format, setFormatterElSize } from '@recogito/annotorious/src/util/Formatting';
import { getEllipseSize, setEllipseSize } from './Ellipse';
import Mask from './EllipseMask';

/**
 * An editable ellipse shape.
 */
export default class EditableEllipse extends EditableShape {

  constructor(annotation, g, config, env) {
    super(annotation, g, config, env);

    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);

    // SVG markup for this class looks like this:
    // 
    // <g>
    //   <path class="a9s-selection mask"... />
    //   <g> <-- return this node as .element
    //     <ellipse class="a9s-outer" ... />
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //     <g class="a9s-handle" ...> ... </g>
    //   </g> 
    // </g>

    // 'g' for the editable ellipse compound shape
    this.containerGroup = document.createElementNS(SVG_NAMESPACE, 'g');

    this.ellipse = drawEmbeddedSVG(annotation);
    this.ellipse.querySelector('.a9s-inner')
      .addEventListener('mousedown', this.onGrab(this.ellipse));

    this.mask = new Mask(env.image, this.ellipse);

    this.containerGroup.appendChild(this.mask.element);

    // The 'element' = ellipse + handles
    this.elementGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    this.elementGroup.setAttribute('class', 'a9s-annotation editable selected');
    this.elementGroup.appendChild(this.ellipse);    

    const { cx, cy, rx, ry } = getEllipseSize(this.ellipse);

    this.handles = [
      [ cx, cy - ry ],
      [ cx + rx, cy ],
      [ cx, cy + ry ],
      [ cx - rx, cy ]
    ].map(t => { 
      const [ x, y ] = t;
      const handle = this.drawHandle(x, y);

      handle.addEventListener('mousedown', this.onGrab(handle));
      this.elementGroup.appendChild(handle);

      return handle;
    });

    this.containerGroup.appendChild(this.elementGroup);
    g.appendChild(this.containerGroup);

    format(this.ellipse, annotation, config.formatter);

    // The grabbed element (handle or entire group), if any
    this.grabbedElem = null; 

    // Mouse xy offset inside the shape, if mouse pressed
    this.grabbedAt = null;
  }

  setSize = (cx, cy, rx, ry) => {
    setEllipseSize(this.ellipse, cx, cy, rx, ry);
    this.mask.redraw();
    setFormatterElSize(this.elementGroup, cx, cy, rx, ry);

    const [ topleft, topright, bottomright, bottomleft] = this.handles;
    this.setHandleXY(topleft, cx, cy - ry);
    this.setHandleXY(topright, cx + rx, cy);
    this.setHandleXY(bottomright, cx, cy + ry);
    this.setHandleXY(bottomleft, cx - rx, cy);
  }

  stretchCorners = (draggedHandleIdx, anchorHandle, leftHandle, mousePos) => {
    const anchor = this.getHandleXY(anchorHandle);
    const anchorLeft = this.getHandleXY(leftHandle);

    var mouseX = mousePos.x;
    var mouseY = mousePos.y;
    var rx = 0;
    var ry = 0;
    if(draggedHandleIdx == 0 || draggedHandleIdx == 2) {
      mouseX = anchor.x;
    } else {
      mouseY = anchor.y;
    }

    const width = mouseX - anchor.x;
    const height = mouseY - anchor.y;
    const x = width > 0 ? anchor.x : mouseX;
    const y = height > 0 ? anchor.y : mouseY;
    const w = Math.abs(width);
    const h = Math.abs(height);
    const cx = x + w/2;
    const cy = y + h/2;
    var rx = w/2;
    var ry = h/2;
    if(draggedHandleIdx == 0 || draggedHandleIdx == 2) {
      rx = Math.abs(anchor.x - anchorLeft.x);
    } else {
      ry = Math.abs(anchor.y - anchorLeft.y);
    }

    setEllipseSize(this.ellipse, cx, cy, rx, ry);
    this.mask.redraw();
    setFormatterElSize(this.elementGroup, cx, cy, rx, ry);

    if (draggedHandleIdx == 0 || draggedHandleIdx == 2) {
      var idx0 = 0;
      var idx2 = 2;
      if(draggedHandleIdx == 0 && height > 0 || draggedHandleIdx == 2 && height < 0) {
        idx0 = 2;
        idx2 = 0;
      }
      this.setHandleXY(this.handles[idx0], cx, cy - ry);
      this.setHandleXY(this.handles[idx2], cx, cy + ry);
      this.setHandleXY(this.handles[1], cx + rx, cy);
      this.setHandleXY(this.handles[3], cx - rx, cy);
    } else {
      var idx3 = 3;
      var idx1 = 1;
      if (draggedHandleIdx == 1 && width > 0 || draggedHandleIdx == 3 && width < 0) {
        idx3 = 1;
        idx1 = 3;
      }
      this.setHandleXY(this.handles[idx3], cx + rx, cy);
      this.setHandleXY(this.handles[idx1], cx - rx, cy);
      this.setHandleXY(this.handles[0], cx, cy - ry);
      this.setHandleXY(this.handles[2], cx, cy + ry);
    }
  }

  onGrab = grabbedElem => evt => {
    this.grabbedElem = grabbedElem; 

    const pos = this.getSVGPoint(evt);
    const { cx, cy } = getEllipseSize(this.ellipse);

    this.grabbedAt = { x: pos.x - cx, y: pos.y - cy };
  }

  onMouseMove = evt => {
    const constrain = (coord, max) =>
      coord < 0 ? 0 : ( coord > max ? max : coord);

    if (this.grabbedElem) {
      const pos = this.getSVGPoint(evt);

      if (this.grabbedElem === this.ellipse) {
        const { rx, ry } = getEllipseSize(this.ellipse);

        const { naturalWidth, naturalHeight } = this.env.image;

        const cx = constrain(pos.x - this.grabbedAt.x, naturalWidth - rx);
        const cy = constrain(pos.y - this.grabbedAt.y, naturalHeight - ry);

        this.setSize(cx, cy, rx, ry); 
        this.emit('update', toSVGTarget(this.ellipse, this.env.image));
      } else {
        // Mouse position replaces one of the corner coords, depending
        // on which handle is the grabbed element
        const handleIdx = this.handles.indexOf(this.grabbedElem);
        const oppositeHandle = handleIdx < 2 ? 
          this.handles[handleIdx + 2] : this.handles[handleIdx - 2];
        const leftHandle = this.handles[(handleIdx + 3) % 4];

        this.stretchCorners(handleIdx, oppositeHandle, leftHandle, pos);
        this.emit('update', toSVGTarget(this.ellipse, this.env.image));
      }
    }
  }

  onMouseUp = () => {
    this.grabbedElem = null;
    this.grabbedAt = null;
  }

  onScaleChanged = scale =>
    this.handles.map(this.scaleHandle);

  get element() { 
    return this.elementGroup; 
  }

  updateState = annotation => {
    const shape = svgFragmentToShape(annotation);

    const cx = parseFloat(shape.getAttribute('cx'));
    const cy = parseFloat(shape.getAttribute('cy'));
    const rx = parseFloat(shape.getAttribute('rx'));
    const ry = parseFloat(shape.getAttribute('ry'));
    
    this.setSize(cx, cy, rx, ry);
  }

  destroy() {
    this.containerGroup.parentNode.removeChild(this.containerGroup);
    super.destroy();
  }

}
import EditableShape from '@recogito/annotorious/src/tools/EditableShape';
import { svgFragmentToShape, toSVGTarget } from '@recogito/annotorious/src/selectors/EmbeddedSVG';
import { SVG_NAMESPACE } from '@recogito/annotorious/src/util/SVG';
import { format, setFormatterElSize } from '@recogito/annotorious/src/util/Formatting';

// TODO optional: mask to dim the outside area
//import Mask from './MultipolygonMask';

const getPoints = (shape) => {
  // Could just be Array.from(shape.querySelector('.inner').points) but...
  // IE11 :-(
  const pointLists = getPointsFromPathValue(shape.querySelector('.a9s-inner').attributes.d.nodeValue)
  const pointArray = [];
  for (let pointList of pointLists) {
    let points = []
    for (let point of pointList) {
      let p = {
        x:parseFloat(point[0]),
        y:parseFloat(point[1])
      }
      points.push(p);
    }
    pointArray.push(points);
  }

  return pointArray;
}
const getPointsFromPathValue = polygon => {
  var results =polygon.split('M');
  var allcoords = []
  results.forEach(function (result, index) {
    if (result.length>0){
      let coords = []
      result=result.replace(/ Z/g,"Z")
      result=result.replace(/Z /g,"Z")
      result=result.replace(/Z/g,"")
      result=result.replace(/L /g,"L")
      result=result.replace(/ L/g,"L")
      var coordsString = result.split("L")
      coordsString.forEach(function(coord, index){
        coords.push([parseFloat(coord.split(",")[0]).toFixed(2).toString(),parseFloat(coord.split(",")[1]).toFixed(2).toString()]);
      });
      if (coords[0] !== coords[coords.length - 1]){
        coords.push(coords[0])
      }
      allcoords.push(coords)
    }
  });
  return allcoords
}
const getBBox = shape => {
  return shape.querySelector('.a9s-inner').getBBox();
}
export const svgFragmentToPoints = annotation => {
  const svgShape = svgFragmentToShape(annotation);
  var polygon = svgShape.getAttribute('d')
  var allcoords =  getPointsFromPathValue(polygon)
  return allcoords
  //svgShape.getAttribute('d')
  //  .split(' ') // Split x/y tuples
  //  .map(xy => xy.split(',').map(str => parseFloat(str.trim())));
}

const drawEmbeddedSVG = annotation => {
  const shape = svgFragmentToShape(annotation);

  // Hack
  svgFragmentToPoints(annotation);

  // Because we're nitpicky, we don't just draw the shape,
  // but duplicate it, so we can have inner and an outer lines
  const g = document.createElementNS(SVG_NAMESPACE, 'g');

  const inner = shape.cloneNode(true);
  inner.setAttribute('class', 'a9s-inner');

  const outer = shape.cloneNode(true);
  outer.setAttribute('class', 'a9s-outer');

  g.appendChild(outer);
  g.appendChild(inner);

  return g;
}
/**
 * An editable multipolygon drawing.
 */
export default class EditableMultipolygon extends EditableShape {

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
   // TODO optional: mask to dim the outside area
   // this.mask = new Mask(env.image, this.shape.querySelector('.a9s-inner'));
    
   // this.containerGroup.appendChild(this.mask.element);

    this.elementGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    this.elementGroup.setAttribute('class', 'a9s-annotation editable selected');
    this.elementGroup.appendChild(this.shape);
    let pointList = getPoints(this.shape);
    this.handles = []
    for (let points of pointList){
      this.handles.push(points.map(pt => {
        const handle = this.drawHandle(pt.x, pt.y);
        handle.addEventListener('mousedown', this.onGrab(handle));
        this.elementGroup.appendChild(handle);
        return handle;
      }))
    } 


    this.containerGroup.appendChild(this.elementGroup);
    g.appendChild(this.containerGroup);

    format(this.shape, annotation, config.formatter);

    this.shape.querySelector('.a9s-inner')
      .addEventListener('mousedown', this.onGrab(this.shape));

    const { x, y, width, height } = getBBox(this.shape);

    // TODO optional: handles to stretch the shape
/*    this.handles = [
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
    });*/

    // The grabbed element (handle or entire shape), if any
    this.grabbedElem = null;

    // Mouse grab point
    this.grabbedAt = null;
  }

  setPoints = (points) => {
    const round = num =>
    Math.round(10 * num) / 10;

    let str = ""
    for (let pointList of points){
      str += "M"
      let first = true 
      for (let point of pointList){
        if (first){
          first = false
          str += point.x.toString() + "," + point.y.toString()
        } else {
          str += " L" + round(point.x).toString() + "," + round(point.y).toString()
        }
      }
      str += " Z"
    }
    const inner = this.shape.querySelector('.a9s-inner');
    inner.setAttribute('d', str);

    const outer = this.shape.querySelector('.a9s-outer');
    outer.setAttribute('d', str);

    // this.mask.redraw();

    const { x, y, width, height } = outer.getBBox();
    setFormatterElSize(this.elementGroup, x, y, width, height);
  }


    // TODO optional: handles to stretch the shape
/*  stretchCorners = (draggedHandleIdx, anchorHandle, mousePos) => {
    const anchor = this.getHandleXY(anchorHandle);
  }*/

  onGrab = grabbedElem => evt => {
    this.grabbedElem = grabbedElem;
    const pos = this.getSVGPoint(evt);
    this.grabbedAt = { x: pos.x, y: pos.y };
  }

  onMouseMove = evt => {
    if (this.grabbedElem) {

      const pos = this.getSVGPoint(evt);

      if (this.grabbedElem === this.shape) {
        const dx = pos.x - this.grabbedAt.x;
        const dy = pos.y - this.grabbedAt.y;

        let pointList = getPoints(this.shape)

        const updatedPoints = []
        for (let points of pointList){
          updatedPoints.push(points.map(pt =>
            ({ x: pt.x + dx, y: pt.y + dy })))
        } 
    
        this.grabbedAt = pos;

        this.setPoints(updatedPoints);
        let i = 0
        for (let updatedPointsList of updatedPoints){
            updatedPointsList.forEach((pt, idx) => { 
              if (this.handles[i][idx] !== undefined)
                this.setHandleXY(this.handles[i][idx], pt.x, pt.y)
            });
            i+=1
        }
        
        this.emit('update', {
          ...toSVGTarget(this.shape, this.env.image),
          renderedVia: {
            name: 'multipolygon'
          }
        });
      } else {
        let handleIdx = -1
        let pointListIDX = 0
        let found = false

        for (let handle of this.handles){
          if (handle.indexOf(this.grabbedElem)>0){
            handleIdx = handle.indexOf(this.grabbedElem);
            found=true
          } else {
            if (!found){
              pointListIDX += 1
            }
          }
        }
  
        let pointList = getPoints(this.shape)
  
        const updatedPoints = []
        let updatedPointsIDX = 0
        for (let points of pointList){
          if (updatedPointsIDX === pointListIDX){
            let newPoints = []
            points.forEach(function (value, i) {
              if (i === handleIdx){
                newPoints.push(pos)
              } else {
                newPoints.push(value)
              }
            });
            updatedPoints.push(newPoints)
          } else {
            updatedPoints.push(points)
          }
          updatedPointsIDX +=1
        } 
       
        this.setPoints(updatedPoints);
        updatedPointsIDX = 0
        for (let handle of this.handles){
          if (updatedPointsIDX === pointListIDX){

            this.setHandleXY(handle[handleIdx], pos.x, pos.y);
          }
          updatedPointsIDX +=1

        }
        
        this.emit('update', {
          ...toSVGTarget(this.shape, this.env.image),
          renderedVia: {
            name: 'multipolygon'
          }
        });
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

  updateState = annotation => {
    const points = getPoints(svgFragmentToShape(annotation));
    this.setPoints(points);
  }

  destroy = () => {
    this.containerGroup.parentNode.removeChild(this.containerGroup);
    super.destroy();
  }

}

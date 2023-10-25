import EditableShape from '@recogito/annotorious/src/tools/EditableShape';
import { SVG_NAMESPACE, addClass, hasClass, removeClass } from '@recogito/annotorious/src/util/SVG';
import { format, setFormatterElSize } from '@recogito/annotorious/src/util/Formatting';
import { svgFragmentToShape } from '@recogito/annotorious/src/selectors/EmbeddedSVG';
import { pointInPolygon } from '@recogito/annotorious/src/util/Geom2D';
import RubberbandBetterMultipolygon from './RubberbandBetterMultipolygon';

import { toSVGTarget, getPath } from './RubberbandBetterMultipolygonTool';

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
      if (coords[0][0] !== coords[coords.length - 1][0] && coords[0][1] !== coords[coords.length - 1][1]){
        coords.push(coords[0])
      }
      allcoords.push(coords)
    }
  });
  return allcoords
}


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
    pointArray.push(points)
  }
  return pointArray;
}

const getBBox = shape => {
  return shape.querySelector('.a9s-inner').getBBox();
}
export const svgFragmentToPoints = annotation => {
  const svgShape = svgFragmentToShape(annotation);
  var polygon = svgShape.getAttribute('d')
  var allcoords =  getPointsFromPathValue(polygon)
  return allcoords
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
  
export default class EditableBetterMultipolygon extends EditableShape {

  constructor(annotation, g, config, env) {
    super(annotation, g, config, env);
    this.svg.addEventListener('mousemove', this.onMouseMove);
    this.svg.addEventListener('mouseup', this.onMouseUp);
    // This part is added to track time of annotation process. It is not confirm with W3C-Annotations
    if (!this.annotation.underlying["generated"]){
      console.log("generated", Date.now());
      this.annotation.underlying["generated"] = Date.now()
    }
    document.body.addEventListener('keydown', this.onKeyDown);

    // Container wraps the mask + editable shape
    this.container = document.createElementNS(SVG_NAMESPACE, 'g');

    // The editable shape group
    this.shape = drawEmbeddedSVG(annotation);
    this.shape.setAttribute('class', 'a9s-annotation editable selected improved-polygon');
    this.elementGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    this.elementGroup.setAttribute('class', 'a9s-annotation editable selected');
    this.elementGroup.appendChild(this.shape);
    let cornerList = getPoints(this.shape);
    this.cornerHandles = []
    this.midpoints = []
    for (let corners of cornerList){
      let midpoints = []
      this.cornerHandles.push(corners.map((pt, idx) => {
        midpoints.push(this.createMidpoint(corners, idx));
        const handle = this.createCornerHandle(pt);
        return handle;
      }))
      this.midpoints.push(midpoints);
    }
    this.container.appendChild(this.elementGroup)
    g.appendChild(this.container);
    // Format needs to go after everything is added to the DOM
    format(this.shape, annotation, config.formatter);
    this.shape.querySelector('.a9s-inner')
      .addEventListener('mousedown', this.onGrab(this.shape));

    // Grabbed element and grab offset
    this.grabbedElement = null;
    this.grabbedAt = null;

    // Selected corners
    this.selected = [];

    this.lastMouseDown = null;
  }

  createCornerHandle = pt => {
    const handle = this.drawHandle(pt.x, pt.y);
    handle.addEventListener('mousedown', this.onGrab(handle));
    handle.addEventListener('click', this.onSelectCorner(handle));
    this.scaleHandle(handle);

    this.elementGroup.appendChild(handle);
    return handle;
  }

  createMidpoint = (corners, idx) => {
    // Create point between this and previous corner
    const thisCorner = corners[idx];
    const nextCorner = idx === corners.length - 1 ? corners[0] : corners[idx + 1];
    const x = (thisCorner.x + nextCorner.x) / 2;
    const y = (thisCorner.y + nextCorner.y) / 2;
    const handle = this.drawMidpoint(x, y);
    handle.addEventListener('mousedown', this.onGrab(handle));

    this.shape.appendChild(handle);
    return handle;
  }

  deleteSelected = () => {
    console.log("delete selected");
    const points = getPoints(this.shape);
    
    if (this.selected.length > 0 ) {
      let cornerhandlesIDX = -1
      let updatedPoints = []
      // Update midpoints
      let newMidpoints = []
      for (let midpointList of this.midpoints){
        let updatedMidpointlist = midpointList.filter((object, i) => {
          return this.selected.map(object => (object[0] === cornerhandlesIDX && object[1] === i)).indexOf(true) === -1
        });      
        let midpointsToDelete = midpointList.filter((object, i) => {
          return this.selected.map(object => (object[0] === cornerhandlesIDX && object[1] === i)).indexOf(true) > -1
        });
        midpointsToDelete.forEach(h => h.parentNode.removeChild(h));
        if (updatedMidpointlist.length > 2){
          newMidpoints.push(updatedMidpointlist)
        }
      }
      for (let pointList of points){
        cornerhandlesIDX += 1
        let updatedPointlist = pointList.filter((object, i) => {
          return this.selected.map(object => (object[0] === cornerhandlesIDX && object[1] === i)).indexOf(true) === -1
        });
        if (updatedPointlist.length > 2){
          updatedPoints.push(updatedPointlist)
        }
      }
      cornerhandlesIDX = -1
      let updatedHandles = []
      for (let handlesList of this.cornerHandles){
        cornerhandlesIDX += 1
        let handlesToDelete = handlesList.filter((object, i) => {
          if (this.selected.map(object => (object[0] === cornerhandlesIDX && object[1] === i)).indexOf(true) !== -1){
            return true
          } else {
            return false
          } 
        });
        let handlesToStay = handlesList.filter((object, i) => {
          return this.selected.map(object => (object[0] === cornerhandlesIDX && object[1] === i)).indexOf(true) === -1
        });
        if (handlesToStay.length > 2){
          updatedHandles.push(handlesToStay)
        }
        handlesToDelete.forEach(h => h.parentNode.removeChild(h));
      }
      this.midpoints = newMidpoints
      // Update corner handles

      this.cornerHandles = updatedHandles
      this.selected = []

      this.setPoints(updatedPoints);
      // this.emit('update', toSVGTarget(updatedPoints, this.env.image));
    }
  }

  deselectCorners = () =>
    this.cornerHandles.forEach(h => removeClass(h, 'selected'));

  destroy = () => {
    this.container.parentNode.removeChild(this.container);

    this.svg.removeEventListener('mousemove', this.onMouseMove);
    this.svg.removeEventListener('mouseup', this.onMouseUp);

    document.body.removeEventListener('keydown', this.onKeyDown);

    super.destroy();
  }

  drawMidpoint = (x, y) => {
    const handle = document.createElementNS(SVG_NAMESPACE, 'circle');
    handle.setAttribute('class', 'a9s-midpoint');
    
    handle.setAttribute('cx', x);
    handle.setAttribute('cy', y);
    handle.setAttribute('r', 5 * this.scale);

    return handle;
  }

  get element() {
    return this.elementGroup;
  }

  onAddPoint = pos => {
    const corners = getPoints(this.shape);
    let idx = -1
    let midpointsIDX = -1
    for (let midpointList of this.midpoints){
      midpointsIDX += 1
      idx = midpointList.indexOf(this.grabbedElement);
      if (idx > -1){
        break;
      }
    }
    // Updated polygon points
    let updatedCorners = []
    let updatedcornerListIdx = -1
    let midBefore = null
    let midAfter = null
    for (let cornerList of corners){
      updatedcornerListIdx +=1
      if (updatedcornerListIdx === midpointsIDX){
        let updatedCornersList = []
        let updatedcornerIdx = -1
        for (let corner of cornerList){
          updatedcornerIdx += 1
          updatedCornersList.push(corner)     
          if (updatedcornerIdx === idx){
            updatedCornersList.push(pos)
            midBefore = this.createMidpoint(cornerList, updatedcornerIdx -1);
            midAfter = this.createMidpoint(cornerList, updatedcornerIdx);          
          }
        }
        updatedCorners.push(updatedCornersList)
      } else {
        updatedCorners.push(cornerList)
      }
      
    }

    // New corner handle
    const cornerHandle = this.createCornerHandle(pos);
    this.cornerHandles[midpointsIDX] = [
      ...this.cornerHandles[midpointsIDX].slice(0, idx+1),
      cornerHandle,
      ...this.cornerHandles[midpointsIDX].slice(idx+1)
    ];
    this.midpoints[midpointsIDX] = [
      ...this.midpoints[midpointsIDX].slice(0, idx),
      midBefore,
      midAfter,
      ...this.midpoints[midpointsIDX].slice(idx + 1)
    ];
    // Delete old midpoint
    this.grabbedElement.parentNode.removeChild(this.grabbedElement);
    
    // Make the newly created corner dragged element + selection
    this.grabbedElement = cornerHandle;
    //this.onSelectCorner(cornerHandle)();

    // Update shape
    this.setPoints(updatedCorners);
  }

  onGrab = element => evt => {
    if (evt.button !== 0) return;  // left click
    evt.stopPropagation();

    this.grabbedElement = element;
    this.grabbedAt = this.getSVGPoint(evt);
    this.lastMouseDown = new Date().getTime();
  }

  onKeyDown = ({ which }) => {
    if (which === 46) {
      this.deleteSelected();
    }
  }

  onMoveShape = pos => {
    const constrain = (coord, delta, max) =>
      coord + delta < 0 ? -coord : (coord + delta > max ? max - coord : delta);
    const { x, y, width, height } = getBBox(this.shape);
    const { naturalWidth, naturalHeight } = this.env.image;

    const dx = constrain(x, pos.x - this.grabbedAt.x, naturalWidth - width);
    const dy = constrain(y, pos.y - this.grabbedAt.y, naturalHeight - height);
    let updatedPoints = []
    for (let pointlist of getPoints(this.shape)){
      let newPointList = pointlist.map(pt => ([ pt.x , pt.y ]))
      if (pointInPolygon([this.grabbedAt.x,this.grabbedAt.y], newPointList)){
        updatedPoints.push(pointlist.map(pt =>
          ({ x: pt.x + dx, y: pt.y + dy })))    
      } else {
        updatedPoints.push(pointlist)
      }
    }
    this.grabbedAt = pos;

    // Update shape
    this.setPoints(updatedPoints);
  }

  onMoveCornerHandle = (pos, evt) => {
    let handleIdx = -1
    let cornerHandleIdx = 0
    for (let cornerHandle of this.cornerHandles){
      handleIdx = cornerHandle.indexOf(this.grabbedElement);
      if (handleIdx > -1){ 
        break
      } else {
        cornerHandleIdx += 1
      }
    }
    
    // Update selection
    if (evt.ctrlKey) {
      this.selected = Array.from(new Set([...this.selected, handleIdx]));
    } else if (!this.selected.includes(handleIdx)) {
      this.selected = [ handleIdx ];
    }

    // Compute offsets between selected points from current selected
    const points = getPoints(this.shape);

    const distances = this.selected.map(idx => {
      const handleXY = points[cornerHandleIdx][handleIdx];
      const thisXY = points[cornerHandleIdx][idx];

      return {
        index: idx,
        dx: thisXY.x - handleXY.x,
        dy: thisXY.y - handleXY.y
      }
    });
    let cornerHandleIdxUpdate = 0
    let updatedPoints = []
    for (let points of getPoints(this.shape)){
      if (cornerHandleIdxUpdate === cornerHandleIdx){
        let updatedPointList = points.map((pt, idx) => {
          if (idx === handleIdx) {
            // The dragged point
            return pos;
          } else if (this.selected.includes(idx)) {
            const { dx, dy } = distances.find(d => d.index === idx);
            return {
              x: pos.x + dx,
              y: pos.y + dy
            }
          } else {
            // Unchanged
            return pt;
          }
        });
        updatedPoints.push(updatedPointList);
      } else {
        updatedPoints.push(points)
      }
      cornerHandleIdxUpdate += 1
    }
    this.setPoints(updatedPoints);
  }

  onMouseMove = evt => {
    if (this.grabbedElement) {
      const pos = this.getSVGPoint(evt);
      if (this.grabbedElement === this.shape) {
        this.onMoveShape(pos);
      } else if (hasClass(this.grabbedElement, 'a9s-handle')) {
        this.onMoveCornerHandle(pos, evt);
      } else if (hasClass(this.grabbedElement, 'a9s-midpoint')) {
        this.onAddPoint(pos);
      }

      this.emit('update', toSVGTarget(getPoints(this.shape), this.env.image));
    }
  }

  onMouseUp = evt => {
    this.grabbedElement = null;
    this.grabbedAt = null;
  }

  onScaleChanged = scale => {
    for (let cornerHandle of this.cornerHandles){
      cornerHandle.map(this.scaleHandle);
    }
    for (let midpoints of this.midpoints){
      midpoints.map(midpoint => {
        midpoint.setAttribute('r', 5 * this.scale);
      });
    }
  }

  onSelectCorner = handle => evt => {
    const isDrag = new Date().getTime() - this.lastMouseDown > 250;

    if (!isDrag) {
      let cornerhandlesIDX = -1
      let idx = -1
      for (let corners of this.cornerHandles){
        cornerhandlesIDX += 1
        idx = corners.indexOf(handle);  
        if (idx > 0) break
      }

      if (evt?.ctrlKey) {
        // Toggle
        if ( this.selected.map(object => (object[0] === cornerhandlesIDX && object[1] === idx)).indexOf(true) > -1) {
          this.selected = this.selected.filter(i => {
            return !(i[1] === idx && i[0] === cornerhandlesIDX)
          });
        } else 
          this.selected = [...this.selected, [cornerhandlesIDX, idx]];
      } else { 
        if (this.selected.length === 1 && (this.selected[0][1] === idx && this.selected[0][0] === cornerhandlesIDX)) {
          this.selected = [];
        } else {
          this.selected = [[cornerhandlesIDX, idx ]];
        }
      }

      this.setPoints(getPoints(this.shape));
    }
  }

  setPoints = points => {
    // Not using .toFixed(1) because that will ALWAYS
    // Set polygon points
    const str = getPath(points);
    const inner = this.shape.querySelector('.a9s-inner');
    inner.setAttribute('d', str);

    const outer = this.shape.querySelector('.a9s-outer');
    outer.setAttribute('d', str);

    // Corner handles
    let cornerIdx = 0
    for (let pointList of points){
      console.log("pointList of points", pointList, points);
      pointList.forEach((pt, idx) => {
        this.setHandleXY(this.cornerHandles[cornerIdx][idx], pt.x, pt.y)
      });
    // Midpoints
      for (let idx=0; idx<pointList.length; idx++) {
        const thisCorner = pointList[idx];
        const nextCorner = idx === pointList.length - 1 ? pointList[0] : pointList[idx + 1];
        const x = (thisCorner.x + nextCorner.x) / 2;
        const y = (thisCorner.y + nextCorner.y) / 2;

        const handle = this.midpoints[cornerIdx][idx];
        handle.setAttribute('cx', x);
        handle.setAttribute('cy', y);
      }
        cornerIdx +=1
    }
    let cornerHandleIdx = -1
    for (let corners of this.cornerHandles){
      cornerHandleIdx += 1

      corners.forEach((handle, i) => {
        
        const isSelected = this.selected.map(object => (object[0] === cornerHandleIdx && object[1] === i)).indexOf(true) > -1;
        if (isSelected && !hasClass(handle, 'selectedCorner')) {
          addClass(handle, 'selectedCorner');
        } else if (!isSelected && hasClass(handle, 'selectedCorner')) {
          removeClass(handle, 'selectedCorner');
        }
      });  
    }

    // Resize formatter elements
    const { x, y, width, height } = outer.getBBox();
    setFormatterElSize(this.shape, x, y, width, height);
  }

  updateState = annotation => {
    const shape = drawEmbeddedSVG(annotation);
    const points = getPoints(shape);
    this.setPoints(points);
  }

}
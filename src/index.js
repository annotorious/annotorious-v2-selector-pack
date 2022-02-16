import PointTool from './point/PointTool';
import RubberbandCircleTool from './circle/RubberbandCircleTool';
import RubberbandEllipseTool from './ellipse/RubberbandEllipseTool';
import RubberbandFreehandTool from './freehand/RubberbandFreehandTool';
import RubberbandMultipolygonTool from './multipolygon/RubberbandMultipolygonTool';

const ALL_TOOLS = new Set([
  'point',
  'circle',
  'ellipse',
  'freehand',
  // 'multipolygon' // exclude from defaults for now
]);

const SelectorPack = (anno, config) => {

  // Add configured tools, or all
  const tools = config?.tools ? 
    config.tools.map(t => t.toLowerCase()) : ALL_TOOLS;

  tools.forEach(tool => {
    if (tool === 'point')
      anno.addDrawingTool(PointTool);

    if (tool === 'circle')
      anno.addDrawingTool(RubberbandCircleTool);

    if (tool === 'ellipse')
      anno.addDrawingTool(RubberbandEllipseTool);
  
    if (tool === 'freehand')
      anno.addDrawingTool(RubberbandFreehandTool);

    if (tool === 'multipolygon')
      anno.addDrawingTool(RubberbandMultipolygonTool);
  });

}

export default SelectorPack;

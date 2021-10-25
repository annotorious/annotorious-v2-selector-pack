import RubberbandCircleTool from './circle/RubberbandCircleTool';
import RubberbandEllipseTool from './ellipse/RubberbandEllipseTool';
import RubberbandFreehandTool from './freehand/RubberbandFreehandTool';

const ALL_TOOLS = new Set([
  'circle',
  'ellipse',
  'freehand'
]);

const SelectorPack = (anno, config) => {

  // Add configured tools, or all
  const useTools = config?.tools ? 
    new Set(config.tools.map(t => t.toLowerCase())) : ALL_TOOLS;

  if (useTools.has('circle'))
    anno.addDrawingTool(RubberbandCircleTool);

  if (useTools.has('ellipse'))
    anno.addDrawingTool(RubberbandEllipseTool);
  
  if (useTools.has('freehand'))
    anno.addDrawingTool(RubberbandFreehandTool);
  
}

export default SelectorPack;

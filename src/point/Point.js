import { toRectFragment } from '@recogito/annotorious/src/selectors/RectFragment';

export const isPoint = annotation =>
  annotation.target.renderedVia?.name === 'point';

export const toFragment = (x, y, image, fragmentUnit) => ({
  ...toRectFragment(x, y, 0, 0, image, fragmentUnit),
  renderedVia: {
    name: 'point'
  }
});
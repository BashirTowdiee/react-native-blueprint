/** @jest-environment jsdom */
import { attachBlueprintCanvasDrag } from '../src/canvasGestures';

function pointer(node: Element, type: string, x: number, y: number, button = 0) {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button });
  Object.defineProperties(event, { pointerId: { value: 1 }, pointerType: { value: 'mouse' } });
  node.dispatchEvent(event);
}

it('moves both axes in one background drag, releases and detaches without panning app controls', () => {
  const node = document.createElement('div');
  node.innerHTML = '<div data-testid="blueprint-artboard-feed"><button>App action</button></div><div id="background"></div>';
  node.scrollLeft = 100;
  node.scrollTop = 200;
  node.scrollTo = jest.fn();
  const cleanup = attachBlueprintCanvasDrag(node);
  const background = node.querySelector('#background')!;
  pointer(background, 'pointerdown', 400, 300);
  pointer(background, 'pointermove', 320, 260);
  expect([node.scrollLeft, node.scrollTop]).toEqual([180, 240]);
  expect(node.scrollTo).not.toHaveBeenCalled();
  pointer(background, 'pointerup', 320, 260);
  pointer(background, 'pointermove', 200, 200);
  expect([node.scrollLeft, node.scrollTop]).toEqual([180, 240]);
  pointer(node.querySelector('button')!, 'pointerdown', 400, 300);
  pointer(node.querySelector('button')!, 'pointermove', 200, 200);
  expect([node.scrollLeft, node.scrollTop]).toEqual([180, 240]);
  cleanup();
  pointer(background, 'pointerdown', 400, 300);
  pointer(background, 'pointermove', 200, 200);
  expect([node.scrollLeft, node.scrollTop]).toEqual([180, 240]);
});

it('supports middle-button panning over a preview without capturing normal touch scrolling', () => {
  const node = document.createElement('div');
  node.innerHTML = '<div data-testid="blueprint-artboard-feed"></div>';
  node.scrollTo = jest.fn();
  const cleanup = attachBlueprintCanvasDrag(node);
  const board = node.firstElementChild!;
  pointer(board, 'pointerdown', 200, 200, 1);
  pointer(board, 'pointermove', 100, 120, 1);
  expect([node.scrollLeft, node.scrollTop]).toEqual([100, 80]);
  pointer(board, 'pointercancel', 100, 120, 1);
  const touch = new MouseEvent('pointerdown', { bubbles: true });
  Object.defineProperties(touch, { pointerId: { value: 1 }, pointerType: { value: 'touch' } });
  board.dispatchEvent(touch);
  pointer(board, 'pointermove', 20, 20);
  expect([node.scrollLeft, node.scrollTop]).toEqual([100, 80]);
  cleanup();
});

it('leaves both scrollbar tracks available for the browser to drag', () => {
  const node = document.createElement('div');
  Object.defineProperties(node, {
    clientWidth: { value: 400 }, clientHeight: { value: 300 },
    scrollWidth: { value: 1000 }, scrollHeight: { value: 2000 },
  });
  node.getBoundingClientRect = () => ({ left: 0, top: 0, right: 400, bottom: 300 } as DOMRect);
  const cleanup = attachBlueprintCanvasDrag(node);
  pointer(node, 'pointerdown', 395, 200);
  pointer(node, 'pointermove', 200, 150);
  expect([node.scrollLeft, node.scrollTop]).toEqual([0, 0]);
  pointer(node, 'pointerdown', 200, 295);
  pointer(node, 'pointermove', 100, 250);
  expect([node.scrollLeft, node.scrollTop]).toEqual([0, 0]);
  cleanup();
});

/** Mouse panning on empty canvas; app controls keep their normal interactions. */
export function attachBlueprintCanvasDrag(node: HTMLElement) {
  let drag: { pointer: number; clientX: number; clientY: number; x: number; y: number } | undefined;
  const previousCursor = node.style.cursor;
  const end = () => {
    if (drag && node.hasPointerCapture?.(drag.pointer)) node.releasePointerCapture(drag.pointer);
    drag = undefined;
    node.style.cursor = previousCursor;
  };
  const down = (event: PointerEvent) => {
    if (event.pointerType === 'touch' || (event.button !== 0 && event.button !== 1)) return;
    const bounds = node.getBoundingClientRect();
    // Leave the native scrollbar tracks (including overlay scrollbars) draggable.
    if (event.button === 0 && (
      (node.scrollHeight > node.clientHeight && event.clientX >= bounds.right - 14) ||
      (node.scrollWidth > node.clientWidth && event.clientY >= bounds.bottom - 14)
    )) return;
    const target = event.target as Element | null;
    if (event.button === 0 && target?.closest('[data-testid^="blueprint-artboard-"],button,input,textarea,select,a,[contenteditable="true"]')) return;
    drag = { pointer: event.pointerId, clientX: event.clientX, clientY: event.clientY, x: node.scrollLeft, y: node.scrollTop };
    node.setPointerCapture?.(event.pointerId);
    node.style.cursor = 'grabbing';
    event.preventDefault();
  };
  const move = (event: PointerEvent) => {
    if (!drag || drag.pointer !== event.pointerId) return;
    // RN Web attaches its x/y scrollTo API to this DOM node. Offset setters
    // retain browser semantics and update both axes without smooth-scroll lag.
    node.scrollLeft = drag.x + drag.clientX - event.clientX;
    node.scrollTop = drag.y + drag.clientY - event.clientY;
    event.preventDefault();
  };
  node.addEventListener('pointerdown', down);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', end);
  node.addEventListener('pointercancel', end);
  node.addEventListener('lostpointercapture', end);
  return () => {
    end();
    node.removeEventListener('pointerdown', down);
    node.removeEventListener('pointermove', move);
    node.removeEventListener('pointerup', end);
    node.removeEventListener('pointercancel', end);
    node.removeEventListener('lostpointercapture', end);
  };
}

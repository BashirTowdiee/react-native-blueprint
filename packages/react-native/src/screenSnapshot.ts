/** Capture the visible web viewport into a detached image, never a second React tree. */
export async function captureBlueprintWebScreen(view: unknown): Promise<string | undefined> {
  const root = view as HTMLElement | null;
  if (!root?.ownerDocument || !root.clientWidth || !root.clientHeight) return;
  const width = root.clientWidth;
  const height = root.clientHeight;
  const document = root.ownerDocument;
  const window = document.defaultView;
  if (!window) return;
  let count = 0;
  const clone = (node: Node): Node => {
    if (++count > 2000) throw new Error('Screen snapshot exceeds element budget');
    if (node.nodeType !== 1) return node.cloneNode(false);
    const original = node as HTMLElement;
    let copy = original.cloneNode(false) as HTMLElement;
    if (original.tagName === 'IMG' || original.tagName === 'CANVAS') {
      const media = original as HTMLImageElement | HTMLCanvasElement;
      const bitmap = document.createElement('canvas');
      bitmap.width = original.tagName === 'IMG' ? (media as HTMLImageElement).naturalWidth : (media as HTMLCanvasElement).width;
      bitmap.height = original.tagName === 'IMG' ? (media as HTMLImageElement).naturalHeight : (media as HTMLCanvasElement).height;
      if (bitmap.width && bitmap.height) {
        // Use already rendered pixels; never fetch additional resources for capture.
        const context = bitmap.getContext('2d');
        if (!context) throw new Error('Canvas unavailable');
        context.drawImage(media, 0, 0);
        const image = document.createElement('img');
        image.src = bitmap.toDataURL('image/png');
        copy = image;
      }
    }
    const computed = window.getComputedStyle(original);
    for (let index = 0; index < computed.length; index++) {
      const property = computed.item(index);
      copy.style.setProperty(property, computed.getPropertyValue(property));
    }
    copy.style.animation = 'none';
    copy.style.transition = 'none';
    copy.removeAttribute('id');
    // Scripts and event handlers never belong in the detached image document.
    for (const attribute of Array.from(copy.attributes)) {
      if (attribute.name.startsWith('on')) copy.removeAttribute(attribute.name);
    }
    if (original.tagName === 'INPUT' || original.tagName === 'TEXTAREA') {
      const input = original as HTMLInputElement;
      if (input.type === 'password') copy.setAttribute('value', '');
      else if (original.tagName === 'INPUT') copy.setAttribute('value', input.value);
      else copy.textContent = input.value;
    } else {
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === 1 && ['SCRIPT', 'IFRAME', 'OBJECT', 'EMBED'].includes((child as Element).tagName)) continue;
        copy.appendChild(clone(child));
      }
    }
    if (original.scrollTop || original.scrollLeft) {
      const offset = document.createElement('div');
      offset.style.transform = `translate(${-original.scrollLeft}px, ${-original.scrollTop}px)`;
      // A real box is needed for the translation, preserving the scroll contents layout.
      offset.style.display = computed.display === 'flex' ? 'flex' : 'block';
      offset.style.flexDirection = computed.flexDirection;
      while (copy.firstChild) offset.appendChild(copy.firstChild);
      copy.appendChild(offset);
      copy.style.overflow = 'hidden';
    }
    return copy;
  };
  try {
    const content = clone(root) as HTMLElement;
    content.style.width = `${width}px`;
    content.style.height = `${height}px`;
    content.style.position = 'relative';
    content.style.transform = 'none';
    content.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    const markup = new XMLSerializer().serializeToString(content);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${markup}</foreignObject></svg>`;
    const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    const image = new window.Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Screen snapshot could not be decoded'));
      image.src = uri;
    });
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1600 / Math.max(width, height));
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.scale(scale, scale);
    context.drawImage(image, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    // Custom capture integrations can handle native views, cross-origin media or unsupported browsers.
    return undefined;
  }
}

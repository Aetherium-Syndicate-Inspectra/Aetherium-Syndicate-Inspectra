function downloadUri(filename, href) {
  const anchor = document.createElement('a');
  anchor.download = filename;
  anchor.href = href;
  anchor.click();
}

export async function exportOrgChart(format = 'png') {
  const container = document.getElementById('orgChartContainer');
  if (!container) {
    console.error('Org chart container not found');
    return false;
  }

  const cloned = container.cloneNode(true);
  cloned.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');

  const width = Math.max(960, container.scrollWidth + 24);
  const height = Math.max(480, container.scrollHeight + 24);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="padding:12px;background:#0b1020;color:#e2e8f0;font-family:Inter,system-ui,sans-serif;">
          ${cloned.outerHTML}
        </div>
      </foreignObject>
    </svg>
  `;

  const stamp = Date.now();
  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  if (format === 'svg') {
    downloadUri(`org-chart-${stamp}.svg`, svgUrl);
    setTimeout(() => URL.revokeObjectURL(svgUrl), 2000);
    return true;
  }

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0b1020';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(image, 0, 0);
      const dataUrl = canvas.toDataURL('image/png', 0.95);
      downloadUri(`org-chart-${stamp}.png`, dataUrl);
      URL.revokeObjectURL(svgUrl);
      resolve(true);
    };
    image.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      resolve(false);
    };
    image.src = svgUrl;
  });
}

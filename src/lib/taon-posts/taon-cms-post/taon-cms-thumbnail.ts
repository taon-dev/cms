import { TaonCmsContentType } from '../../taon-cms-content/taon-cms-content.models';

export function defaultThumbnailKey(type: TaonCmsContentType): string {
  return `cms-placeholder:${type}`;
}

export function defaultThumbnailUrl(key: string): string | null {
  const type = Object.values(TaonCmsContentType).find(
    value => key === defaultThumbnailKey(value),
  );
  if (!type) {
    return null;
  }
  const shapes: Record<TaonCmsContentType, string> = {
    normal:
      '<path d="M260 126h120v112H260z M280 152h80m-80 20h80m-80 20h52" />',
    video:
      '<rect x="248" y="132" width="144" height="100" rx="16"/><path d="m308 158 40 24-40 24z"/>',
    audio: '<path d="M280 164v40m20-60v80m20-98v116m20-98v80m20-60v40"/>',
    attachment:
      '<path d="M276 124h60l32 32v84h-92z M336 124v36h32m-70 30h48m-48 22h36"/>',
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#eaf0ff"/><stop offset="1" stop-color="#e4f5f0"/></linearGradient></defs><rect width="640" height="360" rx="24" fill="url(#bg)"/><circle cx="320" cy="180" r="112" fill="#fff" opacity=".65"/><g fill="none" stroke="#52669a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">${shapes[type]}</g></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function visiblePixelRatio(pixels: Uint8ClampedArray): number {
  let visible = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    const luminance =
      0.2126 * pixels[index] +
      0.7152 * pixels[index + 1] +
      0.0722 * pixels[index + 2];
    if (luminance > 18) {
      visible += 1;
    }
  }
  return pixels.length ? visible / (pixels.length / 4) : 0;
}

function videoEvent(
  video: HTMLVideoElement,
  event: string,
  action: () => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout);
      video.removeEventListener(event, done);
      video.removeEventListener('error', failed);
    };
    const done = () => {
      cleanup();
      resolve();
    };
    const failed = () => {
      cleanup();
      reject(new Error(video.error?.message || 'Video decoding failed.'));
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Video decoding timed out.'));
    }, 15000);
    video.addEventListener(event, done, { once: true });
    video.addEventListener('error', failed, { once: true });
    try {
      action();
    } catch (error: unknown) {
      cleanup();
      reject(error);
    }
  });
}

export async function generateVideoThumbnail(file: Blob): Promise<Blob> {
  const video = document.createElement('video');
  const url = URL.createObjectURL(file);
  try {
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    await videoEvent(video, 'loadeddata', () => {
      video.src = url;
      video.load();
    });
    if (!video.videoWidth || !video.videoHeight) {
      throw new Error('The video has no decodable dimensions.');
    }
    const analysis = document.createElement('canvas');
    analysis.width = 64;
    analysis.height = Math.max(
      1,
      Math.round((64 * video.videoHeight) / video.videoWidth),
    );
    const context = analysis.getContext('2d', { willReadFrequently: true });
    if (!context) {
      throw new Error('Canvas is unavailable.');
    }
    const seek = async (time: number) => {
      if (Math.abs(video.currentTime - time) > 0.001) {
        await videoEvent(video, 'seeked', () => {
          video.currentTime = time;
        });
      }
    };
    const end = Number.isFinite(video.duration)
      ? Math.min(5, Math.max(0, video.duration - 0.01))
      : 5;
    let bestTime = 0;
    let bestRatio = -1;
    let found = false;
    for (let time = 0; time <= end; time += 0.25) {
      await seek(time);
      context.drawImage(video, 0, 0, analysis.width, analysis.height);
      const ratio = visiblePixelRatio(
        context.getImageData(0, 0, analysis.width, analysis.height).data,
      );
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestTime = time;
      }
      // Small highlights or a subject in a dark scene are enough.
      if (ratio >= 0.02) {
        found = true;
        break;
      }
    }
    if (!found) {
      await seek(bestTime);
    }
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1280 / video.videoWidth, 720 / video.videoHeight);
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const output = canvas.getContext('2d');
    if (!output) {
      throw new Error('Canvas is unavailable.');
    }
    output.drawImage(video, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        blob =>
          blob
            ? resolve(blob)
            : reject(new Error('Thumbnail encoding failed.')),
        'image/webp',
        0.85,
      );
    });
  } finally {
    try {
      video.pause();
      video.removeAttribute('src');
      video.load();
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

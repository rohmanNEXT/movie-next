import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImageUrl(imagePath?: string | null): string {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('blob:') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  if (imagePath.startsWith('/uploads/')) {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace('/api', '');
    return `${apiBase}${imagePath}`;
  }
  return imagePath;
}

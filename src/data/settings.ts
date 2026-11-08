export interface SiteSettings {
  phone: string;
  displayPhone: string;
  email: string;
  location: string;
  announcement: string;
  heroVideoUrl: string;
}

export const defaultSettings: SiteSettings = {
  phone: '918111899991',
  displayPhone: '+91 81118 99991',
  email: 'info@roelhome.com',
  location: 'Kochi, Kerala',
  announcement: 'ROEL HOME SOLUTIONS / ARCHITECTURAL MATERIALS & SPACES',
  heroVideoUrl: '/videos/video.mp4'
};

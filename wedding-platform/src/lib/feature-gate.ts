import { PackageTier } from './types';

export type Feature = 
  | 'qr_checkin'
  | 'live_gallery'
  | 'digital_angpao'
  | 'photo_booth'
  | 'custom_theme'
  | 'custom_music'
  | 'tablet_mode';

const featureMatrix: Record<Feature, PackageTier[]> = {
  qr_checkin: ['gold', 'platinum'],
  live_gallery: ['gold', 'platinum'],
  digital_angpao: ['gold', 'platinum'],
  photo_booth: ['platinum'],
  custom_theme: ['platinum'],
  custom_music: ['platinum'],
  tablet_mode: ['gold', 'platinum'],
};

const featureLabels: Record<Feature, string> = {
  qr_checkin: 'QR Check-in',
  live_gallery: 'Live Gallery',
  digital_angpao: 'Amplop Digital',
  photo_booth: 'Photo Booth',
  custom_theme: 'Arah Visual Khusus',
  custom_music: 'Musik Pilihan',
  tablet_mode: 'Tablet Mode',
};

export function hasFeature(tier: PackageTier, feature: Feature): boolean {
  return featureMatrix[feature].includes(tier);
}

export function getAvailableFeatures(tier: PackageTier): Feature[] {
  return (Object.keys(featureMatrix) as Feature[]).filter(feature => 
    hasFeature(tier, feature)
  );
}

export function getFeatureLabel(feature: Feature): string {
  return featureLabels[feature];
}

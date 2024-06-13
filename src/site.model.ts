export interface Site {
  id: number;
  name: string;
  country: string;
  type: string;
  typeEn: string;
  heightDifferenceMax: number;
  webCam1: string;
  webCam2: string;
  webCam3: string;
  wheatherInfo: string;
  wheatherPhone: string;
  deCertified: boolean;
  deCertHolder: string;
  contact: string;
  info: string;
  cableCar: string;
  remarks: string;
  requirements: string;
  url: string;

  locations: SiteLocation[];
}

export interface SiteLocation {
  id: number;
  type: SiteLocationType;
  name: string;
  latitude: string;
  longitude: string;
  altitude: number; // TODO: Whats this exactly?
  country: string;
  postCode: string;
  regionId: number;
  region: string;
  municipality: string;
  directions: string; // TODO: Maybe enum this?
  directionsText: string;
  towingLength: number;
  mobileWhinch: number;
  towingWhinchHeight1: number;
  towingWhinchHeight2: number;
  accessByCar: boolean;
  accessByPublicTransport: boolean;
  accessByFoot: boolean;
  accessRemarks: string;
  hanggliding: boolean;
  paragliding: boolean;
  suitabilityHg: string;
  suitabilityHgEn: string;
  suitabilityPg: string;
  suitabilityPgEn: string;
  remarks: string;
}

export enum SiteLocationType {
  SlopeStart = 1,
  LandingSite = 2,
  WhinchStart = 3
}

import { XmlDocument } from 'xmldoc';
import { readFile } from 'fs/promises';

function pruneEmpty(str: string): string {
    return str?.length > 0 ? str : null;
};

interface Site {
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

interface SiteLocation {
    id: number;
    type: number; // TODO: Check whats this?
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

async function main(): Promise<any> {
    const [sourceXmlPath, targetXmlPath] = process.argv.splice(2);
    if (sourceXmlPath == null || targetXmlPath == null) {
        throw new Error('Invalid arguments supplied');
    }

    const sourceXml = await readFile(sourceXmlPath, { encoding: 'utf8' });
    const sourceDoc = new XmlDocument(sourceXml);

    const flyingSites = sourceDoc.childNamed('FlyingSites').childrenNamed('FlyingSite').map(c => ({
        id: +c.valueWithPath('SiteID'),
        name: c.valueWithPath('SiteName'),
        country: c.valueWithPath('SiteCountry'),
        type: c.valueWithPath('SiteType'),
        typeEn: c.valueWithPath('SiteType_en'),
        heightDifferenceMax: +c.valueWithPath('HeightDifferenceMax'),
        webCam1: pruneEmpty(c.valueWithPath('WebCam1')),
        webCam2: pruneEmpty(c.valueWithPath('WebCam2')),
        webCam3: pruneEmpty(c.valueWithPath('WebCam3')),
        wheatherInfo: pruneEmpty(c.valueWithPath('WheaterInfo')),
        wheatherPhone: pruneEmpty(c.valueWithPath('WheaterPhone')),
        deCertified: c.valueWithPath('DECertified') === 'true',
        deCertHolder: pruneEmpty(c.valueWithPath('DECertificationHolder')),
        contact: pruneEmpty(c.valueWithPath('SiteContact')),
        info: pruneEmpty(c.valueWithPath('SiteInformation')),
        cableCar: pruneEmpty(c.valueWithPath('CableCar')),
        remarks: pruneEmpty(c.valueWithPath('SiteRemarks')),
        requirements: pruneEmpty(c.valueWithPath('Requirements')),
        url: pruneEmpty(c.valueWithPath('SiteUrl')),

        locations: c.childrenNamed('Location').map(x => ({
            id: +x.valueWithPath('LocationID'),
            type: +x.valueWithPath('LocationType'),
            name: x.valueWithPath('LocationName'),
            latitude: x.valueWithPath('Coordinates').split(',')[0],
            longitude: x.valueWithPath('Coordinates').split(',')[1],
            altitude: +x.valueWithPath('Altitude'),
            country: pruneEmpty(x.valueWithPath('LocationCountry')),
            postCode: pruneEmpty(x.valueWithPath('PostCode')),
            regionId: +x.valueWithPath('RegionID'),
            region: x.valueWithPath('Region'),
            municipality: pruneEmpty(x.valueWithPath('Municipality')),
            directions: pruneEmpty(x.valueWithPath('Directions')),
            directionsText: pruneEmpty(x.valueWithPath('DirectionsText')),

            towingLength: +x.valueWithPath('TowingLength'),
            mobileWhinch: +x.valueWithPath('MobileWinch'),
            towingWhinchHeight1: +x.valueWithPath('TowingHeight1'),
            towingWhinchHeight2: +x.valueWithPath('TowingHeight2'),

            accessByCar: x.valueWithPath('AccessByCar') === 'true',
            accessByPublicTransport: x.valueWithPath('AccessByPublicTransport') === 'true',
            accessByFoot: x.valueWithPath('AccessByFoot') === 'true',
            accessRemarks: pruneEmpty(x.valueWithPath('AccessRemarks')),

            hanggliding: x.valueWithPath('Hanggliding') === 'true',
            paragliding: x.valueWithPath('Paragliding') === 'true',

            suitabilityHg: pruneEmpty(x.valueWithPath('SuitabilityHG')),
            suitabilityHgEn: pruneEmpty(x.valueWithPath('SuitabilityHG_en')),
            suitabilityPg: pruneEmpty(x.valueWithPath('SuitabilityPG')),
            suitabilityPgEn: pruneEmpty(x.valueWithPath('SuitabilityPG_en')),

            remarks: pruneEmpty(x.valueWithPath('LocationRemarks')),
        }))
    }));

    console.log(JSON.stringify(flyingSites.slice(0, 4)));
}

main()
    .then()
    .catch(e => console.error(e));

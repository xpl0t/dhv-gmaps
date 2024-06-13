import { XmlDocument } from 'xmldoc';
import { readFile, writeFile } from 'fs/promises';
import { Site, SiteLocationType } from './site.model';
import { create } from 'xmlbuilder2';
import { style } from './text-style.js';
import { uniq } from 'lodash';

function pruneEmpty(str: string): string {
    return str?.length > 0 ? str : null;
};

function parseSitesXml(xml: string): Site[] {
    const sourceDoc = new XmlDocument(xml);

    return sourceDoc.childNamed('FlyingSites').childrenNamed('FlyingSite').map(c => ({
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
            latitude: x.valueWithPath('Coordinates').split(',')[1],
            longitude: x.valueWithPath('Coordinates').split(',')[0],
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
}

function genDirArrowStr(directions: string): string {
    let arrowStr = directions;
    const replaceMap = new Map<string, string>([
        [ 'WSW', '↙' ],
        [ 'SSW', '↙' ],
        [ 'NNW', '↖' ],
        [ 'WNW', '↖' ],
        [ 'NNO', '↗' ],
        [ 'ONO', '↗' ],
        [ 'SSO', '↘' ],
        [ 'OSO', '↘' ],

        [ 'SW', '↙' ],
        [ 'NW', '↖' ],
        [ 'NO', '↗' ],
        [ 'SO', '↘' ],

        [ 'S', '↓' ],
        [ 'W', '←' ],
        [ 'N', '↑' ],
        [ 'O', '→' ]
    ]);

    for (const [text, symbol] of replaceMap) {
        arrowStr = arrowStr.replaceAll(text, symbol);
    }

    return uniq(arrowStr.split('').filter(ch => [...replaceMap.values()].includes(ch))).join(' ');
}

function generateSitesGpx(sites: Site[], typeFilter: SiteLocationType): string {
    const locationTypeMap = new Map<SiteLocationType, string>([
        [SiteLocationType.SlopeStart, "Startplatz"],
        [SiteLocationType.LandingSite, "Landeplatz"],
        [SiteLocationType.WhinchStart, "Winde"]
    ]);

    const doc = create({ version: '1.0' })
        .ele('gpx', {
            xmlns: 'http://www.topografix.com/GPX/1/1',
            version: '1.1',
            creator: 'dhv-gmaps',
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            'xsi:schemaLocation': 'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd'
        });

    for (const site of sites) {
        for (const location of site.locations) {
            if (location.type !== typeFilter) {
                continue;
            }

            const locEle = doc.ele('wpt', {
                lat: location.latitude,
                lon: location.longitude
            });

            locEle.ele('name').txt(location.name);

            let description = `${locationTypeMap.get(location.type)} - ${site.type}\n`;

            if (site.info != null) {
                description += `\n${site.info}\n`;
            }

            if (site.remarks != null) {
                description += `\n${style('Anmerkungen', 'bold')}\n`;
                description += site.remarks + '\n';
            }
            
            if (site.requirements != null) {
                description += `\n${style('Anforderungen', 'bold')}\n`;
                description += site.requirements + '\n';
            }

            description += `\n${style('Geländeinformationen', 'bold')}\n`

            description += location.directionsText
                ? `Startrichtungen: ${location.directionsText} ${genDirArrowStr(location.directionsText)}\n`
                : '';

            description += site.heightDifferenceMax > 0
                ? `Max. Höhendifferenz: ${site.heightDifferenceMax}\n`
                : '';

            description += location.altitude > 0
                ? `Höhe MSL: ${location.altitude}\n`
                : '';

            if (location.type === SiteLocationType.WhinchStart) {
                description += `\n${style('Schleppinfos', 'bold')}\n`;

                description += `Windentyp: ${location.mobileWhinch === -1 ? 'Mobile Abrollwinde' : 'Stationäre Abrollwinde'}\n`;

                description += location.towingLength > 0
                    ? `Schlepplänge: ${location.towingLength}\n`
                    : '';

                description += location.towingWhinchHeight1 > 0
                    ? `Schlepphöhe: ${location.towingWhinchHeight1} - ${location.towingWhinchHeight2}\n`
                    : '';
            }

            

            description += `\n${style('Zugang', 'bold')}\n`;

            description += `${location.accessByCar ? '☑' : '☐'} Auto`;
            description += ` ${location.accessByPublicTransport ? '☑' : '☐'} Öffentliche Verkhersmittel`;
            description += ` ${location.accessByFoot ? '☑' : '☐'} Zu Fuß\n`;

            description += site.cableCar ? `\nGondel: ${site.cableCar}\n` : '';

            description += location.accessRemarks
                ? `Infos zum Zugang: ${location.accessRemarks}\n`
                : '';

            description += `\n${style('Fluggeräte', 'bold')}\n`;

            description += `${location.paragliding ? '☑' : '☐'} Gleitschirm`;
            description += ` ${location.hanggliding ? '☑' : '☐'} Hängegleiter\n`;

            if (location.remarks != null) {
                description += `\n${style('Geländezusatzinformationen', 'bold')}\n`;
                description += location.remarks + '\n';
            }

            if (site.webCam1 != null || site.webCam2 != null || site.webCam3 != null || site.wheatherInfo != null || site.wheatherPhone != null) {
                description += `\n${style('Wetter', 'bold')}\n`;
                    
                description += site.wheatherInfo
                    ? site.wheatherInfo + '\n'
                    : '';

                description += site.wheatherPhone
                    ? `Wetter-Telefon: ${site.wheatherPhone}\n`
                    : '';

                description += site.webCam1
                    ? `WebCam 1: ${site.webCam1}\n`
                    : '';

                description += site.webCam2
                    ? `WebCam 2: ${site.webCam2}\n`
                    : '';

                description += site.webCam3
                    ? `WebCam 3: ${site.webCam3}\n`
                    : '';
            }

            description += `\n${style('Weiteres', 'bold')}\n`;

            description += `DE-Zertifiziert: ${site.deCertified ? '☑ Zertifiziert' : '☐ Nicht Zertifiziert'}\n`;
            description += site.deCertHolder ? `DE-Zertifikatsinhaber: ${site.deCertHolder}\n` : '';

            description += site.contact ? `Kontakt: ${site.contact}\n` : '';

            description += `Url: ${site.url}\n`;

            locEle.ele('desc').txt(description);
        }
    }

    return doc.end({ prettyPrint: true });
}

async function main(): Promise<any> {
    const [sourceXmlPath, targetSlopeStartGpxPath, targetLandingSiteGpxPath, targetWhinchStartGpxPath] = process.argv.splice(2);
    if (sourceXmlPath == null || targetSlopeStartGpxPath == null || targetLandingSiteGpxPath == null || targetWhinchStartGpxPath == null) {
        throw new Error('Invalid arguments supplied');
    }

    const sourceXml = await readFile(sourceXmlPath, { encoding: 'utf8' });
    const sites = parseSitesXml(sourceXml);

    const slopeStartGpx = generateSitesGpx(sites, SiteLocationType.SlopeStart);
    await writeFile(targetSlopeStartGpxPath, slopeStartGpx, { encoding: 'utf8' });

    const landingSitesGpx = generateSitesGpx(sites, SiteLocationType.LandingSite);
    await writeFile(targetLandingSiteGpxPath, landingSitesGpx, { encoding: 'utf8' });

    const whinchStartGpx = generateSitesGpx(sites, SiteLocationType.WhinchStart);
    await writeFile(targetWhinchStartGpxPath, whinchStartGpx, { encoding: 'utf8' });
}

main()
    .then()
    .catch(e => console.error(e));

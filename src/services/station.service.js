import masterData from "../data/masterData.json" with { type: "json" };

import { distanceInMeters } from "../utils/geo.js";

function getStationSummary(id) {
    if (!id) return null;
    const st = masterData.stations[id];
    if (!st) return null;
    return {
        id: st.id,
        name: st.name,
        coordinates: st.coordinates,
        lines: st.lines,
        interchange: st.interchange
    };
}

export function enrichStationWithRoutes(station) {
    if (!station) return null;

    const enriched = {
        id: station.id,
        name: station.name,
        coordinates: station.coordinates,
        lines: station.lines,
        interchange: station.interchange,
        routes: {}
    };

    for (const lineId of station.lines) {
        const line = masterData.lines[lineId];
        if (!line) continue;
        const index = line.stations.indexOf(station.id);
        if (index === -1) continue;

        const prevId = index > 0 ? line.stations[index - 1] : null;
        const nextId = index < line.stations.length - 1 ? line.stations[index + 1] : null;

        const existingRoute = station.routes?.[lineId] || {};

        enriched.routes[lineId] = {
            sequence: existingRoute.sequence || (index + 1),
            previous: prevId,
            next: nextId,
            previousStation: getStationSummary(prevId),
            nextStation: getStationSummary(nextId)
        };
    }

    const firstLine = station.lines[0];
    if (firstLine && enriched.routes[firstLine]) {
        enriched.previousStation = enriched.routes[firstLine].previousStation;
        enriched.nextStation = enriched.routes[firstLine].nextStation;
    }

    return enriched;
}

export function getAllStations() {
    return Object.values(masterData.stations).map(enrichStationWithRoutes);
}

export function getStationById(id) {
    const station = masterData.stations[id];
    if (!station) return null;
    return enrichStationWithRoutes(station);
}

export function getStationsByLine(lineId) {
    const line = masterData.lines[lineId];

    if (!line) {
        return null;
    }

    return line.stations
        .map((stationId) => getStationById(stationId))
        .filter(Boolean);
}

export function getStationLines(id) {
    const station = masterData.stations[id];

    if (!station) {
        return null;
    }

    return station.lines;
}

export function findNearestStation(lat, lng) {
    let nearestStation = null;
    let minimumDistance = Infinity;

    for (const station of Object.values(masterData.stations)) {
        const distance = distanceInMeters(
            lat,
            lng,
            station.coordinates.lat,
            station.coordinates.lng
        );

        if (distance < minimumDistance) {
            minimumDistance = distance;
            nearestStation = station;
        }
    }

    if (!nearestStation) {
        return null;
    }

    return {
        station: enrichStationWithRoutes(nearestStation),
        distance: Math.round(minimumDistance)
    };
}
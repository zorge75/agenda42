
function doEventsOverlap(event1: any, event2: any): boolean {
    return event1.start < event2.end && event2.start < event1.end;
}

export function findOverlappingEvents(events: any): any[][] {
    const overlaps: any[][] = [];

    for (let i = 0; i < events.length; i++) {
        for (let j = i + 1; j < events.length; j++) {
            if (doEventsOverlap(events[i], events[j])) {
                overlaps.push([events[i], events[j]]);
            }
        }
    }

    return overlaps;
}
/**
 * Timeline Game Event Dataset - MVP Events
 * 20 historical events spanning 1903-2022
 */

import { TimelineEvent } from './types';

export const timelineEvents: TimelineEvent[] = [
    {
        id: 1,
        title: "Wright Brothers' First Flight",
        year: 1903,
        category: 'Science',
        imageUrl: '/images/events/event_01_flight.png',
    },
    {
        id: 2,
        title: 'Sinking of the Titanic',
        year: 1912,
        category: 'Tragedy',
        imageUrl: '/images/events/event_02_titanic.png',
    },
    {
        id: 3,
        title: 'Start of World War I',
        year: 1914,
        category: 'War',
        imageUrl: '/images/events/event_03_ww1.png',
    },
    {
        id: 4,
        title: 'Discovery of Penicillin',
        year: 1928,
        category: 'Science',
        imageUrl: '/images/events/event_04_penicillin.png',
    },
    {
        id: 5,
        title: 'Stock Market Crash (Great Depression)',
        year: 1929,
        category: 'Economy',
        imageUrl: '/images/events/event_05_crash.png',
    },
    {
        id: 6,
        title: 'Start of World War II',
        year: 1939,
        category: 'War',
        imageUrl: '/images/events/event_06_ww2.png',
    },
    {
        id: 7,
        title: 'First Computer (ENIAC) Unveiled',
        year: 1946,
        category: 'Tech',
        imageUrl: '/images/events/event_07_eniac.png',
    },
    {
        id: 8,
        title: 'DNA Double Helix Discovered',
        year: 1953,
        category: 'Science',
        imageUrl: '/images/events/event_08_dna.png',
    },
    {
        id: 9,
        title: 'First Human in Space (Yuri Gagarin)',
        year: 1961,
        category: 'Space',
        imageUrl: '/images/events/event_09_gagarin.png',
    },
    {
        id: 10,
        title: 'Moon Landing (Apollo 11)',
        year: 1969,
        category: 'Space',
        imageUrl: '/images/events/event_10_apollo.png',
    },
    {
        id: 11,
        title: 'Fall of the Berlin Wall',
        year: 1989,
        category: 'Politics',
        imageUrl: '/images/events/event_11_berlin.png',
    },
    {
        id: 12,
        title: 'Launch of the World Wide Web',
        year: 1991,
        category: 'Tech',
        imageUrl: '/images/events/event_12_www.png',
    },
    {
        id: 13,
        title: 'Euro Currency Introduced',
        year: 1999,
        category: 'Economy',
        imageUrl: '/images/events/event_13_euro.png',
    },
    {
        id: 14,
        title: 'Wikipedia Launched',
        year: 2001,
        category: 'Tech',
        imageUrl: '/images/events/event_14_wikipedia.png',
    },
    {
        id: 15,
        title: 'Launch of the First iPhone',
        year: 2007,
        category: 'Tech',
        imageUrl: '/images/events/event_15_iphone.png',
    },
    {
        id: 16,
        title: 'Bitcoin Network Starts',
        year: 2009,
        category: 'Tech',
        imageUrl: '/images/events/event_16_bitcoin.png',
    },
    {
        id: 17,
        title: 'Curiosity Rover Lands on Mars',
        year: 2012,
        category: 'Space',
        imageUrl: 'placeholder',
    },
    {
        id: 18,
        title: 'Paris Agreement on Climate Change',
        year: 2015,
        category: 'Politics',
        imageUrl: 'placeholder',
    },
    {
        id: 19,
        title: 'First Image of a Black Hole',
        year: 2019,
        category: 'Science',
        imageUrl: 'placeholder',
    },
    {
        id: 20,
        title: 'James Webb Telescope First Images',
        year: 2022,
        category: 'Space',
        imageUrl: 'placeholder',
    },
];

/**
 * Get a random event not yet used
 */
export function getRandomEvent(usedIds: number[]): TimelineEvent | null {
    const available = timelineEvents.filter((e) => !usedIds.includes(e.id));
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
}

/**
 * Get the starting event (always the same for consistency)
 */
export function getStartingEvent(): TimelineEvent {
    return timelineEvents.find((e) => e.id === 10) || timelineEvents[0]; // Moon Landing
}

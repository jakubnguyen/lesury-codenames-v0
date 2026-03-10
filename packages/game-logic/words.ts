export const ACTIVITY_CATEGORIES = ['description', 'drawing', 'pantomime'] as const;
export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];

// Placeholder word list to be used for early stage games
export const WORDS: Record<ActivityCategory, string[]> = {
    description: ['Apple', 'House', 'Tree', 'President', 'Ocean', 'Mountain', 'River', 'Bird'],
    drawing: ['Car', 'Bicycle', 'Sun', 'Moon', 'House', 'Tree', 'Cat', 'Dog'],
    pantomime: [
        'Swimming',
        'Sleeping',
        'Eating',
        'Running',
        'Jumping',
        'Flying',
        'Dancing',
        'Crying',
    ],
};

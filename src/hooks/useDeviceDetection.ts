'use client';

import { useState, useEffect } from 'react';

export type DeviceType = 'desktop' | 'mobile' | 'unknown';

export function useDeviceDetection(): DeviceType {
    const [device, setDevice] = useState<DeviceType>('unknown');

    useEffect(() => {
        const detectDevice = (): DeviceType => {
            if (typeof window === 'undefined') return 'unknown';

            const ua = navigator.userAgent;
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

            // Also check for touch support and screen size
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth < 768;

            return (isMobile || (hasTouch && isSmallScreen)) ? 'mobile' : 'desktop';
        };

        setDevice(detectDevice());

        // Update on resize
        const handleResize = () => setDevice(detectDevice());
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return device;
}

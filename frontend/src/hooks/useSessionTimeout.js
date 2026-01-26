import { useEffect, useRef } from 'react';

const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const useSessionTimeout = (onTimeout, isActive = true) => {
    const timeoutRef = useRef(null);

    const resetTimeout = () => {
        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout only if active
        if (isActive) {
            timeoutRef.current = setTimeout(() => {
                onTimeout();
            }, TIMEOUT_DURATION);
        }
    };

    useEffect(() => {
        if (!isActive) {
            // Clear timeout if not active
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            return;
        }

        // Activity event handlers
        const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];

        // Reset timeout on activity
        const handleActivity = () => {
            resetTimeout();
        };

        // Set initial timeout
        resetTimeout();

        // Add event listeners
        activityEvents.forEach(event => {
            window.addEventListener(event, handleActivity);
        });

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            activityEvents.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [isActive, onTimeout]);

    return null;
};

export default useSessionTimeout;

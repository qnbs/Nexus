import { useState, useCallback } from 'react';
import { Notification, NotificationType } from '../types';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((message: string, type: NotificationType = 'info') => {
        const id = Date.now();
        setNotifications(n => [...n, { id, message, type }]);
        setTimeout(() => {
            setNotifications(n => n.filter(notif => notif.id !== id));
        }, 5000);
    }, []);

    return { notifications, addNotification };
};

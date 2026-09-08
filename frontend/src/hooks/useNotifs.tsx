import { Notifier } from '@components/general';
import { Fragment, useState, useRef, useEffect } from 'react'
import { createContext, useContext } from 'react';

type Severity = 'success' | 'error' | 'info';

export const NotifContext = createContext({
    updateNotif: (visible: boolean, text: string, severity: Severity, duration: number | null) => {}
});

export const useNotifs = () => useContext(NotifContext);

export function NotifProvider({ children }: { children: React.ReactNode }) {
    const [notifVisible, setNotifVisible] = useState(false);
    const [notifText, setNotifText] = useState('');
    const [notifSeverity, setNotifSeverity] = useState<Severity>('info');
    const [notifDuration, setNotifDuration] = useState<number | null>(null);
    
    function updateNotif(visible: boolean, text: string, severity: Severity, duration: number | null) {
        setNotifVisible(visible);
        setNotifText(text);
        setNotifSeverity(severity);
        setNotifDuration(duration);
    }

    return (
        <NotifContext.Provider value={{ updateNotif }}>
            {children}
            <Notifier visible={notifVisible} setVisible={setNotifVisible} text={notifText} severity={notifSeverity} duration={notifDuration} />
        </NotifContext.Provider>
    );
};


import { useEffect, useState } from "react";

// stores the sort param rather than the index, so reordering the options doesn't scramble a saved choice
export function usePersistedSort(storage_key: string, sort_params: string[]) {
    const [index, setIndex] = useState(() => Math.max(0, sort_params.indexOf(localStorage.getItem(storage_key) ?? "")));
    useEffect(() => { localStorage.setItem(storage_key, sort_params[index]); }, [storage_key, index]);
    return [index, setIndex] as const;
}

import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { ObservationDisplay, decodeTagFilters, encodeTagFilters, TagFilterState } from '@components/observations';

export default function Observations() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tagFilters = decodeTagFilters(searchParams.get('tags'));

    useEffect(() => {
        document.title = "Observations";
    }, []);

    return (
        <ObservationDisplay
            title="Observations"
            tagFilters={tagFilters}
            onTagFiltersChange={(state: TagFilterState) => setSearchParams(Object.keys(state).length ? { tags: encodeTagFilters(state) } : {})}
        />
    );
}

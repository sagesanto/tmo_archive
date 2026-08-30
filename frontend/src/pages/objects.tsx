import { ObjectDisplay } from '@components/objects/object_display';
import { decodeFlagFilters, encodeFlagFilters, FlagFilterState } from '@components/objects/flag_filter_tray';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
// import { ErrorMessage } from '@components/general/error';


export default function Objects() {
    const [createPopupOpen, setCreatePopupOpen] = useState(false); // ability to just create objects without catalog or proposal currently disabled

    const [selectedObj, setSelectedObj] = useState<Object[]>([]);

    const [searchParams, setSearchParams] = useSearchParams();
    const classificationFilter = searchParams.get('classification');
    const flagFilters = decodeFlagFilters(searchParams.get('flags'));

    // merge into existing params and replace (not push) so filter toggles don't spam browser history
    function updateParams(updates: Record<string, string | null>) {
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            for (const [key, value] of Object.entries(updates)) {
                if (value !== null) next.set(key, value);
                else next.delete(key);
            }
            return next;
        }, { replace: true });
    }

    useEffect(() => {
        document.title = "Objects";
    }, []);

    return (
        <>
            <ObjectDisplay
                title="All Objects"
                selected={selectedObj}
                setSelected={setSelectedObj}
                classificationFilter={classificationFilter}
                onClassificationFilterChange={(classification) => updateParams({ classification })}
                flagFilters={flagFilters}
                onFlagFiltersChange={(state: FlagFilterState) => updateParams({ flags: encodeFlagFilters(state) })}
            />
        </>
    );
}

import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { ObservationDisplay } from '@components/observations';

export default function Observations() {
    const [searchParams, setSearchParams] = useSearchParams();
    const obsTypesParam = searchParams.get('obs_types');
    const obsTypesFilter = obsTypesParam ? obsTypesParam.split(',') : [];

    useEffect(() => {
        document.title = "Observations";
    }, []);

    return (
        <ObservationDisplay
            title="Observations"
            obsTypesFilter={obsTypesFilter}
            onObsTypesFilterChange={(types) => setSearchParams(types.length ? { obs_types: types.join(',') } : {})}
        />
    );
}

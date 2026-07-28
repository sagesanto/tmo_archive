import { ObjectDisplay } from '@components/objects/object_display';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
// import { ErrorMessage } from '@components/general/error';


export default function Objects() {
    const [createPopupOpen, setCreatePopupOpen] = useState(false); // ability to just create objects without catalog or proposal currently disabled

    const [selectedObj, setSelectedObj] = useState<Object[]>([]);

    const [searchParams, setSearchParams] = useSearchParams();
    const classificationFilter = searchParams.get('classification');

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
                onClassificationFilterChange={(classification) => setSearchParams(classification ? { classification } : {})}
            />
        </>
    );
}

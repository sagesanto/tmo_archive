import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { AnalysisDisplay } from '@components/analyses';

export default function Analyses() {
    const [searchParams, setSearchParams] = useSearchParams();
    const statusFilter = searchParams.get('status');

    useEffect(() => {
        document.title = "Analyses";
    }, []);

    return (
        <AnalysisDisplay
            title="All Analyses"
            statusFilter={statusFilter}
            onStatusFilterChange={(status) => setSearchParams(status ? { status } : {})}
        />
    );
}

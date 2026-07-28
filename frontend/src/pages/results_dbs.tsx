import { useEffect } from 'react';
import { ResultsDBDisplay } from '@components/results_dbs';

export default function ResultsDBs() {
    useEffect(() => {
        document.title = "Results Databases";
    }, []);

    return (
        <ResultsDBDisplay title="Results Databases" />
    );
}

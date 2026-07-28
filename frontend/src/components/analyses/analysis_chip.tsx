import { getAnalysis } from '@api/analysis';
import { Chip} from '@mui/material';
import { AnalysisIcon } from '@assets/icons';
import { useNavigate } from 'react-router';
import {AppRoutes} from "@config/routes"
import { CollectionLengthChip, DisplayChip } from '@components/general';
import { RemoveCircle } from '@mui/icons-material';

export function AnalysisChip( { natural_key }: {natural_key: string}) {
    const { data: analysis, isLoading, isError } = getAnalysis(natural_key);
    
    let navigate = useNavigate();

    if (isLoading) {
        return (
            <Chip
                icon={<AnalysisIcon />}
                label = "Loading..."
            />
        );
    }
    
    if (isError || (!isLoading && !analysis)) {
        return ( 
            <Chip
                icon={<AnalysisIcon />}
                label = "Error :("
            />
        );
    }
    
    return (
        <DisplayChip
            icon={<AnalysisIcon />}
            label={`${analysis?.display_name}`}
            onClick={() => navigate(`${AppRoutes.analyses}/${natural_key}`)}
            color='secondary'
        />
    );
}

export function AnalysisObjChip( { natural_key }: {natural_key: string}) {
    const { data: analysis, isLoading, isError } = getAnalysis(natural_key);
    
    let navigate = useNavigate();

    if (isLoading) {
        return (
            <Chip
                icon={<AnalysisIcon />}
                label = "Loading..."
            />
        );
    }
    
    if (isError || (!isLoading && !analysis)) {
        return ( 
            <Chip
                icon={<AnalysisIcon />}
                label = "Error :("
            />
        );
    }

    
    return (
            <DisplayChip
                icon={<AnalysisIcon />}
                label = {`Analysis ${analysis.id}`}
                onClick={() => {navigate(`${AppRoutes.analyses}/${natural_key}`)}}
            />
    );
}
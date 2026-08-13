import { getMPCCandidate } from '@api/mpc_candidate';
import { Chip } from '@mui/material';
import { MPCIcon } from '@assets/icons';
import { useNavigate } from 'react-router';
import { AppRoutes } from "@config/routes"
import { DisplayChip } from '@components/general';

export function MPCChip({ designation }: { designation: string }) {
    const { data: mpc, isLoading, isError } = getMPCCandidate(designation);

    let navigate = useNavigate();

    if (isLoading) {
        return (
            <Chip
                icon={<MPCIcon />}
                label="Loading..."
            />
        );
    }

    if (isError || (!isLoading && !mpc)) {
        return (
            <Chip
                icon={<MPCIcon />}
                label="Error :("
            />
        );
    }

    return (
        <DisplayChip
            icon={<MPCIcon />}
            label={designation}
            onClick={() => navigate(`${AppRoutes.mpcs}/${designation}`)}
            color='secondary'
        />
    );
}

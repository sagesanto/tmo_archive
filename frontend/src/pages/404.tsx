import { useEffect } from 'react';
import { ErrorMessage } from '@components/general/error';

export function NotFound() {
    useEffect(() => {
        document.title = "NEOView - 404 Not Found";
    }, []);

    return (
        <ErrorMessage title="404 Page Not Found" message="The page you are looking for does not exist or has been moved." do_reporting={false}/>
    )
}



export default NotFound

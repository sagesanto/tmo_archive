import { Navigate, Outlet } from "react-router";
// import { useAuth } from "@hooks/useAuth";
import { AppRoutes } from "@config/routes";
import { useSelector } from 'react-redux'

// export function ProtectedRoute({ children }: { children: React.ReactNode }) {
//     const { authenticated, loading } = useAuth();

//     if (loading) {
//         console.log("Loading authentication state");
//         return <div>Loading...</div>;
//     }

//     if (!authenticated) {
//         console.log("Not authenticated");
//         return <Navigate to={AppRoutes.login} replace />;
//     }
//     console.log("Authenticated");
//     return children;
// };



// export function ProtectedRoute() {
//     const { userInfo } = useSelector((state) => state.auth)

//     // show unauthorized screen if no user is found in redux store
//     if (!userInfo) {
//         console.log("Not authenticated");
//         return <Navigate to={AppRoutes.login} replace />;
//     }

//     console.log("Authenticated");
//     return <Outlet />
// }

// export default ProtectedRoute
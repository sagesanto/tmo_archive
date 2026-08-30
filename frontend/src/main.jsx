import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import {
	useQuery,
	useMutation,
	useQueryClient,
	QueryClient,
	QueryClientProvider,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { BrowserRouter, Routes, Route } from "react-router";

import { ThemeProvider } from "@mui/material/styles"

import { theme } from "@config/theme"

import { AppRoutes } from "@config/routes"
import { PageFrame } from "@components/general"

// import { NotifProvider } from '@hooks/useNotifs'
// import { ErrorReportProvider } from '@hooks/useErrorReporting'

// import store from './state/store'
import { Provider } from 'react-redux'
import NotFound from "./pages/404"

// import Home from './pages/home'
// import Login from './pages/login'
// import Registration from './pages/registration'
// import Catalogs from './pages/catalogs'
// import Users from './pages/users'
// import Flags from './pages/flags'
// import Proposals from './pages/proposals'
import Objects from './pages/objects'
import ResultsDBs from './pages/results_dbs'
import Observations from './pages/observations'
import Analyses from './pages/analyses'
import AnalysisDetail from './pages/analysis_detail'
import ResultsDBDetail from './pages/results_db_detail'
import ObservationDetail from './pages/observation_detail'
import MPCDetail from './pages/mpc_detail'
// import Changelog from './pages/changelog'
// import NotFound from "./pages/404"
import Admin from './pages/admin'
// import ErrorDetail from './pages/error_detail'

// import CatalogDetail from './pages/catalog_detail'
// import UserDetail from './pages/user_detail'
import ObjectDetail from './pages/object_detail'
// import ProposalDetail from './pages/proposal_detail'
// import FlagDetail from './pages/flag_detail'


import { queryClient } from '@api/query_client';

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<ThemeProvider theme={theme}>
			{/* <Provider store={store}> */}
				{/* <ErrorReportProvider> */}
					<QueryClientProvider client={queryClient}>
						{/* <NotifProvider> */}
							{/* <AuthObserver> */}
								<BrowserRouter>
									<Routes>
										<Route element={<PageFrame />}>
											{/* <Route path={AppRoutes.home} element={<Home />} /> */}
											<Route path={AppRoutes.admin} element={<Admin />} />
											{/* <Route path={AppRoutes.errors}> */}
												{/* <Route path=":id" element={<ErrorDetail />} /> */}
											{/* </Route> */}
											<Route path={AppRoutes.analyses}>
												<Route index element={<Analyses />} />
												<Route path=":natural_key" element={<AnalysisDetail />} />
											</Route>
											{/* <Route path={AppRoutes.users}>
												<Route index element={<Users />} />
												<Route path=":id" element={<UserDetail />} />
											</Route> */}
											<Route path={AppRoutes.objects}>
												<Route index element={<Objects />} />
												<Route path=":natural_key" element={<ObjectDetail />} />
											</Route>
											<Route path={AppRoutes.results_dbs}>
												<Route index element={<ResultsDBs />} />
												<Route path=":natural_key" element={<ResultsDBDetail />} />
											</Route>
											<Route path={AppRoutes.observations}>
												<Route index element={<Observations />} />
												<Route path=":natural_key" element={<ObservationDetail />} />
											</Route>
											<Route path={AppRoutes.mpcs}>
												<Route path=":designation" element={<MPCDetail />} />
											</Route>
											{/* <Route path={AppRoutes.proposals}>
												<Route index element={<Proposals />} />
												<Route path=":id" element={<ProposalDetail />} />
											</Route>
											<Route path={AppRoutes.flags}>
												<Route index element={<Flags />} />
												<Route path=":id" element={<FlagDetail />} />
											</Route>
											<Route path={AppRoutes.changelog} element={<Changelog />} />
											<Route path="*" element={<NotFound />} /> */}
											<Route path="*" element={<NotFound />} />
										</Route>
									</Routes>
								</BrowserRouter>
							{/* </AuthObserver> */}
						{/* </NotifProvider> */}
						<ReactQueryDevtools initialIsOpen={false} />
					</QueryClientProvider>
				{/* </ErrorReportProvider> */}
			{/* </Provider> */}
		</ThemeProvider>
	</StrictMode>,
)

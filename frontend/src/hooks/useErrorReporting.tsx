import {axios} from "@api/axios"
// import { NewErrorReport, useCreateErrorReport } from "@api/error";
import { createContext, useContext } from 'react';
import { webCreateError } from "@utils/errors";

export const ErrorReportContext = createContext({
    reportError: (report: { error_message: string, misc: string | null }) => {}
});

export const useErrorReports = () => useContext(ErrorReportContext);

export function ErrorReportProvider({ children }) {
    function reportError(report: { error_message: string, misc: string | null }) {
        webCreateError(report);
    }

    return (
        <ErrorReportContext.Provider value={{ reportError }}>
            {children}
        </ErrorReportContext.Provider>
    );
};


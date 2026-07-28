import { axios } from "@api/axios";
import { ErrorReport, useCreateErrorReport } from "@api/error";
import { AnalysisIcon, ErrorIcon } from "@assets/icons";
import { CatCardContent } from "@components/catalogs";
import { feedbackUrl } from "@config/feedback";
import { AppRoutes } from "@config/routes";
import { Box, Stack, Typography } from "@mui/material";
import { Link } from 'react-router';
import { formatTimestamp } from "@utils/formatters";
import { useEffect, useRef, useState } from "react";
import { CardContainer } from "./cards";
import { useErrorReports } from "@hooks/useErrorReporting";

export function ErrorMessage({ message, title = "Something's Afoot :(", do_reporting=true, sx = {} }: { message: string, title?: string, do_reporting?: boolean, sx?: object }) {
    const [imgWidth, setImgWidth] = useState(300);
    let titleRef = useRef<HTMLDivElement | null>(null);
    let { reportError } = useErrorReports();

    useEffect(() => {
        if (!do_reporting) return;
        console.log("Reporting error:", message, title);
        reportError({ error_message: message, misc: title });
    }, []);

    useEffect(() => {
        if (titleRef.current) {
            const width = titleRef.current.getBoundingClientRect().width;
            if (!isNaN(width) && width > 0) {
                setImgWidth(width);
            }
        }
    }, []);

    return (
        <Stack direction="column" spacing={2} justifyContent={"center"} alignItems={'center'} sx={{ width: '100%', ...sx }}>
            <Stack ref={titleRef} color="primary" direction="row" spacing={2} justifyContent={"center"} alignItems={'center'}>
                <ErrorIcon color="primary" sx={{ fontSize: (theme) => theme.typography.h3.fontSize }} />
                <Typography color="primary" variant='h3'>  {title} </Typography>
            </Stack>

            <Typography variant='h4' color="error">
                {message}
            </Typography>
            <a href={feedbackUrl} target="_blank" rel="noopener noreferrer" >
                <Typography variant="h6" sx={{ color: 'info', width: '100%' }}>
                    Please report this error!
                </Typography>
            </a>
            <Stack direction="row" spacing={2} justifyContent={'center'} alignContent={'center'} >
                <Box sx={{ borderRadius: 2, border: '2px solid', borderColor: 'secondary.main', overflow: "hidden", aspectRatio: 1 }}>
                    <img src={"/error.png"} alt="Error" style={{ display: "block", objectFit: 'contain', aspectRatio: 1, maxWidth: imgWidth }} />
                </Box>
            </Stack>
        </Stack>
    );
}

export function ErrorReportCard({ err }: { err: ErrorReport }) {
    return (
        <Link to={`${AppRoutes.errors}/${err.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <CardContainer>
                <ErrorReportCardContent err={err} />
            </CardContainer>
        </Link>
    )
}

export function ErrorReportCardContent({ err }: { err: ErrorReport }) {
    return (
        <Stack direction="column" spacing={2} padding={0.5} alignItems={'flex-start'} justifyContent={"center"} sx={{ width: '100%' }}>
            <Stack direction="row" spacing={2} alignItems={'center'} sx={{ width: '100%' }}>
                <ErrorIcon sx={{ fontSize: (theme) => theme.typography.h4.fontSize }} />
                <Typography variant='h5' sx={{ whiteSpace: "nowrap", flexShrink: 0 }}> { err.error_message } </Typography>
            </Stack>
            <Typography variant='h6' sx={{ marginTop: '1em' }}>
                {err.source}
            </Typography>
            <Typography variant='subtitle2' sx={{ marginTop: '1em' }}>
                {`ID ${err.id} | ${formatTimestamp(err.created_at)} UT`}
            </Typography>
            
        </Stack>
    );
}
import { Button, CircularProgress, Grid, MenuItem, skeletonClasses, Slide, Stack, TextField, Typography } from "@mui/material";
import { useRef, useState, useEffect } from "react";
import SaveIcon from '@mui/icons-material/Save';
import { FlagIcon, HomeIcon } from "@assets/icons";
// import { AddCircle, AddCircleOutline, AddCircleOutlineOutlined, CheckCircle, HdrPlusOutlined } from "@mui/icons-material";
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import { NewObject, Object } from "@api/object";
import { FileUploadButton, FileUploadStatus } from "@components/general";
import { readFile } from "@utils/uploads";
import { feedbackUrl } from "@config/feedback";

import Papa from 'papaparse';
import { TransitionGroup } from "react-transition-group";
import { ErrorBoundary } from "react-error-boundary";
import { useErrorReports } from "@hooks/useErrorReporting";
import { delimiter } from "path";

enum CreateObjectsStatus {
    SELECTING,
    PARSING,
    MAPPING,
    CREATING,
    REVIEWING,
}

const mapFields = [
    {
        field: 'ra',
        type: 'numeric',
        required: true,
        description: 'Right Ascension (degrees)',
        data_transform: (value: any) => { return value }
    },
    {
        field: 'dec',
        type: 'numeric',
        required: true,
        description: 'Declination (degrees)',
        data_transform: (value: any) => { return value }
    },
    {
        field: 'mer_id',
        type: 'numeric',
        required: false,
        description: 'Euclid Unique ID',
        data_transform: (value: any) => { return parseInt(value) }
    },
]

export function ErrorFallback({ error, resetErrorBoundary, onCancel }: { error: Error, resetErrorBoundary: () => void, onCancel: () => void }) {
    return (
        <>
            <DialogTitle>Unexpected Error Occurred</DialogTitle>
            <DialogContent dividers={false}>
                <Stack direction="column" alignItems={'center'} justifyContent={"center"} sx={{ width: '100%' }}>
                    <Typography variant="body1" color="error"> {error.message} </Typography>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => { resetErrorBoundary(); onCancel(); }} variant="outlined" color='primary'>
                    Cancel
                </Button>
            </DialogActions>
        </>
    )
}

export function UploadErrorPopup({ error, isOpen, onClose }: { error: string, isOpen: boolean, onClose: () => void }) {
    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth={true}>
            <DialogTitle>Unexpected Error When Uploading Objects</DialogTitle>
            <DialogContent dividers={true}>
                <Stack direction="column" alignItems={'center'} justifyContent={"center"} sx={{ width: '100%' }}>
                    <Typography variant="subtitle1" color="error"> {error} </Typography>
                    <Typography variant="body2" sx={{ marginTop: '1em' }}>
                        This error may be due to a problem with the file you uploaded or in the backend process that reads it. We've logged this error, but it would be very helpful if you could fill out <a href={feedbackUrl} target="_blank" rel="noopener noreferrer" > this form</a> with some context.
                    </Typography>
                </Stack>

            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="outlined" color='primary'>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    )
}

export function ObjectCreationPopup({ isOpen, onConfirm, onCancel }: { isOpen: boolean, onConfirm: (newObjs: NewObject[]) => void, onCancel: () => void }) {

    const [status, setStatus] = useState(CreateObjectsStatus.SELECTING);

    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<string | ArrayBuffer | null>(null);
    const [options, setOptions] = useState<CSVOptions | null>(null);

    const [headers, setHeaders] = useState<string[]>([])
    const [rows, setRows] = useState<object[]>([])

    const [mapping, setMapping] = useState<string[]>([]);

    const [objects, setObjects] = useState<NewObject[]>([]);

    const { reportError } = useErrorReports();

    return (
        <Dialog open={isOpen} onClose={onCancel} scroll="paper" maxWidth="sm" fullWidth={true} >
            {/* <TransitionGroup> */}
            <ErrorBoundary
                fallbackRender={(props) => <ErrorFallback {...props} onCancel={onCancel} />}
                onError={(error, info) => {
                    console.error("Error in ObjectCreationPopup:", error, info);
                    reportError({ error_message: error.message, misc: JSON.stringify({ type: 'ObjectCreationPopup', info }) });
                }}
            >
                {status == CreateObjectsStatus.SELECTING &&
                    <UploadObjectStage
                        onNext={(data, file, options) => {
                            setFile(file);
                            setData(data);
                            setOptions(options);
                            setStatus(CreateObjectsStatus.PARSING);
                        }}
                        onCancel={onCancel} />
                }
                {status == CreateObjectsStatus.PARSING &&
                    <ParseObjectStage
                        data={data}
                        csv_options={options!}
                        onCancel={onCancel}
                        onComplete={(parsed, headers) => {
                            setRows(parsed);
                            setHeaders(headers);
                            setStatus(CreateObjectsStatus.MAPPING);
                        }}
                    />
                }
                {status == CreateObjectsStatus.MAPPING &&
                    <MapHeadersStage
                        headers={headers}
                        onCancel={onCancel}
                        onComplete={(mapping) => { console.log(`mapping: ${mapping}`); setMapping(mapping); setStatus(CreateObjectsStatus.CREATING) }}
                    />
                }
                {status == CreateObjectsStatus.CREATING &&
                    <PerformMappingStage
                        mapping={mapping}
                        rows={rows}
                        onCancel={onCancel}
                        onComplete={(constructedObjs) => { setObjects(constructedObjs); console.log(`built the following objects:`, constructedObjs); setStatus(CreateObjectsStatus.REVIEWING); }}
                    />
                }
                {status == CreateObjectsStatus.REVIEWING &&
                    <ReviewStage
                        file={file}
                        mapping={mapping}
                        objects={objects}
                        onCancel={onCancel}
                        onComplete={() => { onConfirm(objects); }}
                    />
                }
            </ErrorBoundary>
            {/* </TransitionGroup> */}
        </Dialog>

    )
}

// TODO: should probably remember the user's settings in local storage
type CSVOptions = {
    delimiter?: string,
    newline?: string,
    quoteChar?: string,
    dynamicTyping?: boolean,
    encoding?: string,
    comments?: string,
    // skipFirstNLines?: number,
    readOnlyNLines?: number,
}

function ExpandableOptions({ options, setOptions }: { options: CSVOptions, setOptions: (options: CSVOptions) => void }) {
    const [expanded, setExpanded] = useState(false);

    const handleChange = (field: keyof CSVOptions, value: any) => {
        setOptions((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    return (
        <Stack sx={{ width: "100%", mt: 2, justifyContent: "center", alignItems: "center" }}>
            <Button
                size="small"
                onClick={() => setExpanded((v) => !v)}
            >
                {expanded ? "Hide CSV Options" : "Show CSV Options"}
            </Button>
            {expanded && (
                <Grid container spacing={2} columns={2}>
                    <Grid size={1}>
                        <TextField
                            label="Delimiter"
                            value={options.delimiter}
                            onChange={(e) => handleChange("delimiter", e.target.value)}
                            size="small"
                            fullWidth
                            helperText="Character(s) separating columns (default: autodetect)"
                        />
                    </Grid>
                    <Grid size={1}>
                        <TextField
                            label="Newline"
                            value={options.newline}
                            onChange={(e) => handleChange("newline", e.target.value)}
                            size="small"
                            fullWidth
                            helperText="Newline character (default: autodetect)"
                        />
                    </Grid>
                    <Grid size={1}>
                        <TextField
                            label="Quote Character"
                            value={options.quoteChar}
                            onChange={(e) => handleChange("quoteChar", e.target.value)}
                            size="small"
                            fullWidth
                            helperText='Character for quoting fields (default: ")'
                        />
                    </Grid>
                    <Grid size={1}>
                        <TextField
                            label="Encoding"
                            value={options.encoding}
                            onChange={(e) => handleChange("encoding", e.target.value)}
                            size="small"
                            fullWidth
                            helperText="File encoding (default: utf-8)"
                        />
                    </Grid>
                    <Grid size={1}>
                        <TextField
                            label="Comment Character"
                            value={options.comments}
                            onChange={(e) => handleChange("comments", e.target.value)}
                            size="small"
                            fullWidth
                            helperText="Lines starting with this character are comments (leave blank for no comments)"
                        />
                    </Grid>
                    {/* <Grid size={1}>
                        <TextField
                            label="Skip First N Lines"
                            type="number"
                            value={options.skipFirstNLines ?? 0}
                            onChange={(e) => handleChange("skipFirsNLines", Number(e.target.value))}
                            size="small"
                            fullWidth
                            helperText="Skip this many lines at the start"
                            inputProps={{ min: 0 }}
                        />
                    </Grid> */}
                    <Grid size={1}>
                        <TextField
                            label="Read Only N Lines"
                            type="number"
                            value={options.readOnlyNLines ?? ""}
                            onChange={(e) => handleChange("readOnlyNLines", e.target.value ? Number(e.target.value) : undefined)}
                            size="small"
                            fullWidth
                            helperText="Only read this many lines (leave blank for all)"
                            inputProps={{ min: 1 }}
                        />
                    </Grid>
                    <Grid size={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2">Dynamic Typing</Typography>
                            <Button
                                size="small"
                                variant={options.dynamicTyping ? "contained" : "outlined"}
                                onClick={() => handleChange("dynamicTyping", !options.dynamicTyping)}
                            >
                                {options.dynamicTyping ? "On" : "Off"}
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>
            )}
        </Stack>
    );
}

function UploadObjectStage({ onNext, onCancel }: { onNext: (data: string | ArrayBuffer | null, file: File, options: CSVOptions) => void, onCancel: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState(FileUploadStatus.IDLE);
    const [data, setData] = useState<string | ArrayBuffer | null>(null);
    const [progress, setProgress] = useState(0);

    const [options, setOptions] = useState<CSVOptions>({
        delimiter: "",
        newline: "",
        quoteChar: '"',
        dynamicTyping: true,
        encoding: "utf-8",
        comments: "#",
        // skipFirstNLines: 0,
        readOnlyNLines: undefined,
    });

    const handleStatusChange = (newStatus: FileUploadStatus) => {
        setStatus(newStatus);
        console.log(`File upload status changed to: ${FileUploadStatus[newStatus]}`);
    }

    const onLoad = (data: string | ArrayBuffer | null, file: File) => {
        setFile(file);
        setData(data);
        console.log(`File selected: ${file.name}`);
        console.log(`File read complete: ${data}`);
    }

    return (
        <>
            <DialogTitle>Upload Objects</DialogTitle>
            <DialogContent dividers={false}>
                <Stack direction="column" alignItems={'center'} justifyContent={"center"} sx={{ width: '100%' }}>
                    <FileUploadButton title={"Choose CSV"} filetype={".csv"} onLoad={onLoad} sx={{ width: '60%' }} onStatusChange={handleStatusChange} onProgress={setProgress} />
                    <ExpandableOptions options={options} setOptions={setOptions} />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => { onCancel(); }} variant="outlined" color='primary'>
                    Cancel
                </Button>
                <Button onClick={() => { onNext(data, file!, options); }} variant="contained" color='primary' disabled={status !== FileUploadStatus.SUCCESS}>
                    {status == FileUploadStatus.LOADING ? `${Math.floor(progress)}%` : "Parse"}
                </Button>
            </DialogActions>
        </>
    )
}


function ParseObjectStage({ data, csv_options, onComplete, onCancel }: { data: string | ArrayBuffer | null, csv_options: CSVOptions, onComplete: (parsed: object[], headers: string[]) => void, onCancel: () => void }) {

    enum ParseState {
        PARSING,
        ERROR,
        COMPLETE
    }

    const [state, setState] = useState(ParseState.PARSING)
    const [error, setError] = useState({ msg: '', row: 0 })

    function validateCSV(rows, headers) {
        console.log("validating CSV...");
        if (!rows || rows.length === 0) {
            setState(ParseState.ERROR);
            setError({ msg: 'CSV file is empty.', row: 0 });
            return false;
        }
        let min_num_headers = mapFields.filter(f => f.required).length
        if (!headers || headers.length < min_num_headers) {
            setState(ParseState.ERROR);
            setError({ msg: `CSV file must have at least ${min_num_headers} headers to be mapped to Objects. This can sometimes occur when your file contains illegal comments in its header or uses unusual delimiters.`, row: 0 });
            return false;
        }
        console.log("CSV validation passed.");
        return true;
    }

    useEffect(() => {
        console.log("Parsing csv with options:", csv_options);
        Papa.parse(data as string, {
            header: true,
            worker: true,
            skipEmptyLines: "greedy",  // greedy also skips lines that are just whitespace
            delimiter: csv_options.delimiter || undefined,
            newline: csv_options.newline || undefined,
            quoteChar: csv_options.quoteChar || '"',
            dynamicTyping: csv_options.dynamicTyping || false,
            encoding: csv_options.encoding || undefined,
            comments: csv_options.comments || undefined,
            preview: csv_options.readOnlyNLines || 0,
            complete: (results, file) => {
                console.log("Parsing complete:", results, file);
                if (validateCSV(results.data, results.meta.fields)) {
                    setState(ParseState.COMPLETE)
                    setTimeout(() => { onComplete(results.data, results.meta.fields) }, 1000)
                }
            },
            error: (error) => {
                console.error("Error parsing CSV:", error);
                setState(ParseState.ERROR)
                setError({ msg: error.message, row: error.row });
            }
        });
    }, [])


    return (
        <>
            <DialogTitle>{state == ParseState.ERROR ? "Something's Afoot :(" : "Parsing..."}</DialogTitle>
            <DialogContent dividers={false}>
                <Stack direction="column" spacing={1} alignItems={'center'} justifyContent={"center"} sx={{ width: '100%' }}>
                    {state == ParseState.PARSING && <CircularProgress />}
                    {state == ParseState.ERROR &&
                        <>
                            <Typography variant="body1"> {`Encountered the following error at row ${error.row} when parsing CSV: '${error.msg}'`} </Typography>
                            <Typography variant="body1"> {`Please remedy and try again.`} </Typography>
                        </>
                    }
                    {state == ParseState.COMPLETE && <HomeIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize }} />}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => { onCancel(); }} variant="outlined" color='primary'>
                    Cancel
                </Button>
            </DialogActions>
        </>
    )
}

function MapHeadersStage({ headers, onComplete, onCancel }: { headers: string[], onComplete: (mapping: string[]) => void, onCancel: () => void }) {

    const [mapping, setMapping] = useState<string[]>(Array(mapFields.length).fill(''));
    const [isValid, setIsValid] = useState(false);


    const onSelect = (selectedHeader: string, index: number) => {
        mapping.splice(index, 1, selectedHeader);
        setMapping(mapping);
        console.log("Mapping updated:", mapping);
        setIsValid(mapFields.map((f, i) => f.required ? mapping[i] : true).every((v) => v));
    }

    // headers.filter((h: string) => (!mapping.includes(h) || mapping[index] == h))

    return (
        <>
            <DialogTitle>Map CSV Headers</DialogTitle>
            <DialogContent dividers={false}>
                <Stack direction="column" paddingY={0.5} spacing={3} alignItems={'center'} justifyContent={"center"} sx={{ width: '100%' }}>
                    {mapFields.map((field, index) => (
                        <TextField
                            select
                            key={field.field}
                            label={field.field}
                            onChange={(e) => { onSelect(e.target.value, index); }}
                            helperText={(field.required ? "(Required) " : "(Optional) ") + field.description}
                            fullWidth
                            sx={{ minHeight: '32px', width: '100%' }}
                        >
                            <MenuItem value="" disabled={field.required} > Select </MenuItem>
                            {headers.map((header) => (
                                <MenuItem key={header} value={header}>
                                    {header}
                                </MenuItem>
                            ))}
                        </TextField>
                    ))}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => { onCancel(); }} variant="outlined" color='primary'>
                    Cancel
                </Button>
                <Button variant="contained" color='primary' disabled={!isValid} onClick={() => { onComplete(mapping) }}>
                    Next
                </Button>
            </DialogActions>
        </>
    )
}

function PerformMappingStage({ mapping, rows, onComplete, onCancel }: { mapping: string[], rows: object[], onComplete: (newObjs: NewObject[]) => void, onCancel: () => void }) {

    enum MapState {
        MAPPING,
        ERROR,
        COMPLETE
    }

    const [state, setState] = useState(MapState.MAPPING)
    const [error, setError] = useState('')

    useEffect(() => {
        try {
            const newObjs = rows.map((row, i) => {
                // console.log("Mapping row:", row);
                const obj: any = {};
                mapping.forEach((field, index) => {
                    // console.log(`Mapping field ${mapFields[index].field} to value ${row[field]}`);
                    var v = row[field];
                    if (v === undefined || v === null) {
                        if (mapFields[index].required) {
                            throw new Error(`Required field ${mapFields[index].field} is missing in row ${i + 1}.`);
                        }
                    } else {
                        try {
                            v = mapFields[index].data_transform(v);
                        } catch (transformError) {
                            throw new Error(`Error transforming value for field ${mapFields[index].field} in row ${i + 1}: ${transformError.message}`);
                        }
                    }
                    obj[mapFields[index].field] = v;
                });
                // console.log("built object:", obj);
                return obj as NewObject;
            });
            setState(MapState.COMPLETE);
            setTimeout(() => {
                onComplete(newObjs);
            }, 1000);
            // console.log("Mapped rows to Objects:", newObjs);
        } catch (err: any) {
            console.error("Error mapping rows to Objects:", err);
            setState(MapState.ERROR);
            setError(err.message || 'Unknown error');
        }
    }, [])



    return (
        <>
            <DialogTitle>{state == MapState.ERROR ? "Something's Afoot :(" : "Mapping..."}</DialogTitle>
            <DialogContent dividers={false}>
                <Stack direction="column" spacing={1} alignItems={'center'} justifyContent={"center"} sx={{ width: '100%' }}>
                    {state == MapState.MAPPING && <CircularProgress />}
                    {state == MapState.ERROR &&
                        <>
                            <Typography variant="body1"> {`Encountered the following error when mapping rows to Objects: '${error}'`} </Typography>
                            <Typography variant="body1"> {`Please remedy and try again.`} </Typography>
                        </>
                    }
                    {state == MapState.COMPLETE && <HomeIcon sx={{ fontSize: (theme) => theme.typography.h3.fontSize }} />}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => { onCancel(); }} variant="outlined" color='primary'>
                    Cancel
                </Button>
            </DialogActions>
        </>
    )
}


// business is handled in the main component, this is just the UI stage
function ReviewStage({ mapping, objects, file, onComplete, onCancel }: { mapping: string[], objects: Object[], file: File, onComplete: () => void, onCancel: () => void }) {

    return (
        <>
            <DialogTitle>Review</DialogTitle>
            <DialogContent dividers={false}>
                <Stack direction="column" spacing={1} alignItems={'flex-start'} justifyContent={"center"} sx={{ width: '100%' }}>
                    <Stack direction="row" spacing={1} alignItems={'center'} justifyContent={"flex-start"} sx={{ width: '100%' }}>
                        <Typography variant="body1"> File: </Typography>
                        <Typography variant="body2" noWrap> {file.name} </Typography>
                    </Stack>
                    <Typography variant="body1"> Objects: {objects.length} </Typography>
                    <Typography variant="body1"> Mapped Fields: </Typography>
                    <Stack direction="column" spacing={0.5} alignItems={'flex-start'} justifyContent={"center"} sx={{ width: '100%' }}>
                        {mapping.map((field, index) => (
                            <Typography key={index} noWrap variant="body2" sx={{ textIndent: "1em" }}> {`${mapFields[index].field}: ${field}`} </Typography>
                        ))}
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => { onCancel(); }} variant="outlined" color='primary'>
                    Cancel
                </Button>
                <Button variant="contained" color='primary' onClick={onComplete}>
                    Done
                </Button>
            </DialogActions>
        </>
    )
}
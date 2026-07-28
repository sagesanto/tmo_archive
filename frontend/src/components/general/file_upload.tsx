import React, { use, useEffect, useRef, useState } from 'react';  // Import React and useRef hook
import { Button, LinearProgress, Stack, Typography } from "@mui/material";
import { readFile } from "@utils/uploads";
import { LinearProgressWithLabel } from './loading';
import { on } from 'events';

// basic button to open selection dialog
export function FileSelectButton({ title, filetype, handleFile, disabled=false, sx = {} }: { title: string, filetype: string, handleFile: (file: File) => void, disabled?: boolean, sx: object }) {  
    // Create a reference to the hidden file input element
    const hiddenFileInput = useRef(null);

    // Programatically click the hidden file input element when the Button component is clicked
    const handleClick = event => {
        hiddenFileInput.current.click();
    };

    const handleSelect = event => {
        const fileUploaded = event.target.files[0];
        handleFile(fileUploaded);
    };

    return (
        <>
            <Button variant="contained" color="primary" component="span" onClick={handleClick} disabled={disabled} sx={{ minHeight:"48px", ...sx }}>
                <Typography noWrap>{title}</Typography>
            </Button>
            <input
                type="file"
                accept={filetype}
                onChange={handleSelect}
                ref={hiddenFileInput}
                style={{ opacity: 0, height: 0, width: 0}} // Make the file input element invisible
            />
        </>
    );
}

export enum FileUploadStatus {
    IDLE,
    LOADING,
    ERROR,
    SUCCESS,
}

// button to select and read file
export function FileUploadButton({ title, filetype, disabled=false, onLoad, onStatusChange=()=>{}, onProgress=()=>{}, sx={} }: { title: string, filetype: string, onLoad: (data: string | ArrayBuffer | null, file: File) => void, onStatusChange?: (status: FileUploadStatus)=>void, onProgress?: (percent: number) => void, disabled?: boolean, sx?: object }) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [status, setStatus] = useState(FileUploadStatus.IDLE);
    
    useEffect(() => { /*console.log(`status is now ${FileUploadStatus[status]}`);*/ onStatusChange(status); }, [status, onStatusChange]);
    
    // useEffect(() => { console.log(`File selected: ${selectedFile?.name}`); }, [selectedFile]);
    
    
    function onUploadComplete(data :string | ArrayBuffer | null, file: File) {
        onProgress(100);
        // console.log(`File read complete. file: ${file}. data: ${data}`);
        setStatus(FileUploadStatus.SUCCESS);
        onLoad(data, file);
    }
    
    function handleFile(file: File) {
        setStatus(FileUploadStatus.LOADING);
        // console.log("file selected.");
        setSelectedFile(file);
        readFile(file, onProgress, (data: string | ArrayBuffer | null) => {onUploadComplete(data, file);});
    }
    
    return (
        <FileSelectButton aria-busy={status == FileUploadStatus.LOADING} title={selectedFile ? selectedFile.name : title} filetype={filetype} handleFile={handleFile} disabled={disabled} sx={{ ...sx }} />
    )
    
}

export function FileUploadButtonWithBar({ title, filetype, disabled=false, onLoad, onStatusChange=()=>{}, onProgress=()=>{}, button_sx = {}, sx={} }: { title: string, filetype: string, onLoad: (data: string | ArrayBuffer | null, file: File) => void, onStatusChange?: (status: FileUploadStatus)=>void, onProgress?: (percent: number) => void, disabled?: boolean, button_sx?: object, sx?: object }) {
    const [status, setStatus] = useState(FileUploadStatus.IDLE);
    const [uploadProgress, setUploadProgress] = useState(0);
    
    function onStatus(status: FileUploadStatus) {
        setStatus(status);
        onStatusChange(status);
    }

    function updateProgress(percent: number) {
        setUploadProgress(percent);
        onProgress(percent);
    }

    <Stack direction="column" alignItems={'center'} justifyContent={"center"} sx={{ ...sx }}>
        <FileUploadButton aria-described-by={"upload-progress-bar"} title={title} filetype={filetype} onLoad={onLoad} onProgress={updateProgress} onStatusChange={onStatus} disabled={disabled} sx={{ ...button_sx }} />
        <LinearProgressWithLabel props={{id: "upload-progress-bar"}} value={uploadProgress} sx={{opacity: status == FileUploadStatus.IDLE ? 0 : 100 }}/>
    </Stack>
}

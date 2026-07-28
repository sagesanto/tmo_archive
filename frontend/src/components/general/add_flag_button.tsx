import { Flag, getFlags, useAddFlagToObject } from "@api/flag";
import { Button, skeletonClasses, Typography } from "@mui/material";
import { useState } from "react";
import { SplitButton } from "./split_button";
import SaveIcon from '@mui/icons-material/Save';
import { FlagIcon } from "@assets/icons";
import { AddCircle, AddCircleOutline, AddCircleOutlineOutlined, CheckCircle, HdrPlusOutlined, HourglassTop } from "@mui/icons-material";
import { useDispatch, useSelector } from 'react-redux'
import { setFlagButtonSettings } from "@state/uiSlice";

export function AddFlagButton({ obj_id, sx, flagsOnObject, buttonIndex, dropdownEnabled = true }: { obj_id: number, sx: object | undefined, flagsOnObject: Flag[], buttonIndex: number, dropdownEnabled?: Boolean }) {
    const { data: flags, isLoading, isError } = getFlags();
    const dispatch = useDispatch()
    const { selectedIds } = useSelector((state) => state.flagButton)

    // const [selectedFlag, setSelectedFlag] = useState<Flag | null>(null);
    
    
    const addFlagToObject = useAddFlagToObject();
    
    if (isLoading) {
        return (
            <Button variant="outlined" loading>
                <Typography>Loading...</Typography>
            </Button>
        )
    }
    
    if (isError || (!isLoading && !flags)) {
        return (
            <Button variant="outlined" disabled>
                <Typography>Error loading flags</Typography>
            </Button>
        )
    }
    
    let selectedFlag = selectedIds[buttonIndex] ? flags.find((flag) => flag.id === selectedIds[buttonIndex]) : flags[0]
    // console.log(buttonIndex, selectedIds, flags, selectedFlag)

    const setSelectedFlag = (flag: Flag) => {
        if (!flag) {
            console.log("tried to set selected flag but it is ",flag)
            return;
        }
        dispatch(setFlagButtonSettings({ index: buttonIndex, value:flag.id }))
    }

    var notYetAdded = selectedFlag ? !flagsOnObject?.map((f) => f.id).includes(selectedFlag.id) : true;
    
    return (
        <SplitButton
            labels={flags!!.map((flag) => flag.name)}
            values={flags!!}
            selected={selectedFlag}
            onClick={async (flag) => {
                await addFlagToObject.mutateAsync({ flag_id: flag.id, obj_id: obj_id });
            }}
            onSelectionChange={setSelectedFlag}
            icon={ addFlagToObject.isPending ? <HourglassTop/> :  (notYetAdded ? <AddCircle /> : <CheckCircle />)}
            sx={sx}
            buttonEnabled={notYetAdded && !addFlagToObject.isPending}
            dropdownEnabled={dropdownEnabled && !addFlagToObject.isPending}
        />
    )
}
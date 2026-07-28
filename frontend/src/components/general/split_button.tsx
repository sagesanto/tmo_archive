// generalized from https://mui.com/material-ui/react-button-group/#split-button

import * as React from 'react';
import { Button, ButtonGroup, Grow, Paper, Popper, MenuItem, MenuList, IconButton, Box, Divider } from '@mui/material';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { on } from 'events';


export function SplitButton<Type>({ labels, values, selected, onClick, onSelectionChange, icon = null, sx, buttonEnabled=true, dropdownEnabled=true, buttonLoading=false }: { labels: string[], values: Type[], selected:Type, onClick: (value: Type) => void, onSelectionChange: (value: Type) => void, icon?: React.ReactNode, sx?: object, buttonEnabled?:Boolean, dropdownEnabled?:Boolean, buttonLoading?:Boolean }) {
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLDivElement>(null);

    const selectedIndex = values.findIndex((values) => values === selected);
    // const [selectedIndex, setSelectedIndex] = React.useState(0);

    React.useEffect(() => {
        onSelectionChange(values[selectedIndex]);
    }, [selectedIndex, values, onSelectionChange]);

    const handleMenuItemClick = (
        event: React.MouseEvent<HTMLLIElement, MouseEvent>,
        index: number,
    ) => {
        // setSelectedIndex(index);
        setOpen(false);
        onSelectionChange(values[index]);
    };

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event: Event) => {
        if (
            anchorRef.current &&
            anchorRef.current.contains(event.target as HTMLElement)
        ) {
            return;
        }

        setOpen(false);
    };

    return (
        <React.Fragment>
            <Box
                sx={{
                    display: "inline-block",
                    width: "auto",
                }}
            >
                <ButtonGroup
                    variant="contained"
                    ref={anchorRef}
                    aria-label="Button group with a nested menu"
                    sx={{
                        display: "inline-flex",
                        width: "auto",
                        ...sx
                    }}
                    color={sx?.color || "primary"}
                >
                    <Button 
                        disabled={!buttonEnabled}
                        loading={buttonLoading ? true : false} 
                        onClick={() => onClick(values[selectedIndex])} 
                        sx={sx}
                        loadingPosition='start'
                    >
                        {icon && !buttonLoading && (
                            <Box
                                component="span"
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    marginRight: 1,
                                }}
                            >
                                {icon}
                            </Box>
                        )}
                        {labels[selectedIndex]}
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        aria-controls={open ? 'split-button-menu' : undefined}
                        aria-expanded={open ? 'true' : undefined}
                        aria-haspopup="menu"
                        onClick={handleToggle}
                        sx={sx}
                        disabled={!dropdownEnabled}
                    >
                        <ArrowDropDownIcon />
                    </Button>
                </ButtonGroup>
                <Popper
                    sx={{ zIndex: 1 }}
                    open={open}
                    anchorEl={anchorRef.current}
                    role={undefined}
                    transition
                    disablePortal
                >
                    {({ TransitionProps, placement }) => (
                        <Grow
                            {...TransitionProps}
                            style={{
                                transformOrigin:
                                    placement === 'bottom' ? 'center top' : 'center bottom',
                            }}
                        >
                            <Paper >
                                <ClickAwayListener onClickAway={handleClose}>
                                    <MenuList id="split-button-menu" autoFocusItem sx={{ width: anchorRef.current ? anchorRef.current.offsetWidth : undefined }}>
                                        {labels.map((label, index) => (
                                            <MenuItem
                                                key={label}
                                                selected={index === selectedIndex}
                                                onClick={(event) => handleMenuItemClick(event, index)}
                                            >
                                                {label}
                                            </MenuItem>
                                        ))}
                                    </MenuList>
                                </ClickAwayListener>
                            </Paper>
                        </Grow>
                    )}
                </Popper>
            </Box>
        </React.Fragment>
    );
}

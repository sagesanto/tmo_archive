import theme from "@config/theme";
import { CardActionArea, Card, CardContent, Skeleton, Stack } from "@mui/material";

export function CardContainer({ children, sx = {}, inner_sx={}, onClick }: { children: React.ReactNode, sx?: object, inner_sx?:object, onClick?: () => void }) {
    return (
        <Card sx={{ ...sx }}>
            <CardActionArea onClick={onClick} >
                <CardContent sx={{ ...inner_sx }}>
                    {children}
                </CardContent>
            </CardActionArea>
        </Card>
    );
}

export function LargeLoadingCard() {
    return (
        <CardContainer>
            <Stack direction="column" spacing={2} alignItems={'left'} sx={{ width: '100%' }}>
                <Skeleton variant="text" width={"30%"} sx={{ fontSize: (theme) => theme.typography.h5.fontSize }} />
                <Skeleton variant="rectangular" width="100%" height={150} />
            </Stack>
        </CardContainer>
    );
}

export function MediumLoadingCard() {
    return (
        <CardContainer>
            <Stack direction="column" spacing={2} alignItems={'left'} sx={{ width: '100%' }}>
                <Skeleton variant="text" width={"100%"} sx={{ fontSize: (theme) => theme.typography.h5.fontSize }} />
            </Stack>
        </CardContainer>
    );
}

export function SelectableCardContainer<T>({ children, sx = {}, inner_sx={}, isChecked, payload, onSelectionChange }: { children: React.ReactNode, sx?: object, inner_sx?: object, isChecked: boolean, payload: T, onSelectionChange: (payload: T) => void }) {
    return (
        <CardContainer sx={{ border: isChecked ? `3px solid ${theme.palette.secondary.main}` : '3px solid transparent', ...sx, }} inner_sx={inner_sx} onClick={() => { onSelectionChange(payload) }} >
            {children}
        </CardContainer>
    )
}

export function CardList({ sx={}, children }: { sx?:object, children: React.ReactNode }) {
    return (
        <Stack spacing={2} sx={{ flexWrap: 'wrap', justifyContent: 'space-evenly', width: '100%', ...sx }}>
            {children}
        </Stack>
    )
}

export function SelectableCardList<T extends { id: string | number }>({ items, makeContent, selected, setSelected }: { items: T[], makeContent: (item: T) => (React.ReactNode), selected: T[], setSelected: React.Dispatch<React.SetStateAction<T[]>> }) {
    const handleSelect = (clickedItem: T) => {
        if (selected.some((item) => item.id === clickedItem.id)) {
            setSelected((prevSelected) => prevSelected.filter((item) => item.id !== clickedItem.id));
        } else {
            setSelected((prevSelected) => [...prevSelected, clickedItem]);
        }
    };

    return (
        <CardList>
            {items.map((item: T) => {
                return (
                    <SelectableCardContainer key={item.id} isChecked={selected.some((selectedItem) => selectedItem.id === item.id)} payload={item} onSelectionChange={handleSelect}>
                        {makeContent(item)}
                    </SelectableCardContainer>
                )
            })}
        </CardList>
    )
}
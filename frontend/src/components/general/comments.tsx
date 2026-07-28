import { useState, useEffect } from 'react'
import { useParams, useNavigate } from "react-router";
import { Container, Stack, Typography, Skeleton, Grid, Divider, Button, Box, Tooltip } from '@mui/material'

import { AnalysisIcon, RemoveFromCatalogIcon, EditIcon, ObjectIcon } from '@assets/icons';
import { getCatalog, useDeleteCatalog, useEditCatalog } from '@api/catalog';
import { UserChip } from '@components/users';
import { getObjectsByCatalog, NewObject, Object, useAddObjectsToCatalog, useCreateObjects, useRemoveObjectsFromCatalog } from '@api/object';
import { ObjectDisplay, SelectionAction } from '@components/objects/object_display';
import { getInfo, getPermissionsForRecord, Permissions } from '@api/meta';
import { useSelector } from 'react-redux';
import { AddEditCatalogPopup } from '@components/catalogs';
import { formatTimestamp } from '@utils/formatters';
import { useErrorReports, useNotifs } from '@hooks/index';
import { UploadObjectsPopup, UploadErrorPopup } from '@components/objects';
import { ErrorMessage } from '@components/general/error';
import { DeleteButton, EditButton, UploadObjButton } from '@components/general/simple_buttons';
import { AppRoutes } from '@config/routes';
import { ConfirmationPopup } from '@components/general';

import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import { ErrorBoundary, useErrorBoundary } from 'react-error-boundary';
import { Comment, CommentEdit, getComment, getEditableComments } from '@api/comment';
import { Card, CardContent, IconButton,CardActionArea} from '@mui/material';
import { ExpandMore } from "@mui/icons-material"
import { ProposalIcon } from '@assets/icons';
import { Link} from 'react-router';
import { CardContainer, CollectionLengthChip, LargeLoadingCard } from '@components/general';
import { cp } from 'fs';

export function CommentCard({ id, user_id }: { id: number, user_id: number }) {
    const { data: comment, isLoading, isError } = getComment(id);
    const { data: perms, isLoading:permsLoading, isError:permsError } = getPermissionsForRecord(id, user_id);

    if (isError || (!isLoading && !comment) || permsError) {
        return (
            <CardContainer>
                <Typography> Error loading comment :( </Typography>
            </CardContainer>
        );
    }

    if (isLoading || permsLoading) {
        return (
            <LargeLoadingCard/>
        );
    }

    return (
        <Link to={`${AppRoutes.proposals}/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <CardContainer>
                <CommentCardContent comment={comment} perms={perms} />
            </CardContainer>
        </Link>
    );
}

// need to deal with the comment edit mode (onEdit)
// need onDelete
// will need to place the comments so that it's clear which are replying to which
export function CommentCardContent({ comment, perms, onEdit, onDelete}: { comment: Comment, perms:Permissions, onEdit: (edits:CommentEdit) => void, onDelete: () => void }) {
    return (
        <Stack direction="column" spacing={2} padding={0.5} alignItems={'flex-start'} justifyContent={"center"} sx={{ width: '100%' }}>
            <Stack direction="row" spacing={2} alignItems={'space-between'} sx={{ width: '100%'  }}>
                {<UserChip id={comment.creator_id} />}
                <Stack direction="row" spacing={2} alignItems={'center'} sx={{ width: '100%' }}>
                    <DeleteButton props={{ "aria-label": "delete proposal", onClick: () => setDeleteProposalOpen(true), disabled: !(perms && perms.can_delete) }} tooltip="Delete this proposal (does not delete the objects)" />
                    <EditButton sx={{ "flex": 1 }} props={{ "aria-label": "edit proposal", onClick: () => setEditOpen(true), disabled: !(perms && perms.can_update) }} tooltip='Edit proposal' />
                </Stack>
            </Stack>
            <Typography variant='body1' sx={{ fontWeight: 'normal' }}>
                {comment.content}
            </Typography>
        </Stack>
    );
}

function Comment() {}
import { useState, useEffect } from 'react';
import { Box, Button, Grid, IconButton, CardMedia, CardContent, Typography, Card, useMediaQuery, Tooltip } from '@mui/material'
import SuspenseLoader from 'src/components/SuspenseLoader'
import AccessTime from '@mui/icons-material/AccessTime';
import { AlertColor } from '@mui/material/Alert';
import { useTaskService } from "src/services/tasks-service";
import { useWeb3Utils } from 'src/hooks/Web3UtilsHook';
import { useTheme } from '@mui/system';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Close from '@mui/icons-material/Close';
import Check from '@mui/icons-material/Check';
import { useSnackBar } from 'src/contexts/SnackBarContext';
import { ethers } from 'ethers';
import { set } from 'date-fns';

/**
 * CardTasks Component
 *
 * A component that displays a card for an NFT representing a task.
 *
 * @component
 * @param taskId - ID of the Task
 * @param taskData - An array of TaskFront objects representing task data obtained from the Solidity contract function getTask().
 * @param loading - A boolean indicating whether the data is still loading.
 * @returns Card NFT to display
 */


export const CardTask = ({ taskId, taskData, loading }: any) => {
    const { startTask, reviewTask, completeTask, cancelTask, hasMemberRole, hasLeaderRole, hasVoted, getMinQuorum, getQuorumApprovals } = useTaskService();
    const [openError, setOpenError] = useState(false);
    const [error, setError] = useState<string>();
    const [action, setAction] = useState<string>();
    const { userAddress } = useWeb3Utils();
    const [approvals, setApprovals] = useState<string>();
    const [isMember, setIsMember] = useState<boolean>(false);
    const [isLeader, setIsLeader] = useState<boolean>(false);
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

    const { showSnackBar } = useSnackBar();

    const handleSnackbar = (message: string, color: AlertColor) => {
        showSnackBar(message, color)
    };

    const getAction = async (status: string) => {
        switch (status) {
            case "Created":
                setAction("Start Task")
                break;
            case "Progress":
                setAction("Review Task")
                break;
            case "Review":
                setAction("Review Task")
                break;
            default:
                break;
        }
    }

    const handleAction = async () => {
        try {
            switch (taskData.status) {
                case "Created":
                    await startTask(BigInt(taskId));
                    handleSnackbar('Task Start process initiated with success!', 'info')
                    break;
                case "Progress":
                    await reviewTask(BigInt(taskId), "Hello, I already finished");
                    handleSnackbar('Review Task process initiated with success!', 'info')
                    break;
                case "Review":
                    await reviewTask(BigInt(taskId), "Awesome, contact me on Discord!");
                    handleSnackbar('Review Task process initiated with success!', 'info')
                    break;
                default:
                    break;
            }

        } catch (error) {
            setError(error.message)
            setOpenError(true);
        }
    };

    const handleCancel = async () => {
        try {
            await cancelTask(BigInt(taskId));
            handleSnackbar('Cancel Task process initiated with success!', 'warning')
        } catch (error) {
            setError(error.message)
            setOpenError(true);
        }
    }

    const handleConfirm = async () => {
        try {
            await completeTask(BigInt(taskId));
            handleSnackbar('Complete Task process initiated with success!', 'info')
        } catch (error) {
            setError(error.message)
            setOpenError(true);
        }
    }

    const handleApprovals = async () => {
        try {
            const approvals = await getQuorumApprovals(taskId);
            const minQuorum = await getMinQuorum();
            const remain = " (" + String(approvals) + "/" + String(minQuorum) + ")";
            setApprovals(remain);
        } catch (error) {
            setError(error.message)
            setOpenError(true);
        }        
    }

    useEffect(() => {
        if (taskData != null) {
            getAction(taskData.status);
            handleApprovals();
            hasLeaderRole(userAddress()).then(result => {
                setIsLeader(result);
                hasMemberRole(userAddress()).then(result => {
                    setIsMember(result);
                })
            })
        }
    }, [])

    const copyContent = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            handleSnackbar("Copy to Clipboard", 'info')
        } catch (err) {
            console.error('Failed to copy: ', err);
            handleSnackbar("Failed to copy to clipboard", 'error')
        }
    }

    return (

        <Grid item xs={'auto'} sm={'auto'} md={'auto'} lg={'auto'}>

            {loading ? (
                <SuspenseLoader />
            ) : (
                <>
                    {taskData ? (

                        <Box display="flex" flexDirection={isSmallScreen ? 'column' : 'row'} alignItems="center" >
                            <Box display='flex' justifyContent={'center'} alignContent={'center'} >
                                <Box sx={{ position: 'relative' }}>
                                    <Card sx={{ width: 277, height: 277 }}>
                                        <CardMedia
                                            sx={{ width: 277, height: 277 }}
                                            component="img"
                                            image={taskData.metadata}
                                            alt={'taskData'}
                                        />
                                        <CardContent sx={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '42px',
                                            color: 'white',
                                            padding: '0px',
                                            textAlign: 'center',
                                            fontFamily: 'Istok Web',
                                            fontWeight: '400'
                                        }}>
                                            <Typography
                                                gutterBottom
                                                variant="body2"
                                                style={{
                                                    textAlign: isSmallScreen ? 'left' : 'center',
                                                    // marginLeft: isSmallScreen ? 'auto' : 'unset',
                                                    backgroundColor: '#000000',
                                                }}
                                            >
                                                Reward {ethers.utils.formatEther(taskData.reward)} ETH
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Box>
                            </Box>

                            <Box flexDirection={'column'} height={'282px'} width={'432px'} >
                                <CardContent>
                                    <Box>
                                        <Box display={'flex'} justifyContent="space-between" alignItems="center"  >
                                            <Typography gutterBottom variant="h3" component="div" textAlign={'left'} >
                                                {taskData.title}
                                            </Typography>
                                            <Box display={'flex'} justifyContent="space-between" alignItems="center">
                                        
                                            {
                                                isLeader && taskData.status != "Canceled" &&
                                                <Tooltip key={"top"} placement={"top"} title="Approvals">
                                                    <Typography >                                                    
                                                        {approvals}
                                                    </Typography>
                                                </Tooltip>
                                            }                                            

                                            {
                                                isLeader && taskData.status != "Canceled" &&
                                                <Tooltip key={"top"} placement={"top"} title="Complete Task">
                                                    <IconButton color="primary" 
                                                        onClick={handleConfirm}>
                                                    <Check />
                                                    </IconButton>
                                                </Tooltip>
                                            }
                                                
                                            {
                                                isLeader && taskData.status != "Canceled" &&
                                                <Tooltip key={"top"} placement={"top"} title="Cancel Task">
                                                    <IconButton color="primary" 
                                                        onClick={handleCancel}>
                                                    <Close />
                                                    </IconButton>
                                                </Tooltip>
                                            }

                                            <Tooltip key={"top"} placement={"top"} title="Share URL">
                                                <IconButton color="primary"
                                                    onClick={copyContent}>
                                                    <OpenInNewIcon />
                                                </IconButton>
                                            </Tooltip>
                                            </Box>
                                        </Box>
                                        <Typography gutterBottom variant='subtitle2' component="div">
                                            #{taskId}
                                        </Typography>

                                    </Box>

                                    <Box mt={4}>
                                        <Typography gutterBottom variant="h5" component="div" textAlign={'right'}>
                                            Creator Role ID: {taskData.creatorRole}
                                        </Typography>
                                        <Typography gutterBottom variant="h5" component="div" textAlign={'right'}>
                                            Authorized Role ID: [{taskData.authorizedRoles}]
                                        </Typography>
                                        <Typography gutterBottom variant="h5" component="div" textAlign={'right'}>
                                            Assignee: {taskData.assignee}
                                        </Typography>
                                    </Box>

                                    <Box display={'flex'} justifyContent="space-between" mt={6} >
                                        {
                                            taskData.status != "Completed" && taskData.status != "Canceled" &&
                                            <Button

                                                variant="contained"
                                                component="span"
                                                onClick={handleAction}
                                            >
                                                {action}
                                            </Button>
                                        }
                                        <Button
                                            startIcon={<AccessTime />}
                                            variant="contained"
                                            component="span"
                                        >
                                            End Date: {taskData.endDate}
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Box>
                        </Box >

                    ) : (
                        console.log('Error Getting Card')
                    )
                    }

                </>
            )
            }

        </Grid >

    )
}

export default CardTask
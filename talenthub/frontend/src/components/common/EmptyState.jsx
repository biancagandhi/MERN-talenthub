import {Box, Typography,Button} from "@mui/material"
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined"

const EmptyState=({
title='No Data Found',
message='There is nothing to display..',
buttonText,
onButtonClick,
})=>{
    return(
        <Box
        sx={{py:8,display:'flex', flexDirection:'column',alignItems:'center',textAlign:'center'}}>
            <InboxOutlinedIcon
            sx={{fontSize:70,color:'text.disabled',mb:2}}/>
            <Typography color='text.secondary'>{message}</Typography>
            {buttonText && (
                <Button variant="contained" onClick={onButtonClick}>{buttonText}</Button>
            )}
        </Box>
    )
}
export default EmptyState;
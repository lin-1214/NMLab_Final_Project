import styled from "@emotion/styled";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding-top: 50px;
    height: min(90dvmax, 1400px);
    width: min(90dvmax, 700px);
    margin: auto;
`;
export const ChatBoxesWrapper = styled(Tabs)`
    width: 100%;
    height: 70vh;
    background: #eeeeee52;
    border-radius: 10px;
    margin: 20px;
    padding: 20px;
    overflow: auto;
`;
export const ChatBox = styled.div`
    width: 100%;
    height: min(70dvmax, 650px);
    background: #eeeeee52;
    padding: 10px;
    overflow: auto;
`;
export const FootRef = styled.div`
    height: 40px;
`;

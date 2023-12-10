import { Button, Input } from "@mui/material";
import { useState } from "react";
import styled from "@emotion/styled";
import { useUserData } from "../hooks/useUserData";
import { displayStatus } from "./ChatRoom";
import Title from "../components/Title";
const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 350px;
    margin: auto;
`;
const SignIn = () => {
    const { userName, setNowUser } = useUserData();
    const [enteredName, setEnteredName] = useState("");
    console.log("enteredName", enteredName);
    const handleSubmit = () => {
        if (enteredName === "") {
            displayStatus({
                type: "error",
                msg: "Please Enter Your Name!",
            });
            return;
        }
        console.log("submit", enteredName);
        setNowUser(enteredName);
        setEnteredName("");
    };
    return (
        <Wrapper>
            <Title></Title>
            <Input
                placeholder="Type your name..."
                value={enteredName === null ? userName : enteredName}
                onChange={(e) => setEnteredName(e.target.value)}
                onSubmit={handleSubmit}
                onKeyDown={(e) => {
                    if (e.key == "Enter") {
                        handleSubmit();
                        // put the login here
                    }
                }}
                autoFocus
            ></Input>
        </Wrapper>
    );
};

export default SignIn;

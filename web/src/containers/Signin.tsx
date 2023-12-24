import {
    Button,
    Input,
    Tabs,
    Tab,
    TextField,
    FormControl,
    OutlinedInput,
    InputLabel,
    IconButton,
    InputAdornment,
    CircularProgress,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import SendIcon from "@mui/icons-material/Send";
import DangerousIcon from "@mui/icons-material/Dangerous";
import React, { useState, SyntheticEvent, MouseEvent, useEffect, FC } from "react";
import useChat from "../hooks/useChat";
import { useUserData } from "../hooks/useUserData";
import { displayStatus } from "./ChatRoom";
import Title from "../components/Title";
import "./styles/SignIn.scss";

const SignIn = () => {
    interface RegPaylaod {
        state: string;
        userName: string;
        password: string;
        pincode?: string;
        company: string;
    }

    interface LoginPayload {
        state: string;
        userName: string;
        password: string;
        company: string;
    }

    const {
        userName,
        setNowUser,
        userPassword,
        setNowPassword,
        userPinCode,
        setNowPinCode,
        setCompany,
        setSignedIn,
    } = useUserData();
    const [enteredName, setEnteredName] = useState("");
    const [enteredPassword, setEnteredPassword] = useState("");
    const [enteredPinCode, setEnteredPinCode] = useState("");
    const [checkPassword, setCheckPassword] = useState("");
    const [enteredCompany, setEnteredCompany] = useState("");
    const [value, setValue] = useState("login");
    const [showPassword, setShowPassword] = useState(false);
    const [showCheckedPassword, setShowCheckedPassword] = useState(false);
    const [waitingForVerify, setWaitingForVerify] = useState(false);
    const [verifyFail, setVerifyFail] = useState(false);
    const [showPinCode, setShowPinCode] = useState(false);
    const { sendLoginData, sendRegisterData, askVP, setSignInCallBack, setSignInFailCallBack } =
        useChat();

    const handleClickShowPassword = () => setShowPassword((show: boolean) => !show);
    const handleClickShowCheckedPassword = () => setShowCheckedPassword((show: boolean) => !show);
    const handleClickShowPinCode = () => setShowPinCode((show: boolean) => !show);
    const handleMouseDownPassword = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };
    const handleMouseDownCheckedPassword = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };
    const handleMouseDownPinCode = (event: MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };
    const handleChange = (event: SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };

    const handleSignUp = (event: SyntheticEvent) => {
        if (enteredName === "" || enteredPassword === "" || checkPassword !== enteredPassword) {
            displayStatus({
                type: "error",
                msg: "Information loss or password not match!",
            });
            return;
        } else {
            const payload: RegPaylaod = {
                state: "register",
                userName: enteredName,
                password: enteredPassword,
                company: enteredCompany,
            };
            // TODO: Send payload to RPi for encryption
            sendRegisterData(payload);
            setNowUser(enteredName);
            setNowPassword(enteredPassword);
            setNowPinCode(enteredPinCode);
            setCompany(enteredCompany);
            handleWait(() => {
                console.log("Sign up success");
                setSignedIn(true);
                setCheckPassword("");
                setEnteredPassword("");
            });
        }
    };
    const handleSignIn = async (event: SyntheticEvent) => {
        if (enteredName === "" || enteredPassword === "") {
            console.log("Information loss or password not match!");
            displayStatus({
                type: "error",
                msg: "Information loss or password not match!",
            });
            return;
        }

        const payload: LoginPayload = {
            state: "login",
            userName: enteredName,
            password: enteredPassword,
            company: enteredCompany,
        };
        // TODO: Check info in database
        sendLoginData(payload);
        setNowUser(enteredName);
        setNowPassword(enteredPassword);
        setCompany(enteredCompany);
        handleWait(() => {
            console.log("Sign in success");
            setSignedIn(true);
            setCheckPassword("");
            setEnteredPassword("");
        });
    };

    const handleWait = (callback: () => void) => {
        console.log("Waiting for verification");
        setWaitingForVerify(true);
        setSignInCallBack(() => callback);
        const failCallBack = () => {
            setVerifyFail(true);
            setTimeout(() => {
                setVerifyFail(false);
                setWaitingForVerify(false);
            }, 3000);
        };
        setSignInFailCallBack(() => failCallBack);
    };
    // useEffect(() => {
    //     let payload = {
    //         enteredName: enteredName,
    //         enteredPassword: enteredPassword,
    //         pinCode: enteredPinCode,
    //         checkPassword: checkPassword,
    //     };
    //     console.log("payload: ", payload);
    // }, [enteredName, enteredPassword, enteredPinCode, checkPassword]);

    return (
        <div className="Wrapper">
            <div className="LoginBox">
                <Title></Title>
                {value === "login" ? (
                    <>
                        <div className="Logo"></div>
                        <div className="Intro2">
                            Welcome to SSC! Join us and enjoy the convenience and security of
                            Stellar!
                        </div>
                    </>
                ) : (
                    <>
                        <div className="Intro2">
                            Fill in the below information to join our Stellar community!
                        </div>
                    </>
                )}
                <Tabs className="Tab" value={value} onChange={handleChange}>
                    <Tab value="login" label="Login" />
                    <Tab value="register" label="Register" />
                </Tabs>
                {value === "login" ? (
                    <div className="LoginContent">
                        <FormControl sx={{ m: 1, width: "30dvw" }} variant="outlined">
                            <InputLabel htmlFor="outlined-adornment-username">Username</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-username"
                                label="Username"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                    setEnteredName(event.target.value)
                                }
                            />
                        </FormControl>
                        <FormControl sx={{ m: 1, width: "30dvw" }} variant="outlined">
                            <InputLabel htmlFor="outlined-adornment-company">Company</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-company"
                                label="Company"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                    setEnteredCompany(event.target.value)
                                }
                            />
                        </FormControl>
                        <FormControl sx={{ m: 1, width: "30dvw" }} variant="outlined">
                            <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-password"
                                type={showPassword ? "text" : "password"}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                    setEnteredPassword(event.target.value);
                                }}
                                label="Password"
                            />
                        </FormControl>
                        <Button
                            variant="contained"
                            endIcon={
                                waitingForVerify ? (
                                    !verifyFail ? (
                                        <CircularProgress color="inherit" size={20} />
                                    ) : (
                                        <DangerousIcon color="inherit" />
                                    )
                                ) : (
                                    <SendIcon />
                                )
                            }
                            onClick={handleSignIn}
                            disabled={enteredName === "" || enteredPassword === ""}
                        >
                            SignIn
                        </Button>
                    </div>
                ) : (
                    <div className="RegisterContent">
                        <FormControl sx={{ m: 1, width: "30dvw" }} variant="outlined">
                            <InputLabel htmlFor="outlined-adornment-username">Username</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-username"
                                label="Username"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                    setEnteredName(event.target.value)
                                }
                            />
                        </FormControl>
                        <FormControl sx={{ m: 1, width: "30dvw" }} variant="outlined">
                            <InputLabel htmlFor="outlined-adornment-company">Company</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-company"
                                label="Company"
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                    setEnteredCompany(event.target.value)
                                }
                            />
                        </FormControl>
                        <FormControl sx={{ m: 1, width: "30dvw" }} variant="outlined">
                            <InputLabel htmlFor="outlined-adornment-password">Password</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-password"
                                type={showPassword ? "text" : "password"}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPassword}
                                            onMouseDown={handleMouseDownPassword}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                    setEnteredPassword(event.target.value)
                                }
                                label="Password"
                            />
                        </FormControl>
                        <FormControl sx={{ m: 1, width: "30dvw" }} variant="outlined">
                            <InputLabel htmlFor="outlined-adornment-password-check">
                                Confirm Password
                            </InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-password-check"
                                type={showCheckedPassword ? "text" : "password"}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowCheckedPassword}
                                            onMouseDown={handleMouseDownCheckedPassword}
                                            edge="end"
                                        >
                                            {showCheckedPassword ? (
                                                <VisibilityOff />
                                            ) : (
                                                <Visibility />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                    setCheckPassword(event.target.value)
                                }
                                label="Confirm Password"
                            />
                        </FormControl>
                        {/* <FormControl sx={{ m: 1, width: "30dvw" }} variant="outlined">
                            <InputLabel htmlFor="outlined-adornment-username">
                                Pin Code (6-digit)
                            </InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-password"
                                type={showPinCode ? "text" : "password"}
                                endAdornment={
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={handleClickShowPinCode}
                                            onMouseDown={handleMouseDownPinCode}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                }
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                    setEnteredPinCode(event.target.value)
                                }
                                label="PinCode"
                            />
                        </FormControl> */}

                        {/* Useless */}

                        <Button
                            variant="contained"
                            endIcon={
                                waitingForVerify ? (
                                    !verifyFail ? (
                                        <CircularProgress color="inherit" size={20} />
                                    ) : (
                                        <DangerousIcon color="inherit" />
                                    )
                                ) : (
                                    <SendIcon />
                                )
                            }
                            onClick={handleSignUp}
                            disabled={
                                enteredName === "" ||
                                enteredPassword === "" ||
                                enteredCompany === "" ||
                                checkPassword !== enteredPassword
                            }
                        >
                            SignUp
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SignIn;

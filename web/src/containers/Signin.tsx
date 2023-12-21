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
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import SendIcon from "@mui/icons-material/Send";

import { useState, SyntheticEvent, MouseEvent, React, useEffect } from "react";
import { useUserData } from "../hooks/useUserData";
import { displayStatus } from "./ChatRoom";
import Title from "../components/Title";
import "./styles/SignIn.scss";

const SignIn = () => {
  const { userName, setNowUser } = useUserData();
  const { password, setNowPassword } = useUserData();
  const { pinCode, setNowPinCode } = useUserData();
  const [enteredName, setEnteredName] = useState("");
  const [enteredPassword, setEnteredPassword] = useState("");
  const [enteredPinCode, setEnteredPinCode] = useState("");
  const [checkPassword, setCheckPassword] = useState("");
  const [value, setValue] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showCheckedPassword, setShowCheckedPassword] = useState(false);
  const [showPinCode, setShowPinCode] = useState(false);

  const handleClickShowPassword = () =>
    setShowPassword((show: boolean) => !show);

  const handleClickShowPinCode = () => setShowPinCode((show: boolean) => !show);

  const handleClickShowCheckedPassword = () =>
    setShowCheckedPassword((show: boolean) => !show);

  const handleMouseDownPassword = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleMouseDownCheckedPassword = (
    event: MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const handleMouseDownPinCode = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleChange = (event: SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const handleSignUp = (event: SyntheticEvent) => {
    if (
      enteredName === "" ||
      enteredPassword === "" ||
      enteredPinCode === "" ||
      checkPassword !== password
    ) {
      displayStatus({
        type: "error",
        msg: "Information loss or password not match!",
      });
      return;
    }
    setNowUser(enteredName);
    setNowPassword(enteredPassword);
    setNowPinCode(enteredPinCode);
    const payload = {
      userName: enteredName,
      userPassword: enteredPassword,
      userPinCode: enteredPinCode,
    };

    // TODO: Send payload to RPi for encryption
    console.log("Sign up success");
  };

  const handleSignIn = (event: SyntheticEvent) => {
    if (enteredName === "" || enteredPassword === "") {
      console.log("Information loss or password not match!");
      displayStatus({
        type: "error",
        msg: "Information loss or password not match!",
      });
      return;
    }

    setNowUser(enteredName);
    setNowPassword(enteredPassword);
    setNowPinCode(enteredPinCode);
    // TODO: Check info in database
    const payload = {
      userName: enteredName,
      userPassword: enteredPassword,
    };
    console.log("Sign in success");
  };

  useEffect(() => {
    let payload = {
      enteredName: enteredName,
      enteredPassword: enteredPassword,
      pinCode: enteredPinCode,
      checkPassword: checkPassword,
    };
    console.log("payload: ", payload);
  }, [enteredName, enteredPassword, enteredPinCode, checkPassword]);

  return (
    <div className="Wrapper">
      <div className="LoginBox">
        <Title></Title>
        {value === "login" ? (
          <>
            <div className="Logo"></div>
            <div className="Intro">
              Welcome to SSC! Join us to enjoy the convenience and security of
              Stellar!
            </div>
          </>
        ) : (
          <>
            <div className="Intro">
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
            <FormControl sx={{ m: 1, width: "50ch" }} variant="outlined">
              <InputLabel htmlFor="outlined-adornment-username">
                Username
              </InputLabel>
              <OutlinedInput
                id="outlined-adornment-password"
                label="Username"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setEnteredName(event.target.value)
                }
              />
            </FormControl>
            <FormControl sx={{ m: 1, width: "50ch" }} variant="outlined">
              <InputLabel htmlFor="outlined-adornment-password">
                Password
              </InputLabel>
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
              endIcon={<SendIcon />}
              onClick={handleSignIn}
            >
              SignIn
            </Button>
          </div>
        ) : (
          <div className="RegisterContent">
            <FormControl sx={{ m: 1, width: "50ch" }} variant="outlined">
              <InputLabel htmlFor="outlined-adornment-username">
                Username
              </InputLabel>
              <OutlinedInput
                id="outlined-adornment-password"
                label="Username"
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setEnteredName(event.target.value)
                }
              />
            </FormControl>
            <FormControl sx={{ m: 1, width: "50ch" }} variant="outlined">
              <InputLabel htmlFor="outlined-adornment-password">
                Password
              </InputLabel>
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
            <FormControl sx={{ m: 1, width: "50ch" }} variant="outlined">
              <InputLabel htmlFor="outlined-adornment-password">
                Confirm Password
              </InputLabel>
              <OutlinedInput
                id="outlined-adornment-password"
                type={showCheckedPassword ? "text" : "password"}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowCheckedPassword}
                      onMouseDown={handleMouseDownCheckedPassword}
                      edge="end"
                    >
                      {showCheckedPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  setShowCheckedPassword(event.target.value)
                }
                label="Password"
              />
            </FormControl>
            <FormControl sx={{ m: 1, width: "50ch" }} variant="outlined">
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
            </FormControl>

            {/* Useless */}
            <FormControl sx={{ m: 1, width: "50ch" }} variant="outlined">
              <InputLabel htmlFor="outlined-adornment-username">
                Company (Optional)
              </InputLabel>
              <OutlinedInput id="outlined-adornment-password" label="Company" />
            </FormControl>
            <Button
              variant="contained"
              endIcon={<SendIcon />}
              onClick={handleSignUp}
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

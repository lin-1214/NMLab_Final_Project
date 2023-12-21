import {
  FC,
  createContext,
  useState,
  useContext,
  useEffect,
  React,
} from "react";

interface UserDataProps {
  userName: string;
  userPassword: string;
  userPinCode: string;
  signedIn: boolean;
  setNowUser: (name: string) => void;
  setLogOut: () => void;
}
const UserData = createContext<UserDataProps>({
  userName: "",
  userPassword: "",
  userPinCode: "",
  signedIn: false,
  setNowUser: () => {},
  setNowPassWord: () => {},
  setNowPinCode: () => {},
  setLogOut: () => {},
});
const LOCALSTORAGE_KEY = "save-me";
const savedMe = localStorage.getItem(LOCALSTORAGE_KEY);
interface UserDataProviderProps {
  children: React.ReactNode;
}
const UserDataProvider: FC<UserDataProviderProps> = (props) => {
  const [name, setUserName] = useState(savedMe || "");
  const [password, setPassword] = useState(savedMe || "");
  const [pinCode, setPinCode] = useState(savedMe || "");
  const [signedIn, setSignedIn] = useState(false);
  const setNowUser = (name: string) => {
    setUserName(name);
    setSignedIn(true);
  };
  const setLogOut = () => {
    setSignedIn(false);
  };
  useEffect(() => {
    if (signedIn) {
      localStorage.setItem(LOCALSTORAGE_KEY, name);
    }
  }, [name, password, signedIn]);

  return (
    <UserData.Provider
      value={{
        userName: name,
        password: password,
        pinCode: pinCode,
        signedIn: signedIn,
        setNowUser,
        setLogOut,
      }}
      {...props}
    ></UserData.Provider>
  );
};
const useUserData = () => {
  return useContext(UserData);
};

export { UserDataProvider, useUserData };

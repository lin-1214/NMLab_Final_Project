import asyncio
import json
import os
import websockets
import pickle
import subprocess
import random
from Crypto.Util import number
# Add modules here in case u need

# Build websocket server
PORT = 8000
HOST = "127.0.0.1"

challenge = number.getPrime(128)

# utils function
async def hash(target):
    # TODO: Hash password, pinCode
    
    return ""             # return hash value
 
async def signature(target):
    # TODO: Sign challenge

    return "", ""             # return signature & verifier

# create handler for each connection
async def handler(websocket, path):
    data = await websocket.recv()
    print(f"Data recieved: {data}")
    data = json.loads(data)

    data["challenge"] = challenge
    # test data
    # state: "register", "login", "message"
    # data = {"state":"register", "userName":"1","password":"111","pincode":"111111","challenge":"c4n't_HESOYAM_7h15_c4n_y0u"}
    encrypted_payload = {}
    
    if (data["state"] == "register"):
        # TODO: Encrypt data with the function
        hashed_pw = await hash(data["password"])
        hashed_pc = await hash(data["pincode"])
        sig, pub_key = await signature(data["challenge"])

        encrypted_payload = {"state":data["state"] ,"userName":data["userName"],"password":hashed_pw,"pincode":hashed_pc,"signature":sig, "publicKey":pub_key}

    elif (data["state"] == "login"):
        # data = {state: "login", userName: user.userName, password: password, 
        # hashedPassword: user.password,signature: user.signature,publicKey: user.publicKey,}
        hashed_pw = await hash(data["password"])
        if (hashed_pw != data["hashedPassword"]):
            encrypted_payload = {"state":data["state"] , "loginStatus": "failed"}
        # elif ():     use fapi to verify signature by
        else: 
            encrypted_payload = {"state":data["state"] , "loginStatus": "success"}

    elif (data["state"] == "message"):
        encrypted_payload = {}

    else:
        print("state error! Please check the state of data")    
    
    # Send back payload
    print(f"encrypted payload: {encrypted_payload}")
    dataString = str(encrypted_payload)
    await websocket.send(dataString)


start_server = websockets.serve(handler, HOST, PORT)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()






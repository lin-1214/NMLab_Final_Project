import asyncio
import json
import websockets
from Crypto.Util import number
# Add modules here in case u need
import requests
from flask import request
from tpm2_pytss.FAPI import FAPI
import hashlib
import base64

fapi = FAPI()
# fapi.create_key("/HS/SRK/sign_key", "exportable")

# Build websocket server
PORT = 8000
HOST = "0.0.0.0"
name_private_pair = {}

def encoder(target):
    return base64.b64encode(target).decode('utf-8')


# utils function
async def hash(target):
    # TODO: Hash password, pinCode
    if type(target) == str:
        target = target.encode()
    sha256 = hashlib.sha256(target)
    digest = sha256.digest()
    return digest             # return hash value

async def signature(pt, key_path):
    # TODO: Sign message
    # fapi.create_key("/HS/SRK/sign_key")
    # print(target1+target2)
    digest = await hash(pt)
    print(digest)
    signature, public_key, _ = fapi.sign(key_path, digest, "rsa_ssa")
    return signature, public_key              # return signature & verifier

# create handler for each connection
async def handler(websocket, path):
    req = await websocket.recv()
    print(f"Data recieved: {req}")
    data = json.loads(req)
    data = json.loads(data)
    print(data, type(data))

    task = ""
    data["state"] = str(data["state"]).lower()
    data["name"] = data["userName"]
    if (data["state"] in ["register", "login"]):
        # data: {"state", "username", "company"}
        print("-----------------------")
        print("Register")
        full_name = data["userName"] + data["company"]
        key_path = f"/HS/SRK/{full_name}_key"
        try:
            fapi.create_key(key_path, "exportable")
            print("create key success")
        except:
            print("key exist!")

        exportData = fapi.export_key(key_path)
        exportData = json.loads(exportData)
        print(type(exportData))
        public_key = str(exportData["pem_ext_public"][27:-26].replace("\n", ""))
        print(f"public key: {public_key}")
        name_private_pair[full_name] = public_key

        # payload = {"publicKey": public_key}
        task = data["state"].capitalize()
        data["publicKey"] = public_key
        print("Done registration")
        print("-----------------------")
    elif (data["state"] == "sign"):
        # data: {"state", "username", "company", "message"}
        print("-----------------------")
        print("Signature")
        print("data:",data)
        full_name = data["userName"] + data["company"]
        key_path = f"/HS/SRK/{full_name}_key"
        sig, pub = await signature(data["message"], key_path)
        
        print(f"signature: {len(sig)}")
        print(f"public key: {pub}")
        
        task = "Signature"
        data["signature"] = encoder(sig)
        data["publicKey"] = encoder(pub)
        print("Done signature")
        print("-----------------------")

    #elif (data["state"] == "message"):
        # data: {"state", "message", "publicKey"}


    else:
        print("state error! Please check the state of data")


    # Send back payload
    if (data["state"] == "sign"):
        digest = await hash(data["message"])
        try:
            fapi.verify_signature(key_path, digest, sig)
            print("SUCCESS!")
        except:
            print("FAILED!")
        print(f"Payload send to Website: {data}")
    dataString = str([task, data])
    await websocket.send(dataString)


start_server = websockets.serve(handler, HOST, PORT)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()

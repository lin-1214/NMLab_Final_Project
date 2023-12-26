import asyncio
import json
import websockets
from Crypto.Util import number
from Crypto.Signature import pkcs1_15
from Crypto.PublicKey import RSA
from Crypto.Hash import SHA256
# Add modules here in case u need
import requests
from flask import request
import hashlib
import base64

# read key from file
import os 

def get_key(storePath = "data"):
    f = open(f"{storePath}/private.pem", "rb")
    private_key = f.read()
    f.close()
    f = open(f"{storePath}/public.pem", "rb")
    public_key = f.read()
    f.close()
    private_key = RSA.import_key(private_key)
    public_key = RSA.import_key(public_key)
    return private_key, public_key

# fapi.create_key("/HS/SRK/sign_key", "exportable")

# Build websocket server
PORT = 8000
HOST = "127.0.0.1"
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
    private_key, public_key = get_key()
    _hash = SHA256.new(pt.encode())
    print("_hash", _hash.digest().hex())
    sign = pkcs1_15.new(private_key)
    signature = sign.sign(_hash)
    return signature, public_key.export_key()             # return signature & verifier


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
        print("-----------------------")
        print("Register")
        full_name = data["userName"] + data["company"]
        print(f"full name: {full_name}")
        private_key, public_key = get_key()
        name_private_pair[full_name] = public_key
        task = data["state"].capitalize()
        data["publicKey"] = public_key.export_key().decode('ascii')
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
        print("#######################")
        print(f"signature: {encoder(sig)}")
        print(f"publicKey: {pub}")
        print("#######################")
        
        task = "Signature"
        data["signature"] = encoder(sig)
        data["publicKey"] = encoder(pub)
        print("Done signature")
        print("-----------------------")

    else:
        print("state error! Please check the state of data")


    # Send back payload
    if (data["state"] == "sign"):
        _hash = SHA256.new(data["message"].encode())
        try:
            # verify the signature
            _private_key, _public_key = get_key()
            sign = pkcs1_15.new(_public_key)
            sign.verify(_hash, sig)
            print("SUCCESS!")
        except Exception as e:
            print("FAILED!")
            print(e)
            print("-----------------------")
        print(f"Payload send to Website: {data}")
    dataString = str([task, data])
    await websocket.send(dataString)


start_server = websockets.serve(handler, HOST, PORT)
print(f"Server is running@ { HOST }:{ PORT }")
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()

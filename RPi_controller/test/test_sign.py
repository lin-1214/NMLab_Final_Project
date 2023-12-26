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

def encoder(target):
    return base64.b64encode(target).decode('ascii')
# utils function
async def hash(target):
    # TODO: Hash password, pinCode
    if type(target) == str:
        target = target.encode()
    sha256 = hashlib.sha256(target)
    print(f"sha256 = {sha256.digest().hex()}")
    digest = sha256.digest()
    return digest             # return hash value

async def sign(pt, key_path="data"):
    # TODO: Sign message
    private_key, public_key = get_key(key_path)
    digest = await hash(pt)
    myhash = SHA256.new(pt.encode())
    print("hash : ", myhash.digest().hex())
    sign = pkcs1_15.new(private_key)
    signature = sign.sign(myhash)
    return signature, public_key.export_key()             # return signature & verifier



challenge = "hello world"
signature, verifier = asyncio.run(sign(challenge, "data"))
print(f"signature = {encoder(signature)}")
# print(f"{verifier = }")


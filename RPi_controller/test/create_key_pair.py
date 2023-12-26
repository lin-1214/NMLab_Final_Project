from Crypto.PublicKey import RSA
import os
# Generate RSA key and store

storePath = "data"
os.makedirs(storePath,exist_ok=True)
key = RSA.generate(2048)
private_key = key.export_key()
file_out = open(f"{storePath}/private.pem", "wb")
file_out.write(private_key)
file_out.close()

public_key = key.publickey().export_key()
file_out = open(f"{storePath}/public.pem", "wb")
file_out.write(public_key)
file_out.close()

path = "D:/CareerConsultation/CareerConsultation/backend/.env"
with open(path, "rb") as f:
    raw = f.read()
print("First 20 bytes (hex):", raw[:20].hex())
print("---")
print("Full repr:")
print(repr(raw))
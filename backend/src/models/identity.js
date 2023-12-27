import mongoose from "mongoose";
const Schema = mongoose.Schema;
// Creating a schema, sort of like working with an ORM
const IdentitySchema = new Schema({
    userName: {
        type: String,
        required: [true, "Name field is required."],
    },
    password: {
        type: String,
        // required: [true, "Password field is required."],
    },
    pincode: {
        type: String,
        // required: [true, "Pincode field is required."],
    },
    signature: {
        type: String,
        // required: [true, "Signature field is required."],
    },
    publicKey: {
        type: String,
        // required: [true, "Verifier field is required."],
    },
    company: {
        type: String,
        // required: [true, "Company field is required."],
    },
});
// Creating a table within database with the defined schema
const Identity = mongoose.model("Identity", IdentitySchema);
// Exporting table for querying and mutating
export default Identity;

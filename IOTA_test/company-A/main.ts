// Copyright 2020-2022 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
import { createVC } from "./src/create_vc";
import { createVP } from "./src/create_vp";
import { create_company } from "./src/create_company_did";
import { parse } from "ts-command-line-args";
import { updateVerificationMethod } from "./src/update_did";
import { JwkMemStore, KeyIdMemStore, Storage } from "@iota/identity-wasm/node";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { didControlsDid } from "./src/did_controls_did";

interface ICopyFilesArguments {
    task: string;
    companyName?: string;
    employeeName?: string;
    help?: boolean;
}
export const args = parse<ICopyFilesArguments>(
    {
        task: String,
        companyName: {
            type: String,
            alias: "c",
            optional: true,
            description: "Create a company DID with the given name (if task is 'create_company')",
        },
        employeeName: {
            type: String,
            alias: "e",
            optional: true,
            description:
                "Create a employee DID with the given name (if task is 'create_employee_did')",
        },
        help: { type: Boolean, optional: true, alias: "h", description: "Prints this usage guide" },
    },
    {
        helpArg: "help",
        headerContentSections: [{ header: "IOTA function", content: "" }],
        footerContentSections: [{ header: "Copyright@", content: "SSC Corp. inc." }],
    }
);

// ✅ write to file SYNCHRONOUSLY
function syncWriteFile(filename: string, data: string, flag: "w" | "a+" = "w") {
    /**
     * flags:
     *  - w = Open file for reading and writing. File is created if not exists
     *  - a+ = Open file for reading and appending. The file is created if not exists
     */
    writeFileSync(join(__dirname, filename), data, { flag });

    const contents = readFileSync(join(__dirname, filename), "utf-8");
    console.log(contents);

    return contents;
}

async function main() {
    // Extract example name.
    args.task = args.task.toLowerCase();
    console.log("----------------------");
    console.log("task:", args.task);
    console.log("----------------------");
    const path = "data/companyInfo1.json";
    const basePath = join(__dirname, "data/companyInfo1.json");
    switch (args.task) {
        case "1":
        case "create_did":
            console.log("Creating DID...");
            const companyName = args.companyName || "company-A";
            console.log("companyName:", companyName);
            const [address, createID, mnemonic] = (await create_company(companyName)) as string[];
            console.log("createDid:", createID);
            const info = JSON.stringify({
                name: companyName,
                id: createID,
                mnemonic,
                url: `https://${companyName.replace(" ", "")}.org/`,
                walletAddress: address,
            });
            syncWriteFile(path, info);
            break;
        case "2":
        case "create_employee":
            console.log("Creating employee DID...");
            const employeeName = args.employeeName || "Alice";
            const companyInfo1 = JSON.parse(readFileSync(basePath, "utf-8"));
            const {
                name: companyName1,
                id: companyID1,
                mnemonic: companyMnemonic1,
                employees: employees1,
            } = companyInfo1;
            console.log("employeeName:", employeeName);
            console.log("companyID1:", companyID1);
            const [employeeID, employeeMnemonic] = await didControlsDid(
                companyID1,
                companyMnemonic1,
                companyName1,
                employeeName
            );
            const new_employee = { name: employeeName, id: employeeID };
            const new_employees = employees1 ? [...employees1, new_employee] : [new_employee];
            const new_company_info = JSON.stringify({
                ...companyInfo1,
                employees: new_employees,
            });
            syncWriteFile(path, new_company_info);
            console.log("done.");
            break;
        case "3":
        case "create_vc":
            console.log("Creating VC...");
            const companyInfo3 = JSON.parse(readFileSync(basePath, "utf-8"));
            const {
                name: companyName3,
                id: companyID3,
                mnemonic: companyMnemonic3,
                employees: vc_employees,
                url: companyURL3,
            } = companyInfo3;
            const companyStorage: Storage = new Storage(new JwkMemStore(), new KeyIdMemStore());
            await updateVerificationMethod(companyID3, companyMnemonic3, companyStorage);
            console.log("Issuer DID updated");
            let new_employees3 = [];
            for (let i = 0; i < vc_employees.length; i++) {
                const vc = await createVC(
                    companyID3,
                    companyMnemonic3,
                    companyURL3,
                    companyStorage,
                    vc_employees[i].id,
                    {
                        name: vc_employees[i].name,
                        company: companyURL3,
                    }
                );
                new_employees3.push({ ...vc_employees[i], vc });
            }
            const new_company_info3 = JSON.stringify({
                ...companyInfo3,
                employees: new_employees3,
            });
            syncWriteFile(path, new_company_info3);
            console.log("done.");
            break;
        // return await createVC(companyID, companyMnemonic);
        case "4":
        case "update_did":
            console.log("Not support update");
            // console.log("Updating DID...");
            // const companyInfo2 = JSON.parse(readFileSync(basePath, "utf-8"));
            // const {
            //     id: companyID2,
            //     mnemonic: companyMnemonic2,
            //     employees: employees2,
            //     url: companyURL2,
            // } = companyInfo2;
            // const storage: Storage = new Storage(new JwkMemStore(), new KeyIdMemStore());
            // await updateVerificationMethod(companyID2, companyMnemonic2, storage);
            break;
        default:
            throw "Unknown example name: '" + args.task + "'";
    }
}

main().catch((error) => {
    console.log("Example error:", error);
});

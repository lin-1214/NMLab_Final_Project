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
import { verifyVP } from "./src/verify_vp";
import exp = require("constants");

interface ICopyFilesArguments {
    task: string;
    companyName: string;
    employeeName?: string;
    help?: boolean;
    challenge?: string;
}
interface EmployeeProps {
    name: string;
    id?: string;
    vc?: string;
    vp?: string;
}
export const args = parse<ICopyFilesArguments>(
    {
        task: { type: String, alias: "t", description: "Task to run" },
        companyName: {
            type: String,
            alias: "c",
            // optional: true,
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
        challenge: { type: String, optional: true, alias: "n", description: "challenge" },
    },
    {
        helpArg: "help",
        headerContentSections: [{ header: "My IOTA function", content: "" }],
        footerContentSections: [
            {
                header: "Example:",
                content: [
                    "create company DID\t: -t 1 -c SSC",
                    "create employ DID\t: -t 2 -c SSC -e Bob",
                    "create employ VC\t: -t 3 -c SSC",
                    "create employ VP\t: -t 4 -c SSC -e Bob -n challenge",
                    "verify employ VP\t: -t 5 -c SSC -e Bob -n challenge",
                ],
            },
        ],
    }
);

// write to file SYNCHRONOUSLY
function syncWriteFile(path: string, data: string, flag: "w" | "a+" = "w") {
    /**
     * flags:
     *  - w = Open file for reading and writing. File is created if not exists
     *  - a+ = Open file for reading and appending. The file is created if not exists
     */
    writeFileSync(path, data, { flag });

    const contents = readFileSync(path, "utf-8");
    console.log(contents);

    return contents;
}
export async function create_company_did(companyName: string, storePath: string) {
    console.log("Creating DID...");
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
    syncWriteFile(storePath, info);
}

export async function create_employee_did(
    employeeName: string,
    companySourcePath: string,
    storePath: string
) {
    console.log("Creating employee DID...");
    const companyInfo = JSON.parse(readFileSync(companySourcePath, "utf-8"));
    const {
        name: companyName,
        id: companyID,
        mnemonic: companyMnemonic,
        employees: employees,
    } = companyInfo;
    console.log("companyName:", companyName);
    console.log("employeeName:", employeeName);
    const [employeeID, employeeMnemonic] = (await didControlsDid(
        companyID,
        companyMnemonic,
        companyName,
        employeeName
    )) as string[];
    const new_employee = { name: employeeName, id: employeeID };
    const new_employees = employees ? [...employees, new_employee] : [new_employee];
    const new_company_info = JSON.stringify({
        ...companyInfo,
        employees: new_employees,
    });
    syncWriteFile(storePath, new_company_info);
}
export async function create_employees_vc(companySourcePath: string, storePath: string) {
    const companyInfo = JSON.parse(readFileSync(companySourcePath, "utf-8"));
    const {
        name: companyName,
        id: companyID,
        mnemonic: companyMnemonic,
        employees: employees,
        url: companyURL,
    } = companyInfo;
    console.log("companyName:", companyName);
    const companyStorage: Storage = new Storage(new JwkMemStore(), new KeyIdMemStore());
    await updateVerificationMethod(companyID, companyMnemonic, companyStorage);
    let new_employees = [];
    for (let i = 0; i < employees.length; i++) {
        const vc = await createVC(
            companyID,
            companyMnemonic,
            companyURL,
            companyStorage,
            employees[i].id,
            {
                name: employees[i].name,
                company: companyURL,
            }
        );
        new_employees.push({ ...employees[i], vc });
    }
    const new_company_info3 = JSON.stringify({
        ...companyInfo,
        employees: new_employees,
    });
    syncWriteFile(storePath, new_company_info3);
}
export async function create_employees_vp(
    employeeName: string,
    challenge: string,
    companySourcePath: string,
    storePath: string
) {
    if (challenge || challenge === "") throw "challenge is required";

    const companyInfo = JSON.parse(readFileSync(companySourcePath, "utf-8"));
    const {
        name: companyName,
        id: companyID,
        mnemonic: companyMnemonic,
        employees: vp_employees,
        url: companyURL,
    } = companyInfo;
    const targetEmployee = vp_employees.find((e: EmployeeProps) => e.name === employeeName);
    if (!targetEmployee) {
        throw "Employee not found";
    } else if (!targetEmployee.vc) {
        throw "Employee VC not found";
    }
    const employeeStorage: Storage = new Storage(new JwkMemStore(), new KeyIdMemStore());
    try {
        await updateVerificationMethod(targetEmployee.id, companyMnemonic, employeeStorage);
    } catch (e) {
        console.log("updateVerificationMethod failed");
    }
    const vp = await createVP(
        targetEmployee.id,
        companyMnemonic,
        employeeStorage,
        targetEmployee.vc,
        challenge
    );
    const new_employees = vp_employees.map((e: EmployeeProps) => {
        return e.name === employeeName ? { ...e, vp } : e;
    });
    const new_company_info = JSON.stringify({
        ...companyInfo,
        employees: new_employees,
    });
    syncWriteFile(storePath, new_company_info);
}
export async function verify_employees_vp(
    employeeName: string,
    challenge: string,
    companySourcePath: string
) {
    if (challenge || challenge === "") throw "challenge is required";
    const companyInfo = JSON.parse(readFileSync(companySourcePath, "utf-8"));
    const { employees: vp_employees5 } = companyInfo;
    const targetEmployee = vp_employees5.find((e: EmployeeProps) => e.name === employeeName);
    if (!targetEmployee) {
        throw "Employee not found";
    } else if (!targetEmployee.vp) {
        throw "Employee VP not found";
    }
    console.log(`${employeeName} DID updated`);
    const verified = await verifyVP(targetEmployee.vp, challenge);
    console.log("VP verified:", verified);
}
async function main() {
    // Extract example name.
    args.task = args.task.toLowerCase();
    console.log("----------------------");
    console.log("task:", args.task);
    console.log("----------------------");

    const companyName = args.companyName;
    const path = `data/${companyName}.json`;
    const wholePath = join(__dirname, path);
    switch (args.task) {
        case "1":
        case "create_did":
            return await create_company_did(companyName, wholePath);
        case "2":
        case "create_employee":
            return await create_employee_did(args.employeeName || "Alice", wholePath, wholePath);
        case "3":
        case "create_vc":
            console.log("Creating employee VC...");
            return await create_employees_vc(wholePath, wholePath);
        case "4":
        case "create_vp":
            console.log("Creating VP...");
            const employeeName4 = args.employeeName || "Alice";
            const challenge4 = args.challenge || "challenge";
            console.log("Company:", companyName);
            console.log("Employee:", employeeName4);
            console.log("challenge:", challenge4);
            return await create_employees_vp(employeeName4, challenge4, wholePath, wholePath);
        case "5":
        case "verify_vp":
            console.log("Verifying VP...");
            const employeeName5 = args.employeeName || "Alice";
            const challenge5 = args.challenge || "challenge";
            console.log("Company:", companyName);
            console.log("Employee:", employeeName5);
            console.log("challenge:", challenge5);
            return await verify_employees_vp(employeeName5, challenge5, wholePath);
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

// Copyright 2020-2022 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
import { parse } from "ts-command-line-args";
import { join } from "path";
import {
    create_company_did,
    create_employee_did,
    create_employees_vc,
    create_employees_vp,
    verify_employees_vp,
    syncWriteFile,
} from "./method";
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
                    "create employee DID\t: -t 2 -c SSC -e Bob",
                    "create employee VC\t: -t 3 -c SSC",
                    "create employee VP\t: -t 4 -c SSC -e Bob -n challenge",
                    "verify employee VP\t: -t 5 -c SSC -e Bob -n challenge",
                ],
            },
        ],
    }
);
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

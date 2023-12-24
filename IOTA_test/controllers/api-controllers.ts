import { Request, Response, NextFunction } from "express";
import { createVP } from "../method/src/create_vp";
import { create_employees_vp, verify_employees_vp } from "../method/method";
import { join } from "path";

export class ApiControllers {
    getHomePage(request: Request, response: Response, next: NextFunction) {
        response.type("text/plain");
        response.status(200).send("Hello, world!");
    }

    async getVP(request: Request, response: Response, next: NextFunction) {
        const data = request.query as { company: string; name: string; challenge: string };
        const wholePath = join(__dirname, `../method/data/${data.company}.json`);
        console.log("received getVP request:", data);
        try {
            const vp = await create_employees_vp(data.name, data.challenge, wholePath, wholePath);
            // console.log("create vp success:", vp);
            response.type("text/plain");
            response.status(200).send(vp);
        } catch (e) {
            response.type("text/plain");
            // console.log("create vp failed:", e);
            response.status(400).send(`Cannot create VP for ${data.name}`);
        }
    }
    async verifyVP(request: Request, response: Response, next: NextFunction) {
        const data = request.query as {
            company: string;
            name: string;
            vp: string;
            challenge: string;
        };
        response.type("text/plain");
        console.log("received verifyVP request:", data);
        const wholePath = join(__dirname, `../method/data/${data.company}.json`);
        try {
            await verify_employees_vp(data.name, data.challenge, wholePath, data.vp);
            response.status(200).send("success");
        } catch (e) {
            response.status(403).send("Verification failed");
        }
    }
}

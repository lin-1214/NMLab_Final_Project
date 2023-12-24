import { Request, Response, NextFunction } from "express";
import { createVP } from "../method/src/create_vp";
import { create_employees_vp, verify_employees_vp } from "../method/method";
import { join } from "path";

export class ApiControllers {
    getHomePage(request: Request, response: Response, next: NextFunction) {
        response.type("text/plain");
        response.status(200);
        response.send("Hello, world!");
    }

    async getVP(request: Request, response: Response, next: NextFunction) {
        const data = request.body as { company: string; name: string; challenge: string };
        const wholePath = join(__dirname, `../method/data/${data.company}.json`);
        try {
            const vp = await create_employees_vp(data.name, data.challenge, wholePath, wholePath);
            response.type("text/plain");
            response.status(200);
            response.send(vp);
        } catch (e) {
            response.type("text/plain");
            response.status(400);
            response.send(`Cannot create VP for ${data.name}`);
        }
    }
    async verifyVP(request: Request, response: Response, next: NextFunction) {
        const data = request.body as { company: string; name: string; challenge: string };
        response.type("text/plain");
        const wholePath = join(__dirname, `../method/data/${data.company}.json`);
        try {
            await verify_employees_vp(data.name, data.challenge, wholePath);
            response.status(200);
            response.send("success");
        } catch (e) {
            response.status(403);
            response.send("Verification failed");
        }
    }
}

import { Magic } from "magic-sdk";

let magic;

if (typeof window !== "undefined") {
    magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_LINK_PK as string);
}

export default magic as Magic;

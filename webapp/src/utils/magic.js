import { Magic } from "magic-sdk";

let magic;

if (typeof window !== "undefined") {
  magic = new Magic(process.env.NEXT_PUBLIC_MAGIC_LINK_PK);
}

export default magic;
